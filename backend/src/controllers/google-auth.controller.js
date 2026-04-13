// ============================================================
// GOOGLE AUTH CONTROLLER
// Login e cadastro com Google OAuth 2.0
// ============================================================

const passport = require('passport');
const { prisma } = require('../services/db');
const { generateToken, generateRefreshToken } = require('../services/auth.service');
const logger = require('../utils/logger');

// Middleware para iniciar o processo de autenticação com Google
function googleAuth(req, res, next) {
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
}

// Middleware para lidar com o callback do Google
function googleAuthCallback(req, res, next) {
  passport.authenticate('google', async (err, user) => {
    if (err) {
      logger.error('[GOOGLE-AUTH] Error authenticating user', { error: err.message });
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/login?error=google_auth_failed`);
    }

    if (!user) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/login?error=no_user_found`);
    }

    // Gera tokens JWT
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    // Define o refresh token no cookie
    const COOKIE_OPTIONS = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 dias
      path: '/',
    };

    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

    // Redireciona para o frontend com o token de acesso
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/auth/callback?token=${token}&userId=${user.id}`);
  })(req, res, next);
}

// Endpoint para obter o usuário logado via Google
async function getCurrentUser(req, res) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        freelancer: true,
        company: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    return res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      phone: user.phone,
      description: user.description,
      avatar: user.avatar,
      emailVerified: user.emailVerified,
      freelancer: user.freelancer,
      company: user.company,
    });
  } catch (error) {
    logger.error('[GOOGLE-AUTH] Error getting current user', { error: error.message });
    return res.status(500).json({ message: 'Erro ao obter dados do usuário' });
  }
}

module.exports = {
  googleAuth,
  googleAuthCallback,
  getCurrentUser,
};