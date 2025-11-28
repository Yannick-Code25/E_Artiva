const db = require("../config/db.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sendLoginCode, sendResetPasswordCode } = require("../utils/sendEmail.js");
require('dotenv').config();

// ==========================
// UTILITAIRE
// ==========================
function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6 chiffres
}

// ==========================
// RESET MOT DE PASSE PAR CODE
// ==========================
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email requis" });

  try {
    const userResult = await db.query(
      "SELECT id, email FROM users WHERE email=$1",
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(200).json({
        message: "Si ce compte existe, un code de réinitialisation a été envoyé."
      });
    }

    const user = userResult.rows[0];

    const code = generateCode();
const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // UTC string
console.log("Insertion code reset:", user.id, code, expiresAt);

await db.query(
  `INSERT INTO password_reset_codes (user_id, code, expires_at) VALUES ($1, $2, $3)`,
  [user.id, code, expiresAt]
);


    await sendResetPasswordCode(user.email, code);

    res.status(200).json({
      message: "Si ce compte existe, un code de réinitialisation a été envoyé."
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

const resetPasswordWithCode = async (req, res) => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) {
    return res.status(400).json({ message: "Email, code et nouveau mot de passe requis." });
  }

  try {
    const userResult = await db.query("SELECT id FROM users WHERE email=$1", [email]);
    if (userResult.rows.length === 0) return res.status(404).json({ message: "Utilisateur introuvable." });

    const user = userResult.rows[0];
const codeResult = await db.query(
  `SELECT * FROM password_reset_codes
   WHERE user_id=$1 AND code=$2 AND is_used=false AND expires_at > NOW() AT TIME ZONE 'UTC'`,
  [user.id, code]
);


    if (codeResult.rows.length === 0) {
      return res.status(400).json({ message: "Code invalide ou expiré." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, parseInt(process.env.PASSWORD_SALT_ROUNDS || "10"));
    await db.query("UPDATE users SET password_hash=$1 WHERE id=$2", [hashedPassword, user.id]);
    await db.query("UPDATE password_reset_codes SET is_used=true WHERE id=$1", [codeResult.rows[0].id]);

    res.json({ message: "Mot de passe réinitialisé avec succès." });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// ==========================
// REGISTER USER
// ==========================
const registerUser = async (req, res) => {
  const { name, email, password, address, phone } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ message: "Nom, email et mot de passe requis" });

  try {
    const existingUser = await db.query("SELECT * FROM users WHERE email=$1", [email]);
    if (existingUser.rows.length > 0)
      return res.status(409).json({ message: "Utilisateur déjà existant" });

    const hashedPassword = await bcrypt.hash(password, parseInt(process.env.PASSWORD_SALT_ROUNDS || "10"));
    const newUser = await db.query(
      `INSERT INTO users (name,email,password_hash,address,phone)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING id,name,email,role`,
      [name, email, hashedPassword, address, phone]
    );

    res.status(201).json({ message: "Utilisateur créé !", user: newUser.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ==========================
// LOGIN + ENVOI CODE 2FA
// ==========================
const loginUser = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "Email et mot de passe requis" });

  try {
    // Vérifier admin
    let userResult = await db.query("SELECT * FROM admin WHERE email=$1", [email]);
    if (userResult.rows.length === 0) {
      // Sinon chercher user normal
      userResult = await db.query("SELECT * FROM users WHERE email=$1", [email]);
    }

    if (userResult.rows.length === 0)
      return res.status(401).json({ message: "Email ou mot de passe incorrect" });

    const user = userResult.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch)
      return res.status(401).json({ message: "Email ou mot de passe incorrect" });

    // Générer code 2FA
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 min UTC

    await db.query(
      "INSERT INTO login_codes (user_id, code, expires_at) VALUES ($1,$2,$3)",
      [user.id, code, expiresAt]
    );

    // Envoyer le code par email
    await sendLoginCode(email, code);

    res.status(200).json({ message: "Code envoyé à l'email de l'utilisateur" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ==========================
// VÉRIFICATION CODE 2FA
// ==========================
const verifyLoginCode = async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code)
    return res.status(400).json({ message: "Email et code requis" });

  try {
    const userResult = await db.query(
      "SELECT id, email, name, role FROM users WHERE email=$1",
      [email]
    );
    if (userResult.rows.length === 0)
      return res.status(404).json({ message: "Utilisateur introuvable" });

    const user = userResult.rows[0];
    const codeClean = code.toString().trim();

    const codeResult = await db.query(
      `SELECT * FROM login_codes
       WHERE user_id=$1 AND TRIM(code)=$2 AND is_used=false AND expires_at > NOW() AT TIME ZONE 'UTC'`,
      [user.id, codeClean]
    );

    if (codeResult.rows.length === 0)
      return res.status(400).json({ message: "Code invalide ou expiré" });

    // Marquer le code comme utilisé
    await db.query(
      "UPDATE login_codes SET is_used=true WHERE id=$1",
      [codeResult.rows[0].id]
    );

    // Générer token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, user, message: "Connexion validée avec succès" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ==========================
// ADMIN
// ==========================
const registerAdmin = async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ message: "Nom, email et mot de passe requis" });

  const adminRole = role || "admin";
  if (!["admin", "super_admin"].includes(adminRole))
    return res.status(400).json({ message: "Rôle administrateur invalide" });

  try {
    const existingAdmin = await db.query("SELECT * FROM admin WHERE email=$1", [email]);
    if (existingAdmin.rows.length > 0)
      return res.status(409).json({ message: "Admin déjà existant" });

    const hashedPassword = await bcrypt.hash(password, parseInt(process.env.PASSWORD_SALT_ROUNDS || "10"));
    const newAdmin = await db.query(
      "INSERT INTO admin (name,email,password_hash,role) VALUES ($1,$2,$3,$4) RETURNING id,name,email,role",
      [name, email, hashedPassword, adminRole]
    );

    res.status(201).json({ message: "Admin créé", admin: newAdmin.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ==========================
// EXPORT MODULE
// ==========================
module.exports = {
  forgotPassword,
  resetPasswordWithCode,
  registerUser,
  loginUser,
  verifyLoginCode,
  registerAdmin
};
