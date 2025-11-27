// back_end/utils/sendEmail.js
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "artiva.app@gmail.com",
    pass: "jvyxovmasunykujs", // mot de passe d’application
  }
});

const sendLoginCode = async (to, code) => {
  try {
    await transporter.sendMail({
      from: '"Artiva 👋" <artiva.app@gmail.com>',
      to,
      subject: "🔐 Votre code de connexion Artiva",
      text: `Bonjour,\n\nMerci de vous connecter à Artiva !\n\nVoici votre code de connexion temporaire : ${code}\n\n⚠️ Ce code est valable pendant 5 minutes. Ne le partagez avec personne.\n\nSi vous n'avez pas demandé ce code, ignorez simplement ce message.\n\nMerci,\nL'équipe Artiva`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2 style="color: #4CAF50;">Bonjour !</h2>
          <p>Merci de vous connecter à <strong>Artiva</strong>.</p>
          <p style="font-size: 20px; font-weight: bold; color: #FF5722;">
            🔐 Votre code de connexion : ${code}
          </p>
          <p>⚠️ Ce code est valable pendant <strong>5 minutes</strong>. Ne le partagez avec personne.</p>
          <p>Si vous n'avez pas demandé ce code, ignorez simplement ce message.</p>
          <br>
          <p>Merci,<br>L'équipe <strong>Artiva</strong> 🌟</p>
        </div>
      `,
    });
    console.log(`Code envoyé avec succès à ${to} : ${code}`);
  } catch (err) {
    console.error("Erreur lors de l'envoi du code :", err);
    throw err;
  }
};


export default sendLoginCode;
