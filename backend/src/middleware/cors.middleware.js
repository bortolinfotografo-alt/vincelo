// ============================================================
// CORS MIDDLEWARE
// Configuração dedicada de CORS para desenvolvimento e produção
// ============================================================

const cors = require('cors');

/**
 * Retorna a configuração de CORS
 * Dev: permite localhost:3000 e localhost:3001
 * Prod: usa env CORS_ALLOWED_ORIGINS (string separada por vírgula)
 */
function corsConfig() {
  const isDevelopment = process.env.NODE_ENV !== 'production';

  let allowedOrigins;

  if (isDevelopment) {
    allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
    ];
  } else {
    const envOrigins = process.env.CORS_ALLOWED_ORIGINS;
    if (!envOrigins) {
      console.warn(
        '[CORS] CORS_ALLOWED_ORIGINS nao configurado para producao!'
      );
      allowedOrigins = [];
    } else {
      allowedOrigins = envOrigins
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);
    }
  }

  return cors({
    origin: function (origin, callback) {
      // Permite requests sem origem (mobile apps, curl, etc)
      if (!origin) return callback(null, true);

      if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error(`Origem ${origin} nao permitida pelo CORS`)
      );
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
}

module.exports = { corsConfig };
