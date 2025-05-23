// ARTIVA/back_end/config/db.js
const { Pool } = require('pg'); // Importe le constructeur Pool du module pg
require('dotenv').config(); // Charge les variables d'environnement du fichier .env

// Crée un nouveau pool de connexions à PostgreSQL
// Le pool gère plusieurs connexions client à la base de données
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || "5432", 10), // Assure que le port est un nombre
  // Tu peux ajouter d'autres options de pool ici si besoin (max connections, idle timeout, etc.)
});

// Exporte une fonction pour exécuter des requêtes
// Cela permet de centraliser la logique de requête et de gérer les erreurs de connexion
module.exports = {
  query: (text, params) => pool.query(text, params),
  // Tu peux aussi exporter le pool directement si tu as besoin de fonctionnalités plus avancées
  pool: pool, 
  // Fonction pour tester la connexion (optionnel mais utile)
  testConnection: async () => {
    let client; // Déclare client ici pour le bloc finally
    try {
      client = await pool.connect(); // Utilise le client pour tester la connexion
      await client.query('SELECT NOW()');
      console.log('Successfully connected to the PostgreSQL database via pool client.');
      return true;
    } catch (err) {
      console.error('Error connecting to the PostgreSQL database via pool client:', err.stack);
      return false;
    } finally {
      if (client) {
        client.release(); // Toujours relâcher le client
      }
    }
  }
};
