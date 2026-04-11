// ============================================================
// RATE LIMIT MIDDLEWARE
// Define limitadores de requisição por IP usando express-rate-limit
// ============================================================

const rateLimit = require('express-rate-limit');

/**
 * Limiter para rotas de autenticação (login, registro)
 * 5 requisições por janela de 15 minutos
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Muitas tentativas de autenticação. Tente novamente após 15 minutos.',
  },
});

/**
 * Limiter geral para todas as rotas da API
 * 100 requisições por janela de 15 minutos
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Muitas requisições. Tente novamente mais tarde.',
  },
});

/**
 * Limiter estrito para rotas sensíveis (reset de senha)
 * 10 requisições por janela de 15 minutos
 */
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Muitas requisições a esta rota. Tente novamente após 15 minutos.',
  },
});

module.exports = {
  authLimiter,
  generalLimiter,
  strictLimiter,
};
