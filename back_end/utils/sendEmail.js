// back_end/utils/sendEmail.js
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

// Vérification des variables d'environnement
console.log("EMAIL_USER =", process.env.EMAIL_USER);
console.log("EMAIL_PASS =", process.env.EMAIL_PASS ? "OK" : "MANQUANT");

// Transporteur SMTP unique pour tous les mails

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,          // 👈 important
  secure: true,       // 👈 obligatoire pour 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  connectionTimeout: 20_000, // 20s
  greetingTimeout: 20_000,
  socketTimeout: 20_000,
});


// ------------------------------
// Fonction utilitaire pour envoyer un mail et loguer la réponse SMTP
const sendMailWithLog = async (mailOptions, label) => {
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[${label}] Email envoyé à ${mailOptions.to}`);
    console.log(`[${label}] Réponse Nodemailer :`, {
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
      pending: info.pending,
      envelope: info.envelope
    });
  } catch (err) {
    console.error(`[${label}] Erreur lors de l'envoi :`, err);
    throw err;
  }
};

// ------------------------------
// Envoi du code de connexion (2FA)
export const sendLoginCode = async (to, code) => {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width:500px; margin:auto; padding:20px; border:1px solid #e0e0e0; border-radius:10px; background:#f9f9f9; text-align:center;">
      <h2 style="color:#4CAF50;">Connexion à Artiva</h2>
      <p style="font-size:16px;">Voici votre code temporaire pour vous connecter :</p>
      <div style="font-size:28px; font-weight:bold; margin:20px 0; color:#333;">${code}</div>
      <p style="font-size:14px; color:#666;">Valable 5 minutes. Si vous n'avez pas demandé ce code, ignorez ce message.</p>
      <p style="margin-top:20px; font-size:12px; color:#888;">L'équipe Artiva</p>
    </div>
  `;

  await sendMailWithLog({
    from: `"Artiva 👋" <${process.env.EMAIL_USER}>`,
    to,
    subject: "🔐 Votre code de connexion Artiva",
    html: htmlContent
  }, "2FA");
};

// ------------------------------
// Envoi du code de réinitialisation de mot de passe
export const sendResetPasswordCode = async (to, code) => {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width:500px; margin:auto; padding:20px; border:1px solid #e0e0e0; border-radius:10px; background:#fdfdfd; text-align:center;">
      <h2 style="color:#FF9800;">Réinitialisation de mot de passe</h2>
      <p style="font-size:16px;">Voici votre code pour réinitialiser votre mot de passe :</p>
      <div style="font-size:28px; font-weight:bold; margin:20px 0; color:#333;">${code}</div>
      <p style="font-size:14px; color:#666;">Ce code est valable 1 heure. Si vous n'avez pas demandé cette action, ignorez ce mail.</p>
      <p style="margin-top:20px; font-size:12px; color:#888;">L'équipe Artiva</p>
    </div>
  `;

  await sendMailWithLog({
    from: `"Artiva 👋" <${process.env.EMAIL_USER}>`,
    to,
    subject: "🔑 Code de réinitialisation Artiva",
    html: htmlContent
  }, "Reset");
};

// ------------------------------
// Envoi d'une nouvelle commande : client + admin
export const sendNewOrderEmails = async (userEmail, adminEmail, orderData) => {
  const customerName = orderData.shipping_address?.name || "Cher client";

  const generateItemsTable = (items) => {
    if (!items || items.length === 0) return "<p>Aucun article.</p>";

    const rows = items.map((item, index) => {
      const name = item.product_name || "Produit inconnu";
      const quantity = item.quantity || 0;
      const price = item.subtotal || 0;
      return `
        <tr style="border-bottom:1px solid #ddd;">
          <td style="padding:8px;">${index + 1}</td>
          <td style="padding:8px;">${name}</td>
          <td style="padding:8px; text-align:center;">${quantity}</td>
          <td style="padding:8px; text-align:right;">${price.toLocaleString()} CFA</td>
        </tr>
      `;
    }).join("");

    const total = orderData.amount || items.reduce((sum, item) => sum + (item.subtotal || 0), 0);

    return `
      <table style="width:100%; border-collapse:collapse; margin-top:10px;">
        <thead>
          <tr style="background:#f0f0f0;">
            <th style="padding:8px; text-align:left;">#</th>
            <th style="padding:8px; text-align:left;">Produit</th>
            <th style="padding:8px; text-align:center;">Quantité</th>
            <th style="padding:8px; text-align:right;">Prix</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
          <tr style="font-weight:bold; border-top:2px solid #4CAF50;">
            <td colspan="3" style="padding:8px; text-align:right;">Total</td>
            <td style="padding:8px; text-align:right;">${total.toLocaleString()} CFA</td>
          </tr>
        </tbody>
      </table>
    `;
  };

  // Email CLIENT
  await sendMailWithLog({
    from: `"Artiva 🛍️" <${process.env.EMAIL_USER}>`,
    to: userEmail,
    subject: "🛒 Votre commande a été enregistrée",
    html: `
      <div style="font-family: Arial, sans-serif; max-width:600px; margin:auto; padding:20px; border:1px solid #e0e0e0; border-radius:10px; background-color:#fdfdfd; color:#333;">
        <h2 style="color:#4CAF50;">Merci pour votre commande, ${customerName} !</h2>
        <p>Nous avons bien reçu votre commande. Voici les détails :</p>
        ${generateItemsTable(orderData.items)}
        <p style="margin-top:20px;">L'équipe <b>Artiva</b> vous remercie 🙏</p>
        <hr style="border:none; border-top:1px solid #eee; margin:20px 0;">
        <p style="font-size:12px; color:#888;">Si vous avez des questions, contactez-nous à ${process.env.EMAIL_USER}</p>
      </div>
    `
  }, "Order-Client");

  // Email ADMIN
  await sendMailWithLog({
    from: `"Artiva 🛍️" <${process.env.EMAIL_USER}>`,
    to: adminEmail,
    subject: "📦 Nouvelle commande reçue",
    html: `
      <div style="font-family: Arial, sans-serif; max-width:600px; margin:auto; padding:20px; border:1px solid #e0e0e0; border-radius:10px; background-color:#fdfdfd; color:#333;">
        <h2 style="color:#FF9800;">Nouvelle commande reçue</h2>
        <p><b>Client :</b> ${customerName} (${userEmail})</p>
        <p><b>Détails :</b></p>
        ${generateItemsTable(orderData.items)}
        <p style="margin-top:20px; font-size:12px; color:#888;">Email généré automatiquement par le système Artiva</p>
      </div>
    `
  }, "Order-Admin");

  console.log(`[Order] Emails envoyés à ${userEmail} et admin : ${adminEmail}`);
};
