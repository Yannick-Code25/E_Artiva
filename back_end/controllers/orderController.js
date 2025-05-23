// ARTIVA/back_end/controllers/orderController.js
const db = require('../config/db');

// Récupérer toutes les commandes de l'utilisateur connecté
exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.user.userId; // De authMiddleware

    // Requête pour récupérer les commandes et leurs items
    // C'est un exemple, tu devras l'adapter pour joindre order_items et products
    // pour avoir une structure comme celle attendue par ton frontend.
    // Pour simplifier ici, on ne récupère que les commandes de base.
    const ordersQuery = `
      SELECT 
        o.id as "orderId", 
        o.order_number, 
        o.status, 
        o.total_amount as total, 
        o.currency, 
        o.created_at as "createdAt"
        -- Tu peux ajouter d'autres champs de la table orders ici
      FROM orders o
      WHERE o.user_id = $1
      ORDER BY o.created_at DESC;
    `;
    // Note: "orderId" et "createdAt" sont mis entre guillemets car ils contiennent des majuscules
    // et PostgreSQL les convertit en minuscules par défaut si non spécifié.
    // Ou tu peux les nommer order_id, created_at dans la requête et les renommer dans le code.

    const { rows: orders } = await db.query(ordersQuery, [userId]);

    // Pour chaque commande, tu devrais aussi récupérer les order_items et les produits associés.
    // C'est plus complexe et peut nécessiter une boucle ou une requête SQL plus élaborée (JOINs, agrégation JSON).
    // Exemple simplifié pour la structure attendue par le frontend :
    const ordersWithProducts = await Promise.all(orders.map(async (order) => {
      const itemsQuery = `
        SELECT 
          oi.product_name as "productName", 
          oi.quantity, 
          oi.unit_price
        FROM order_items oi
        WHERE oi.order_id = $1;
      `;
      const { rows: items } = await db.query(itemsQuery, [order.orderId]);
      return { ...order, products: items };
    }));

    res.status(200).json(ordersWithProducts);

  } catch (error) {
    console.error('Erreur lors de la récupération des commandes utilisateur:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération des commandes.' });
  }
};

// Tu ajouteras ici la logique pour créer une commande plus tard
// exports.createOrder = async (req, res) => { ... };