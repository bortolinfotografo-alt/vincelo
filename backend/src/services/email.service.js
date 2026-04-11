// ============================================================
// EMAIL SERVICE
// Envio de emails com nodemailer: password reset, etc
// ============================================================

const nodemailer = require('nodemailer');

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT || 587,
    secure: process.env.MAIL_SECURE === 'true',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });
}

/**
 * Envia email de reset de senha com link e token
 * Se MAIL_HOST nao estiver configurado, loga o token no console (dev fallback)
 */
async function sendPasswordReset(email, resetToken) {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const resetUrl = `${frontendUrl}/auth/forgot-password?token=${resetToken}`;

  // Se nao tem credenciais de email configuradas, loga como fallback
  if (!process.env.MAIL_HOST) {
    console.log('===========================================');
    console.log('[DEV] Password reset token para', email);
    console.log('[DEV] Reset URL:', resetUrl);
    console.log('[DEV] Token:', resetToken);
    console.log('===========================================');
    return;
  }

  const transporter = getTransporter();

  await transporter.sendMail({
    from: `"${process.env.MAIL_FROM || 'App Freela'}" <${process.env.MAIL_USER || ''}>`,
    to: email,
    subject: 'Recuperacao de Senha - App Freela',
    html: `
      <h2>Recuperacao de Senha</h2>
      <p>Voce solicitou a recuperacao de senha. Use o link abaixo para criar uma nova senha:</p>
      <p><a href="${resetUrl}" style="background:#6366f1;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;">Redefinir Senha</a></p>
      <p>Ou copie e cole este link no navegador:</p>
      <p>${resetUrl}</p>
      <hr/>
      <p><strong>Token (para uso manual):</strong> <code>${resetToken}</code></p>
      <p>Este link/token expira em 1 hora.</p>
      <p>Se voce nao solicitou isso, ignore este email.</p>
    `,
    text: `Recuperacao de Senha\n\nAcesse o link abaixo para redefinir sua senha:\n\n${resetUrl}\n\nToken: ${resetToken}\n\nEste link expira em 1 hora. Se voce nao solicitou isso, ignore este email.`,
  });
}

module.exports = {
  sendPasswordReset,
};
