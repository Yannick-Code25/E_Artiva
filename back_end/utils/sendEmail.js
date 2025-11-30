// back_end/utils/sendEmail.js
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

// Transporteur SMTP unique pour tous les mails
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "artiva.app@gmail.com",
    pass: process.env.EMAIL_PASS || "jvyxovmasunykujs"
  }
});

// ------------------------------
// Envoi du code de connexion (2FA)
// ------------------------------
export const sendLoginCode = async (to, code) => {
  try {
    await transporter.sendMail({
      from: `"Artiva 👋" <${process.env.EMAIL_USER || "artiva.app@gmail.com"}>`,
      to,
      subject: "🔐 Votre code de connexion Artiva",
      text: `Voici votre code temporaire : ${code} (valable 5 minutes)`,
      html: `<p>Votre code temporaire : <b>${code}</b></p>`
    });
    console.log(`[2FA] Code envoyé à ${to}`);
  } catch (err) {
    console.error("[2FA] Erreur lors de l'envoi du code :", err);
    throw err;
  }
};

// ------------------------------
// Envoi du code de réinitialisation de mot de passe
// ------------------------------
export const sendResetPasswordCode = async (to, code) => {
  const htmlContent = `
    <div style="font-family: sans-serif; color:#333;">
      <h2>Réinitialisation de votre mot de passe</h2>
      <p>Voici votre code pour réinitialiser votre mot de passe :</p>
      <p style="font-size:24px; font-weight:bold; text-align:center; margin:20px 0;">
        ${code}
      </p>
      <p>Ce code est valable 1 heure. Si vous n'avez pas demandé cette action, ignorez cet e-mail.</p>
      <p>Merci,<br>L'équipe Artiva</p>
    </div>
  `;
  try {
    await transporter.sendMail({
      from: `"Artiva 👋" <${process.env.EMAIL_USER || "artiva.app@gmail.com"}>`,
      to,
      subject: "🔑 Code de réinitialisation Artiva",
      html: htmlContent
    });
    console.log(`[Reset] Code de réinitialisation envoyé à ${to}`);
  } catch (err) {
    console.error("[Reset] Erreur lors de l'envoi du code :", err);
    throw err;
  }
};

// ------------------------------
// Envoi d'une nouvelle commande : client + admin
// ------------------------------
export const sendNewOrderEmails = async (userEmail, adminEmail, orderData) => {
  try {
    // Email pour le CLIENT
    await transporter.sendMail({
      from: `"Artiva 🛍️" <${process.env.EMAIL_USER || "artiva.app@gmail.com"}>`,
      to: userEmail,
      subject: "🛒 Votre commande a été enregistrée",
      html: `
        <div style="font-family:sans-serif;color:#333;">
          <h2>Merci pour votre commande !</h2>
          <p>Voici les détails :</p>
          <pre style="background:#f5f5f5;padding:10px;border-radius:5px;">
${JSON.stringify(orderData, null, 2)}
          </pre>
          <p>L'équipe Artiva vous remercie 🙏</p>
        </div>
      `
    });

    // Email pour l’ADMIN
    await transporter.sendMail({
      from: `"Artiva 🛍️" <${process.env.EMAIL_USER || "artiva.app@gmail.com"}>`,
      to: adminEmail,
      subject: "📦 Nouvelle commande reçue",
      html: `
        <div style="font-family:sans-serif;color:#333;">
          <h2>Nouvelle commande</h2>
          <p><b>Client :</b> ${userEmail}</p>
          <p><b>Détails :</b></p>
          <pre style="background:#f5f5f5;padding:10px;border-radius:5px;">
${JSON.stringify(orderData, null, 2)}
          </pre>
        </div>
      `
    });

    console.log(`[Order] Emails envoyés à ${userEmail} et admin : ${adminEmail}`);

  } catch (err) {
    console.error("[Order] Erreur lors de l’envoi des emails :", err);
    throw err;
  }
};
