// ARTIVA/back_end/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// =====================
// Routes utilisateurs
// =====================

// Enregistrer un nouvel utilisateur
router.post('/register', authController.registerUser);

// Connexion d'un utilisateur
router.post('/login', authController.loginUser);

// Vérification du code à 6 chiffres après login
router.post('/verify-login-code', authController.verifyLoginCode);

// =====================
// Routes administrateurs
// =====================

// Enregistrer un nouvel admin
// Pour l'instant accessible à tous (tu pourras ajouter une protection plus tard)
router.post('/admin/register', authController.registerAdmin);

module.exports = router;
