// back_end/config/db.js
const { Pool } = require('pg');

// Configuration de la connexion PostgreSQL (Aiven)
const pool = new Pool({
  user: 'avnadmin',
  host: 'pg-26067e60-artiva-89f9.j.aivencloud.com',
  database: 'defaultdb',
  password: 'AVNS_bENCTxqZSSqesN31hFp',
  port: 11442,
  ssl: {
    rejectUnauthorized: false
  }
});

// Fonction pour tester la connexion
const testConnection = async () => {
  let client;
  try {
    client = await pool.connect();
    await client.query('SELECT NOW()');
    console.log('Connexion à PostgreSQL réussie.');
    return true;
  } catch (err) {
    console.error('Erreur connexion PostgreSQL:', err);
    return false;
  } finally {
    if (client) client.release();
  }
};

// Exports
module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
  testConnection,
};
