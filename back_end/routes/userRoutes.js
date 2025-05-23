// ARTIVA/back_end/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware'); // Notre middleware JWT

// GET /api/users/me - Récupérer le profil de l'utilisateur connecté
// Cette route est protégée par le authMiddleware
router.get('/me', authMiddleware, userController.getCurrentUserProfile);

// Tu pourrais ajouter d'autres routes utilisateur ici (ex: PUT /api/users/me pour mettre à jour le profil)

module.exports = router;