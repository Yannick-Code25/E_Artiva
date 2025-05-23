// ARTIVA/back_end/routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middlewares/authMiddleware');

// GET /api/orders - Récupérer les commandes de l'utilisateur connecté
router.get('/', authMiddleware, orderController.getUserOrders);

// POST /api/orders - Créer une nouvelle commande (à implémenter plus tard)
// router.post('/', authMiddleware, orderController.createOrder);

module.exports = router;