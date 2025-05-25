// ARTIVA/back_end/controllers/orderController.js
const db = require('../config/db');
const { v4: uuidv4 } = require('uuid'); // Pour générer des order_number uniques si besoin

// --- Créer une nouvelle commande (CLIENT) ---
exports.createOrder = async (req, res) => {
  const userId = req.user.userId; // Récupéré du token JWT via authMiddleware
  const { cart_items, shipping_address, billing_address, shipping_method, shipping_cost, notes, currency } = req.body;
  // cart_items devrait être un tableau d'objets : [{ product_id, quantity }, ...]
  // shipping_address et billing_address devraient être des objets

  if (!cart_items || !Array.isArray(cart_items) || cart_items.length === 0) {
    return res.status(400).json({ message: 'Le panier ne peut pas être vide pour créer une commande.' });
  }
  if (!shipping_address || typeof shipping_address !== 'object') {
    return res.status(400).json({ message: 'L\'adresse de livraison est requise.' });
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    let totalAmount = 0;
    const orderItemsData = [];

    // Vérifier le stock et calculer le total
    for (const item of cart_items) {
      if (!item.product_id || !item.quantity || parseInt(item.quantity, 10) <= 0) {
        throw new Error(`Données d'article de panier invalides pour product_id: ${item.product_id}`);
      }
      const productResult = await client.query('SELECT name, price, stock, sku FROM products WHERE id = $1 FOR UPDATE', [item.product_id]);
      // 'FOR UPDATE' verrouille la ligne pour éviter les conditions de concurrence sur le stock
      
      if (productResult.rows.length === 0) {
        throw new Error(`Produit avec ID ${item.product_id} non trouvé.`);
      }
      const product = productResult.rows[0];
      const quantity = parseInt(item.quantity, 10);

      if (product.stock < quantity) {
        throw new Error(`Stock insuffisant pour le produit: ${product.name} (demandé: ${quantity}, disponible: ${product.stock})`);
      }

      // Mettre à jour le stock
      await client.query('UPDATE products SET stock = stock - $1 WHERE id = $2', [quantity, item.product_id]);
      
      const unitPrice = parseFloat(product.price);
      const subtotal = unitPrice * quantity;
      totalAmount += subtotal;

      orderItemsData.push({
        product_id: item.product_id,
        product_name: product.name, // Stocker le nom au moment de la commande
        sku: product.sku,           // Stocker le SKU au moment de la commande
        quantity: quantity,
        unit_price: unitPrice,
        subtotal: subtotal,
      });
    }

    // Ajouter les frais de port si présents
    const finalShippingCost = parseFloat(shipping_cost) || 0;
    totalAmount += finalShippingCost;

    // Générer un numéro de commande unique
    // Format simple : ORD-TIMESTAMP-RANDOM (tu peux améliorer ça)
    const orderNumber = `ORD-${Date.now()}-${uuidv4().substring(0, 6).toUpperCase()}`;

    // Insérer la commande
    const orderQuery = `
      INSERT INTO orders (
        order_number, user_id, status, total_amount, currency, 
        shipping_address, billing_address, shipping_method, shipping_cost, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, order_number, status, total_amount, created_at;
    `;
    const orderResult = await client.query(orderQuery, [
      orderNumber, userId, 'pending', // Statut initial
      totalAmount.toFixed(2), currency || 'FCFA', // S'assurer de 2 décimales pour le montant
      JSON.stringify(shipping_address), // Stocker l'objet adresse en JSONB
      billing_address ? JSON.stringify(billing_address) : null,
      shipping_method || null,
      finalShippingCost.toFixed(2),
      notes || null
    ]);
    const createdOrder = orderResult.rows[0];

    // Insérer les articles de la commande
    const orderItemsPromises = orderItemsData.map(item => {
      const itemQuery = `
        INSERT INTO order_items (
          order_id, product_id, product_name, sku, quantity, unit_price, subtotal
        ) VALUES ($1, $2, $3, $4, $5, $6, $7);
      `;
      return client.query(itemQuery, [
        createdOrder.id, item.product_id, item.product_name, item.sku, 
        item.quantity, item.unit_price.toFixed(2), item.subtotal.toFixed(2)
      ]);
    });
    await Promise.all(orderItemsPromises);

    // TODO: Vider le panier de l'utilisateur (table cart_items) si la logique du panier est implémentée

    await client.query('COMMIT');
    res.status(201).json({ message: 'Commande créée avec succès!', order: createdOrder });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erreur lors de la création de la commande:', error);
    // Renvoyer un message d'erreur plus spécifique si possible
    if (error.message.includes("Stock insuffisant") || error.message.includes("Produit avec ID") || error.message.includes("Données d'article de panier invalides")) {
        return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Erreur serveur lors de la création de la commande.' });
  } finally {
    client.release();
  }
};


// --- Récupérer les commandes de l'utilisateur connecté (CLIENT) ---
exports.getUserOrders = async (req, res) => {
  // ... (inchangé, déjà bon)
  try {
    const userId = req.user.userId;
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
               oi.quantity, oi.unit_price, oi.subtotal
        FROM order_items oi WHERE oi.order_id = $1;`;
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
// --- (Admin) : Mettre à jour le statut d'une commande ---
exports.updateOrderStatusAdmin = async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body; // Le nouveau statut envoyé par l'admin

  const allowedStatuses = ['pending', 'awaiting_payment', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'failed'];
  if (!status || !allowedStatuses.includes(status)) {
    return res.status(400).json({ message: `Statut invalide. Doit être l'un de: ${allowedStatuses.join(', ')}` });
  }

  const client = await db.pool.connect(); // Utiliser un client pour la transaction
  try {
    await client.query('BEGIN'); // Démarrer la transaction

    // 1. Mettre à jour le statut de la commande
    const updateQuery = `
      UPDATE orders 
      SET status = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2 
      RETURNING id, user_id, order_number, status;`; // Retourner les infos nécessaires pour la notification
    const updateResult = await client.query(updateQuery, [status, orderId]);

    if (updateResult.rows.length === 0) {
      await client.query('ROLLBACK'); // Annuler si la commande n'est pas trouvée
      client.release();
      return res.status(404).json({ message: 'Commande non trouvée pour la mise à jour du statut.' });
    }

    const updatedOrder = updateResult.rows[0];

    // 2. Créer une notification pour l'utilisateur si le statut est pertinent
    let notificationTitle = '';
    let notificationMessage = '';
    let createNotification = false;

    switch (status) {
      case 'processing':
        notificationTitle = 'Votre commande est en préparation !';
        notificationMessage = `Bonne nouvelle ! Votre commande #${updatedOrder.order_number} est maintenant en cours de préparation par nos équipes.`;
        createNotification = true;
        break;
      case 'shipped':
        notificationTitle = 'Votre commande a été expédiée !';
        notificationMessage = `Votre commande #${updatedOrder.order_number} a été expédiée et est en route. Vous pourrez bientôt la suivre.`;
        // Tu pourrais ajouter un lien de suivi ici si tu as cette info: link_url: '/orders/' + updatedOrder.id + '/tracking'
        createNotification = true;
        break;
      case 'delivered':
        notificationTitle = 'Votre commande a été livrée !';
        notificationMessage = `Excellente nouvelle ! Votre commande #${updatedOrder.order_number} a été livrée. Profitez bien de vos articles !`;
        createNotification = true;
        break;
      case 'cancelled':
        notificationTitle = 'Votre commande a été annulée.';
        notificationMessage = `Nous vous informons que votre commande #${updatedOrder.order_number} a été annulée. Veuillez nous contacter pour plus d'informations.`;
        createNotification = true;
        break;
      // Ajoute d'autres cas si nécessaire (ex: 'refunded', 'awaiting_payment' si une action est requise)
    }

    if (createNotification && updatedOrder.user_id) { // S'assurer qu'il y a un user_id
      const notificationQuery = `
         INSERT INTO notifications (user_id, type, title, message, link_url)
         VALUES ($1, 'order_status_update', $2, $3, $4)
      `;
      // Le link_url pourrait pointer vers la page de détail de la commande dans l'app client
      const linkUrl = `/orders/${updatedOrder.id}`; // Adapte ce lien à la structure de route de ton app client
      await client.query(notificationQuery, [
        updatedOrder.user_id, 
        notificationTitle, 
        notificationMessage, 
        linkUrl 
      ]);
      console.log(`Notification créée pour l'utilisateur ${updatedOrder.user_id} concernant la commande ${updatedOrder.id}`);
    }

    await client.query('COMMIT'); // Valider la transaction (mise à jour de la commande + notification)
    res.status(200).json({ message: 'Statut de la commande mis à jour et notification envoyée (si applicable)!', order: updatedOrder });

  } catch (error) {
    await client.query('ROLLBACK'); // Annuler la transaction en cas d'erreur
    console.error(`Erreur admin màj statut commande ${orderId} ou création notification:`, error);
    res.status(500).json({ message: 'Erreur serveur lors de la mise à jour du statut de la commande.' });
  } finally {
    if (client) client.release(); // Toujours relâcher le client
  }
};

