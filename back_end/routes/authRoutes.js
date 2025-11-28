// ARTIVA/back_end/routes/authRoutes.js
const express = require("express");
const router = express.Router();

// Import des fonctions depuis authController
const {
  forgotPassword,
  resetPasswordWithCode,
  registerUser,
  loginUser,
  verifyLoginCode,
  registerAdmin
} = require("../controllers/authController");

// Routes utilisateurs
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/verify-code", verifyLoginCode);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPasswordWithCode);


// Routes admin
router.post("/register-admin", registerAdmin);

module.exports = router;
