// ARTIVA/back_end/app.js
const express = require('express');
const cors = require('cors');
require('dotenv').config(); // S'assurer que dotenv est chargé tôt


// Importer les routes (nous les créerons plus tard)
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes'); // Ajouter cette ligne
const orderRoutes = require('./routes/orderRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');

const app = express();

// Middlewares
app.use(cors()); // Active CORS pour toutes les routes
app.use(express.json()); // Permet à Express de parser le JSON des corps de requête
app.use(express.urlencoded({ extended: true })); // Permet de parser les données de formulaire URL-encodées

// Route de test simple
app.get('/', (req, res) => {
  res.json({ message: 'Bienvenue sur l\'API Artiva !' });
});

// Utiliser les routes (décommenter quand elles seront créées)
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes); // Monter les routes utilisateur sur /api/users
app.use('/api/orders', orderRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes); // Ajouter cette ligne


// Middleware de gestion des erreurs (très basique pour l'instant)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ error: 'Quelque chose s\'est mal passé !' });
});

module.exports = app; // Exporte l'application Express configurée