// ============================================================
// EMAIL SERVICE
// Envio de emails com nodemailer: password reset, etc
// ============================================================

const nodemailer = require('nodemailer');

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.MAIL_HOST || 'smtp.resend.com',
    port: Number(process.env.MAIL_PORT) || 465,
    secure: process.env.MAIL_SECURE !== 'false', // true por padrão (465)
    auth: {
      user: process.env.MAIL_USER || 'resend',
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

  const fromName = process.env.MAIL_FROM_NAME || 'Vincelo';
  const fromEmail = process.env.MAIL_FROM_EMAIL || 'onboarding@resend.dev';

  await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to: email,
    subject: 'Recuperação de Senha — Vincelo',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#fff;">
        <h2 style="color:#f97316;margin-bottom:8px;">Vincelo</h2>
        <h3 style="color:#111;margin-top:0;">Recuperação de Senha</h3>
        <p style="color:#444;">Você solicitou a redefinição de senha. Clique no botão abaixo para criar uma nova senha:</p>
        <a href="${resetUrl}" style="display:inline-block;margin:16px 0;padding:12px 28px;background:#f97316;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;">Redefinir Senha</a>
        <p style="color:#888;font-size:13px;">Ou copie e cole este link no navegador:<br/><span style="color:#555;">${resetUrl}</span></p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0;"/>
        <p style="color:#aaa;font-size:12px;">Este link expira em 1 hora. Se você não solicitou isso, ignore este email.</p>
      </div>
    `,
    text: `Recuperação de Senha — Vincelo\n\nAcesse o link abaixo para redefinir sua senha:\n\n${resetUrl}\n\nEste link expira em 1 hora. Se você não solicitou isso, ignore este email.`,
  });
}

module.exports = {
  sendPasswordReset,
};
