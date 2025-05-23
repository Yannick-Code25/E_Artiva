// ARTIVA/back_end/routes/authRoutes.js
const express = require('express');
const router = express.Router(); // Crée un nouveau routeur Express
const authController = require('../controllers/authController'); // Importe notre contrôleur

// Définition des routes
// POST /api/auth/register - pour enregistrer un nouvel utilisateur
router.post('/register', authController.registerUser);

// POST /api/auth/login - pour connecter un utilisateur (à créer plus tard)
 router.post('/login', authController.loginUser);

 // NOUVELLE ROUTE : Enregistrement d'un administrateur
// Cette route pourrait être protégée elle-même (par exemple, accessible seulement par un super_admin existant)
// Pour l'instant, on la laisse ouverte pour faciliter la création du premier admin.
router.post('/admin/register', authController.registerAdmin);

module.exports = router; // Exporte le routeur pour qu'il soit utilisé dans app.js

