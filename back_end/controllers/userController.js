// ARTIVA/back_end/controllers/userController.js
const db = require('../config/db');

// Récupérer les informations de l'utilisateur actuellement connecté (via le token)
exports.getCurrentUserProfile = async (req, res) => {
  try {
    // L'ID de l'utilisateur est disponible via req.user.userId grâce à notre authMiddleware
    const userId = req.user.userId; 
    const userRole = req.user.role; // On peut aussi récupérer le rôle si besoin

    let queryText;
    // Adapter la requête en fonction du rôle si les tables sont différentes (users vs admin)
    // Ou si tu veux renvoyer des champs différents.
    // Pour l'instant, on suppose que l'ID est unique à travers les deux et qu'on veut les infos de la table 'users'
    // si c'est un 'customer', ou 'admin' si c'est un 'admin'.

    if (userRole === 'admin') {
        // Si tu as une table 'admin' séparée et que le token admin vient de là
        queryText = 'SELECT id, name, email, role FROM admin WHERE id = $1';
    } else { // 'customer' ou autre rôle dans la table 'users'
        queryText = 'SELECT id, name, email, address, phone, role FROM users WHERE id = $1';
    }
    
    const { rows } = await db.query(queryText, [userId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }

    // Renvoyer les informations de l'utilisateur (sans le hash du mot de passe)
    res.status(200).json(rows[0]);

  } catch (error) {
    console.error('Erreur lors de la récupération du profil utilisateur:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération du profil.' });
  }
};