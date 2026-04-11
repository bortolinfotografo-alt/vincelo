// ============================================================
// RAW BODY MIDDLEWARE
// Stripe webhook precisa de body raw (nao parseado como JSON)
// ============================================================

function requireRawBody(req, res, next) {
  let data = '';
  req.setEncoding('utf8');
  req.on('data', (chunk) => { data += chunk; });
  req.on('end', () => {
    req.body = data;
    next();
  });
}

// Alias para compatibilidade com server.js
const rawBodyMiddleware = requireRawBody;

module.exports = { requireRawBody, rawBodyMiddleware };
