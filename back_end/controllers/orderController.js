// ARTIVA/back_end/controllers/orderController.js
const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const { sendNewOrderEmails } = require("../utils/sendEmail.js"); // <-- AJOUT

// --- Créer une nouvelle commande (CLIENT) ---
exports.createOrder = async (req, res) => {
  const userId = req.user.id;

  const { cart_items, shipping_address, payment_method, notes, currency } = req.body;

  if (!cart_items || !Array.isArray(cart_items) || cart_items.length === 0) {
    return res.status(400).json({ message: 'Le panier ne peut pas être vide pour créer une commande.' });
  }
  if (!shipping_address || typeof shipping_address !== 'object') {
    return res.status(400).json({ message: 'L\'adresse de livraison est requise.' });
  }
  if (!payment_method) {
    return res.status(400).json({ message: 'La méthode de paiement est requise.' });
  }

  const client = await db.pool.connect();

  try {
    console.log("=== Début de la création de commande ===");

    if (!userId) {
      throw new Error("userId non défini. L'utilisateur n'est pas authentifié !");
    }

    await client.query('BEGIN');

    let totalAmount = 0;
    const orderItemsData = [];

    // 1. Vérifier stock + calcul total
    for (const item of cart_items) {
      if (!item.product_id || !item.quantity || parseInt(item.quantity, 10) <= 0) {
        throw new Error(`Données d'article invalides pour product_id: ${item.product_id}`);
      }

      const productResult = await client.query(
        'SELECT name, price, stock, sku FROM products WHERE id = $1 FOR UPDATE',
        [item.product_id]
      );

      if (productResult.rows.length === 0) {
        throw new Error(`Produit ID ${item.product_id} introuvable.`);
      }

      const product = productResult.rows[0];
      const quantity = parseInt(item.quantity, 10);

      if (product.stock < quantity) {
        throw new Error(`Stock insuffisant pour ${product.name}`);
      }

      // MAJ stock
      await client.query(
        'UPDATE products SET stock = stock - $1 WHERE id = $2',
        [quantity, item.product_id]
      );

      const unitPrice = parseFloat(product.price);
      const subtotal = unitPrice * quantity;
      totalAmount += subtotal;

      orderItemsData.push({
        product_id: item.product_id,
        product_name: product.name,
        sku: product.sku,
        quantity,
        unit_price: unitPrice,
        subtotal,
      });
    }

    // Frais de port
    const shippingCost = 0;
    totalAmount += shippingCost;

    // 3. Créer la commande
    const orderNumber = `ORD-${Date.now()}-${uuidv4().substring(0, 6).toUpperCase()}`;

    const orderQuery = `
      INSERT INTO orders (
        order_number, user_id, status, total_amount, currency,
        shipping_address, shipping_cost, notes
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING id, order_number, status, total_amount, created_at;
    `;

    const orderResult = await client.query(orderQuery, [
      orderNumber,
      userId,
      'pending',
      totalAmount.toFixed(2),
      currency || 'FCFA',
      JSON.stringify(shipping_address),
      shippingCost.toFixed(2),
      notes || null
    ]);

    const createdOrder = orderResult.rows[0];

    // 4. Insérer les items
    const itemInserts = orderItemsData.map(item => {
      return client.query(
        `INSERT INTO order_items (
          order_id, product_id, product_name, sku, quantity, unit_price, subtotal
        ) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [
          createdOrder.id,
          item.product_id,
          item.product_name,
          item.sku,
          item.quantity,
          item.unit_price.toFixed(2),
          item.subtotal.toFixed(2)
        ]
      );
    });
    await Promise.all(itemInserts);

    // 5. Paiement
    const paymentStatus = (payment_method === 'cod') ? 'pending' : 'awaiting_payment';
    await client.query(
      `INSERT INTO payments (order_id, payment_method, amount, currency, status)
       VALUES ($1,$2,$3,$4,$5)`,
      [
        createdOrder.id,
        payment_method,
        totalAmount.toFixed(2),
        currency || 'FCFA',
        paymentStatus
      ]
    );

    // 6. Notification
    await client.query(
      `INSERT INTO notifications (user_id, type, title, message, link_url)
       VALUES ($1,'order_placed',$2,$3,$4)`,
      [
        userId,
        'Votre commande a été reçue !',
        `Merci pour votre commande #${createdOrder.order_number}.`,
        `/orders/${createdOrder.id}`
      ]
    );

    // 🔥🔥🔥 7. ENVOI DES EMAILS (client + admin) 🔥🔥🔥
    const adminEmail = process.env.ADMIN_EMAIL || "artiva.app@gmail.com";
    const userEmail = req.user.email; // email du client connecté

    await sendNewOrderEmails(userEmail, adminEmail, {
      order_number: createdOrder.order_number,
      amount: totalAmount,
      currency,
      payment_method,
      items: orderItemsData,
      shipping_address,
    });

    await client.query('COMMIT');

    res.status(201).json({
      message: "Commande créée avec succès et emails envoyés !",
      order: createdOrder
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Erreur création commande :", error);

    if (error.message.includes("Stock insuffisant") || error.message.includes("Produit")) {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: "Erreur serveur lors de la création de la commande." });
  } finally {
    client.release();
  }
};



// --- Récupérer les commandes de l'utilisateur connecté (CLIENT) ---
exports.getUserOrders = async (req, res) => {
  
  try {
    const userId = req.user.id;
    const ordersQuery = `
      SELECT 
        o.id as "orderId", o.order_number, o.status, o.total_amount as total, 
        o.currency, o.created_at as "createdAt", o.updated_at as "updatedAt"
      FROM orders o
      WHERE o.user_id = $1 ORDER BY o.created_at DESC;
    `;
    const { rows: orders } = await db.query(ordersQuery, [userId]);
    
    const ordersWithProducts = await Promise.all(orders.map(async (order) => {
      const itemsQuery = `
        SELECT oi.id as "itemId", oi.product_id, oi.product_name, oi.sku, 
               oi.quantity, oi.unit_price, oi.subtotal,
        p.image_url as "productImageUrl" 
        FROM order_items oi
        LEFT JOIN products p ON oi.product_id = p.id 
        WHERE oi.order_id = $1
        ORDER BY oi.id; `;
      const { rows: items } = await db.query(itemsQuery, [order.orderId]);
      return { ...order, products: items }; // 'products' est ce que le frontend ProfileScreen attendait
    }));
    res.status(200).json(ordersWithProducts);
  } catch (error) {
    console.error('Erreur récupération commandes utilisateur:', error);
    res.status(500).json({ message: 'Erreur serveur récupération commandes.' });
  }
};

// --- (Admin) : Lister TOUTES les commandes avec filtres et pagination ---
exports.getAllOrdersAdmin = async (req, res) => {
  const { status, user_id, date_from, date_to, page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  let query = `
    SELECT 
      o.id as "orderId", o.order_number, o.user_id, u.name as "userName", u.email as "userEmail",
      o.status, o.total_amount as total, o.currency, 
      o.shipping_address, o.billing_address, o.notes,
      o.created_at as "createdAt", o.updated_at as "updatedAt",
      COUNT(*) OVER() AS total_count -- Compte total pour la pagination
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
  `;
  const whereClauses = [];
  const queryParams = [];
  let paramIndex = 1;

  if (status) {
    whereClauses.push(`o.status = $${paramIndex++}`);
    queryParams.push(status);
  }
  if (user_id) {
    whereClauses.push(`o.user_id = $${paramIndex++}`);
    queryParams.push(user_id);
  }
  if (date_from) {
    whereClauses.push(`o.created_at >= $${paramIndex++}`);
    queryParams.push(date_from); // Format YYYY-MM-DD
  }
  if (date_to) {
    // Pour inclure toute la journée, on peut cibler le début du jour suivant
    const nextDay = new Date(date_to);
    nextDay.setDate(nextDay.getDate() + 1);
    whereClauses.push(`o.created_at < $${paramIndex++}`);
    queryParams.push(nextDay.toISOString().split('T')[0]); // Format YYYY-MM-DD
  }

  if (whereClauses.length > 0) {
    query += ` WHERE ${whereClauses.join(' AND ')}`;
  }

  query += ` ORDER BY o.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++};`;
  queryParams.push(limit, offset);
  
  try {
    const { rows } = await db.query(query, queryParams);
    // Le total_count sera le même pour toutes les lignes, on le prend de la première s'il y en a
    const totalItems = rows.length > 0 ? parseInt(rows[0].total_count, 10) : 0;
    const totalPages = Math.ceil(totalItems / limit);

    // Retirer total_count de chaque objet commande avant de renvoyer
    const ordersData = rows.map(({total_count, ...order}) => order);

    res.status(200).json({
        orders: ordersData,
        currentPage: parseInt(page, 10),
        totalPages,
        totalItems
    });
  } catch (error) {
    console.error('Erreur admin récupération toutes les commandes:', error);
    res.status(500).json({ message: 'Erreur serveur récupération commandes (admin).' });
  }
};

// --- (Admin) : Récupérer les détails d'UNE commande spécifique ---
exports.getOrderDetailsAdmin = async (req, res) => {
  // ... (inchangé, déjà bon)
  const { orderId } = req.params;
  try {
    const orderQuery = `
      SELECT 
        o.id as "orderId", o.order_number, o.user_id, u.name as "userName", u.email as "userEmail",u.phone as "userPhone",
        o.status, o.total_amount as total, o.currency, 
        o.shipping_address, o.billing_address, o.notes,
        o.shipping_method, o.shipping_cost,
        o.created_at as "createdAt", o.updated_at as "updatedAt"
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = $1;
    `;
    const orderResult = await db.query(orderQuery, [orderId]);

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ message: 'Commande non trouvée.' });
    }
    const orderDetails = orderResult.rows[0];

    const itemsQuery = `
      SELECT 
        oi.id as "itemId", oi.product_id, oi.product_name, oi.sku,
        oi.quantity, oi.unit_price, oi.subtotal
      FROM order_items oi
      WHERE oi.order_id = $1 ORDER BY oi.id;
    `;
    const itemsResult = await db.query(itemsQuery, [orderId]);
    orderDetails.items = itemsResult.rows; // Renommé en 'items' pour plus de clarté

    res.status(200).json(orderDetails);
  } catch (error) {
    console.error(`Erreur admin récupération commande ${orderId}:`, error);
    res.status(500).json({ message: 'Erreur serveur récupération commande (admin).' });
  }
};

// --- (Admin) : Mettre à jour le statut d'une commande ---
// Version mise à jour pour gérer aussi le statut du paiement pour les commandes 'cod'
exports.updateOrderStatusAdmin = async (req, res) => {
  const { orderId } = req.params;
  const { status: newStatus } = req.body; // Renommé en newStatus pour plus de clarté

  const allowedStatuses = ['pending', 'awaiting_payment', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'failed'];
  if (!newStatus || !allowedStatuses.includes(newStatus)) {
    return res.status(400).json({ message: `Statut invalide. Doit être l'un de: ${allowedStatuses.join(', ')}` });
  }

  const client = await db.pool.connect();
  try {
    // DÉBUT DE LA TRANSACTION : les deux mises à jour (commande et paiement) doivent réussir ou échouer ensemble.
    await client.query('BEGIN');

    // Étape 1 : Mettre à jour le statut de la commande
    const updateOrderQuery = `
      UPDATE orders 
      SET status = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2 
      RETURNING id, user_id, order_number, status;
    `;
    const updateResult = await client.query(updateOrderQuery, [newStatus, orderId]);

    if (updateResult.rows.length === 0) {
      throw new Error('Commande non trouvée.'); // L'erreur sera catchée plus bas
    }
    const updatedOrder = updateResult.rows[0];

    // =====================================================================================
    // NOUVELLE LOGIQUE : Si la commande est marquée comme "livrée"...
    // =====================================================================================
    if (newStatus === 'delivered') {
      // On vérifie si le paiement associé doit être mis à jour.
      const paymentCheckQuery = 'SELECT id, payment_method, status FROM payments WHERE order_id = $1';
      const paymentResult = await client.query(paymentCheckQuery, [orderId]);

      if (paymentResult.rows.length > 0) {
        const payment = paymentResult.rows[0];
        
        // ...ET que la méthode était "paiement à la livraison", ET qu'il est encore "en attente"
        if (payment.payment_method === 'cod' && payment.status === 'pending') {
          // Alors on met à jour le statut du paiement à "réussi" !
          const updatePaymentQuery = `
            UPDATE payments 
            SET status = 'succeeded', paid_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1;
          `;
          await client.query(updatePaymentQuery, [payment.id]);
          console.log(`Paiement COD #${payment.id} pour la commande ${orderId} marqué comme 'succeeded'.`);
        }
      }
    }
    // =====================================================================================

    // Étape 2 : Créer une notification pour l'utilisateur (logique existante)
    let notificationTitle = '';
    let notificationMessage = '';
    // ... votre logique de switch/case pour les notifications ...
    switch (newStatus) {
      case 'processing':
        notificationTitle = 'Votre commande est en préparation !';
        notificationMessage = `Bonne nouvelle ! Votre commande #${updatedOrder.order_number} est maintenant en cours de préparation par nos équipes.`;
        break;
      case 'shipped':
        notificationTitle = 'Votre commande a été expédiée !';
        notificationMessage = `Votre commande #${updatedOrder.order_number} a été expédiée et est en route.`;
        break;
      case 'delivered':
        notificationTitle = 'Votre commande a été livrée !';
        notificationMessage = `Excellente nouvelle ! Votre commande #${updatedOrder.order_number} a été livrée. Profitez bien de vos articles !`;
        break;
      case 'cancelled':
        notificationTitle = 'Votre commande a été annulée.';
        notificationMessage = `Nous vous informons que votre commande #${updatedOrder.order_number} a été annulée. Veuillez nous contacter pour plus d'informations.`;
        createNotification = true;
        break;
      case 'refunded':
        notificationTitle = 'Votre commande vous sera remboursée.';
        notificationMessage = `Nous vous informons que votre commande #${updatedOrder.order_number} a été annulée et vous seras rembourser après examen. Veuillez nous contacter pour plus d'informations.`;
        createNotification = true;
        break;
    }

    if (notificationTitle && updatedOrder.user_id) {
      const linkUrl = `/orders/${updatedOrder.id}`;
      const notificationQuery = `
         INSERT INTO notifications (user_id, type, title, message, link_url)
         VALUES ($1, 'order_status_update', $2, $3, $4)
      `;
      await client.query(notificationQuery, [updatedOrder.user_id, notificationTitle, notificationMessage, linkUrl]);
    }

    // FIN DE LA TRANSACTION : On valide toutes les modifications.
    await client.query('COMMIT');
    res.status(200).json({ message: 'Statut de la commande mis à jour avec succès.', order: updatedOrder });

  } catch (error) {
    await client.query('ROLLBACK'); // Annuler toutes les modifications en cas d'erreur
    console.error(`Erreur admin màj statut commande ${orderId}:`, error.message);
    if (error.message === 'Commande non trouvée.') {
        return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Erreur serveur lors de la mise à jour du statut.' });
  } finally {
    client.release();
  }
};


// NOUVEAU : Récupérer les détails d'UNE commande spécifique pour l'UTILISATEUR CONNECTÉ
exports.getUserOrderDetail = async (req, res) => {
  const userId = req.user.id; // De authMiddleware
  const { orderId } = req.params;

  try {
    const orderQuery = `
      SELECT 
        o.id as "orderId", o.order_number, 
        o.status, o.total_amount as total, o.currency, 
        o.shipping_address, o.billing_address, o.notes,
        o.shipping_method, o.shipping_cost,
        o.created_at as "createdAt", o.updated_at as "updatedAt"
      FROM orders o
      WHERE o.id = $1 AND o.user_id = $2; -- S'ASSURER QUE LA COMMANDE APPARTIENT À L'UTILISATEUR
    `;
    const orderResult = await db.query(orderQuery, [orderId, userId]);

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ message: 'Commande non trouvée ou non accessible.' });
    }
    const orderDetails = orderResult.rows[0];

    // Récupérer les items de la commande
    const itemsQuery = `
      SELECT 
        oi.id as "itemId", oi.product_id, oi.product_name, oi.sku,
        oi.quantity, oi.unit_price, oi.subtotal
        -- Optionnel: joindre products pour avoir l'image actuelle du produit si besoin
        -- , p.image_url as "productImageUrl" 
        -- FROM order_items oi JOIN products p ON oi.product_id = p.id
      FROM order_items oi
      WHERE oi.order_id = $1 ORDER BY oi.id;
    `;
    const itemsResult = await db.query(itemsQuery, [orderId]);
    orderDetails.items = itemsResult.rows.map(item => ({
        ...item,
        // Si tu veux formater le prix ici (sinon le frontend le fera)
        // unit_price: parseFloat(item.unit_price).toFixed(2),
        // subtotal: parseFloat(item.subtotal).toFixed(2),
    }));

    res.status(200).json(orderDetails);
  } catch (error) {
    console.error(`Erreur récupération détail commande ${orderId} pour utilisateur ${userId}:`, error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération des détails de la commande.' });
  }
};