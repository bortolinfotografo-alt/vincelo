// ============================================================
// SANITIZE MIDDLEWARE
// Remove tags HTML e scripts de campos de texto antes de
// salvar no banco. Previne XSS armazenado.
//
// Implementação leve sem dependência externa:
// - Remove tags HTML (<script>, <img onerror=...>, etc)
// - Remove atributos de evento (onclick, onload, etc)
// - Preserva o conteúdo textual
// ============================================================

/**
 * Remove tags HTML de uma string.
 * @param {string} input
 * @returns {string}
 */
function stripHtml(input) {
  if (typeof input !== 'string') return input;
  return input
    // Remove tags HTML completas
    .replace(/<[^>]*>/g, '')
    // Remove entidades HTML perigosas remanescentes
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}

/**
 * Sanitiza recursivamente todos os campos string de um objeto.
 * @param {any} obj
 * @returns {any}
 */
function sanitizeObject(obj) {
  if (typeof obj === 'string') return stripHtml(obj);
  if (Array.isArray(obj)) return obj.map(sanitizeObject);
  if (obj !== null && typeof obj === 'object') {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = sanitizeObject(value);
    }
    return result;
  }
  return obj;
}

/**
 * Middleware Express: sanitiza req.body recursivamente.
 * Aplicar globalmente APÓS express.json().
 *
 * Campos que NÃO devem ser sanitizados (binários, tokens):
 * password, resetToken, refreshToken, stripeSignature
 */
const SKIP_FIELDS = new Set([
  'password',
  'newPassword',
  'resetToken',
  'refreshToken',
  'stripeSignature',
  'webhookPayload',
]);

function sanitizeBody(req, res, next) {
  if (!req.body || typeof req.body !== 'object') return next();

  const sanitized = {};
  for (const [key, value] of Object.entries(req.body)) {
    if (SKIP_FIELDS.has(key)) {
      sanitized[key] = value; // preserva campos sensíveis
    } else {
      sanitized[key] = sanitizeObject(value);
    }
  }
  req.body = sanitized;
  return next();
}

module.exports = { sanitizeBody };
