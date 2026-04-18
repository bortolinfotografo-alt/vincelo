// ============================================================
// GOOGLE AUTH CONTROLLER
// Login e cadastro com Google OAuth 2.0
// ============================================================

const crypto = require('crypto');
const passport = require('passport');
const { prisma } = require('../services/db');
const { generateToken, generateRefreshToken } = require('../services/auth.service');
const logger = require('../utils/logger');

// Códigos de troca temporários: code → { token, userId, expiresAt }
// Válidos por 60 segundos — evita JWT na URL (histórico do navegador)
const exchangeCodes = new Map();

function createExchangeCode(token, userId) {
  const code = crypto.randomBytes(32).toString('hex');
  exchangeCodes.set(code, { token, userId, expiresAt: Date.now() + 60_000 });
  return code;
}

function consumeExchangeCode(code) {
  const entry = exchangeCodes.get(code);
  if (!entry) return null;
  exchangeCodes.delete(code);
  if (Date.now() > entry.expiresAt) return null;
  return entry;
}

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

    // Redireciona com código temporário — o JWT não vai na URL
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const code = createExchangeCode(token, user.id);
    res.redirect(`${frontendUrl}/auth/callback?code=${code}`);
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

/**
 * GET /api/google-auth/exchange?code=xxx
 * Troca o código temporário pelo JWT de acesso (uso único, expira em 60s)
 */
function exchangeToken(req, res) {
  const { code } = req.query;
  if (!code) return res.status(400).json({ message: 'Código ausente' });

  const entry = consumeExchangeCode(code);
  if (!entry) return res.status(401).json({ message: 'Código inválido ou expirado' });

  return res.json({ token: entry.token, userId: entry.userId });
}

module.exports = {
  googleAuth,
  googleAuthCallback,
  getCurrentUser,
  exchangeToken,
};