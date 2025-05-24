// ARTIVA/back_end/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware'); // Notre middleware JWT
const adminMiddleware = require('../middlewares/adminMiddleware'); // Nécessaire pour les actions admin

// GET /api/users/me - Récupérer le profil de l'utilisateur connecté
// Cette route est protégée par le authMiddleware
router.get('/me', authMiddleware, userController.getCurrentUserProfile);

// --- Routes Admin pour la gestion des utilisateurs ---

// GET /api/users - Lister tous les utilisateurs (clients) (Admin)
router.get('/', authMiddleware, adminMiddleware, userController.getAllUsers);

// GET /api/users/:id - Récupérer un utilisateur spécifique par son ID (Admin)
router.get('/:id', authMiddleware, adminMiddleware, userController.getUserById);

// PUT /api/users/:id - Mettre à jour un utilisateur (Admin)
router.put('/:id', authMiddleware, adminMiddleware, userController.updateUserByAdmin);

// DELETE /api/users/:id - Supprimer un utilisateur (Admin)
router.delete('/:id', authMiddleware, adminMiddleware, userController.deleteUserByAdmin);

module.exports = router;