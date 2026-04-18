// ============================================================
// RATE LIMIT MIDDLEWARE
// Define limitadores de requisição por IP usando express-rate-limit
// ============================================================

const rateLimit = require('express-rate-limit');

/**
 * Limiter para rotas de autenticação (login, registro)
 * 5 requisições por janela de 15 minutos
 */
// validate.xForwardedForHeader=false: evita erro ERR_ERL_UNEXPECTED_X_FORWARDED_FOR
// no Railway (proxy reverso que sempre injeta X-Forwarded-For).
// O IP real é resolvido via trust proxy configurado no Express (server.js).
const SHARED = { validate: { xForwardedForHeader: false }, standardHeaders: true, legacyHeaders: false };

const authLimiter = rateLimit({
  ...SHARED,
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 20 : 5,
  message: { message: 'Muitas tentativas de autenticação. Tente novamente após 15 minutos.' },
});

const generalLimiter = rateLimit({
  ...SHARED,
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 1000 : 100,
  message: { message: 'Muitas requisições. Tente novamente mais tarde.' },
});

const strictLimiter = rateLimit({
  ...SHARED,
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Muitas requisições a esta rota. Tente novamente após 15 minutos.' },
});

module.exports = {
  authLimiter,
  generalLimiter,
  strictLimiter,
};
