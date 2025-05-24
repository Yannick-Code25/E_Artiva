// ARTIVA/back_end/controllers/userController.js
const db = require('../config/db');
// bcrypt sera nécessaire si on permet à l'admin de réinitialiser un mot de passe (non recommandé directement)

// --- Récupérer le profil de l'utilisateur actuellement connecté ---
exports.getCurrentUserProfile = async (req, res) => {
  // ... (ton code existant, qui fonctionne)
  try {
    const userId = req.user.userId; 
    const userRole = req.user.role;
    let queryText;
    if (userRole === 'admin' || userRole === 'super_admin') { // L'admin peut aussi voir son profil via cette route
        queryText = 'SELECT id, name, email, role, created_at, updated_at FROM admin WHERE id = $1';
    } else { 
        queryText = 'SELECT id, name, email, address, phone, role, created_at, updated_at FROM users WHERE id = $1';
    }
    const { rows } = await db.query(queryText, [userId]);
    if (rows.length === 0) return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Erreur récupération profil utilisateur:', error);
    res.status(500).json({ message: 'Erreur serveur récupération profil.' });
  }
};

// --- NOUVEAU (Admin) : Lister tous les utilisateurs (clients) ---
exports.getAllUsers = async (req, res) => {
  try {
    // Sélectionne uniquement les clients (ou tous les utilisateurs sauf les admins si tu les as dans la même table)
    // Exclure les mots de passe hashés !
    const query = `
      SELECT id, name, email, address, phone, role, created_at, updated_at 
      FROM users 
      ORDER BY created_at DESC; 
      -- Tu pourrais ajouter une clause WHERE pour exclure certains rôles si nécessaire
      -- WHERE role = 'customer' OR role = 'vendor' etc.
    `;
    const { rows } = await db.query(query);
    res.status(200).json(rows);
  } catch (error) {
    console.error('Erreur lors de la récupération de tous les utilisateurs:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération des utilisateurs.' });
  }
};

// --- NOUVEAU (Admin) : Récupérer un utilisateur spécifique par son ID ---
exports.getUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const query = `
      SELECT id, name, email, address, phone, role, created_at, updated_at 
      FROM users 
      WHERE id = $1;
    `;
    const { rows } = await db.query(query, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error(`Erreur lors de la récupération de l'utilisateur ${id}:`, error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération de l\'utilisateur.' });
  }
};

// --- NOUVEAU (Admin) : Mettre à jour un utilisateur (ex: rôle, adresse, téléphone) ---
exports.updateUserByAdmin = async (req, res) => {
  const { id } = req.params; // ID de l'utilisateur à mettre à jour
  const { name, email, address, phone, role } = req.body; // Champs modifiables par l'admin

  // Validation : Au moins un champ doit être fourni pour la mise à jour
  if (name === undefined && email === undefined && address === undefined && phone === undefined && role === undefined) {
    return res.status(400).json({ message: 'Aucun champ fourni pour la mise à jour.' });
  }

  // Construire la requête de mise à jour dynamiquement
  const fieldsToUpdate = [];
  const values = [];
  let paramIndex = 1;

  if (name !== undefined) { fieldsToUpdate.push(`name = $${paramIndex++}`); values.push(name); }
  if (email !== undefined) { fieldsToUpdate.push(`email = $${paramIndex++}`); values.push(email); }
  if (address !== undefined) { fieldsToUpdate.push(`address = $${paramIndex++}`); values.push(address); }
  if (phone !== undefined) { fieldsToUpdate.push(`phone = $${paramIndex++}`); values.push(phone); }
  if (role !== undefined) { 
    // Valider le rôle si tu as une liste de rôles permis
    if (!['customer', 'vendor', /* autres rôles valides */].includes(role)) {
        return res.status(400).json({ message: 'Rôle utilisateur invalide.' });
    }
    fieldsToUpdate.push(`role = $${paramIndex++}`); values.push(role); 
  }

  if (fieldsToUpdate.length === 0) { // Devrait être attrapé par la validation précédente, mais par sécurité
    return res.status(400).json({ message: 'Aucun champ valide fourni pour la mise à jour.' });
  }

  fieldsToUpdate.push(`updated_at = CURRENT_TIMESTAMP`); // Toujours mettre à jour updated_at

  const updateQuery = `
    UPDATE users 
    SET ${fieldsToUpdate.join(', ')} 
    WHERE id = $${paramIndex}
    RETURNING id, name, email, address, phone, role, created_at, updated_at;
  `;
  values.push(id);

  try {
    // Vérifier si l'email (s'il est modifié) n'est pas déjà pris par un AUTRE utilisateur
    if (email !== undefined) {
        const emailCheckQuery = 'SELECT id FROM users WHERE email = $1 AND id != $2';
        const emailCheckResult = await db.query(emailCheckQuery, [email, id]);
        if (emailCheckResult.rows.length > 0) {
            return res.status(409).json({ message: 'Cet email est déjà utilisé par un autre compte.' });
        }
    }

    const { rows } = await db.query(updateQuery, values);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé pour la mise à jour.' });
    }
    res.status(200).json({ message: 'Utilisateur mis à jour avec succès!', user: rows[0] });
  } catch (error) {
    console.error(`Erreur lors de la mise à jour de l'utilisateur ${id}:`, error);
    if (error.code === '23505') { // Conflit d'unicité (probablement email)
        return res.status(409).json({ message: 'Conflit de données (ex: email déjà existant).', detail: error.detail });
    }
    res.status(500).json({ message: 'Erreur serveur lors de la mise à jour de l\'utilisateur.' });
  }
};

// --- NOUVEAU (Admin) : Supprimer un utilisateur (CLIENT) ---
// Attention: Réfléchis bien aux implications (commandes associées, etc.)
// ON DELETE SET NULL sur user_id dans orders est une bonne approche.
exports.deleteUserByAdmin = async (req, res) => {
  const { id } = req.params;
  try {
    // Vérifier que l'on ne supprime pas un admin via cette route par erreur
    const userCheck = await db.query('SELECT role FROM users WHERE id = $1', [id]);
    if (userCheck.rows.length > 0 && (userCheck.rows[0].role === 'admin' || userCheck.rows[0].role === 'super_admin')) {
        // Si tes admins sont aussi dans la table 'users'
        // return res.status(403).json({ message: 'Les administrateurs ne peuvent pas être supprimés via cette route.' });
    }

    const deleteQuery = 'DELETE FROM users WHERE id = $1 RETURNING id, name, email, role;';
    const result = await db.query(deleteQuery, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé pour la suppression.' });
    }
    res.status(200).json({ message: 'Utilisateur supprimé avec succès.', user: result.rows[0] });
  } catch (error) {
    console.error(`Erreur lors de la suppression de l'utilisateur ${id}:`, error);
    // Gérer les erreurs de clé étrangère si ON DELETE RESTRICT est utilisé ailleurs
    res.status(500).json({ message: 'Erreur serveur lors de la suppression de l\'utilisateur.' });
  }
};