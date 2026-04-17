// ============================================================
// AUTH MIDDLEWARE
// Verifica se o token JWT e valido e anexa usuario a req.user
// ============================================================

const { verifyToken } = require('../services/auth.service');

/**
 * Middleware que exige autenticacao
 * Verifica header Authorization: Bearer <token>
 */
function ensureAuthenticated(req, res, next) {
  // Pega o token do header Authorization
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: 'Token nao fornecido' });
  }

  // Formato esperado: "Bearer <token>"
  const [, token] = authHeader.split(' ');

  if (!token) {
    return res.status(401).json({ message: 'Token nao fornecido' });
  }

  try {
    // Verifica e decodifica o token
    const decoded = verifyToken(token);
    // Anexao usuario a request para uso nos controllers
    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Token invalido ou expirado' });
  }
}

/**
 * Middleware que exige um tipo especifico de role
 * Uso: ensureRole('FREELANCER') ou ensureRole('COMPANY')
 */
function ensureRole(role) {
  return (req, res, next) => {
    // ensureAuthenticated deve rodar antes
    if (!req.user) {
      return res.status(401).json({ message: 'Nao autenticado' });
    }

    // Verifica se o usuario tem o role esperado
    if (req.user.role !== role) {
      return res.status(403).json({
        message: 'Acesso negado. Voce nao tem permissao para esta acao.',
      });
    }

    return next();
  };
}

/**
 * Middleware opcional: verifica o token se existir,
 * mas nao bloqueia se nao houver token
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const [, token] = authHeader.split(' ');
    try {
      req.user = verifyToken(token);
    } catch (error) {
      // Token invalido, mas continua sem erro (auth opcional)
    }
  }

  return next();
}

// Hierarquia de adminRole (maior = mais permissão)
const ADMIN_ROLE_LEVEL = { USER: 0, MODERATOR: 1, ADMIN: 2, OWNER: 3 };

/**
 * Exige adminRole mínimo.
 * Uso: requireAdminRole('MODERATOR') — aceita MODERATOR, ADMIN e OWNER
 */
function requireAdminRole(minRole) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Nao autenticado' });
    const userLevel  = ADMIN_ROLE_LEVEL[req.user.adminRole] ?? 0;
    const minLevel   = ADMIN_ROLE_LEVEL[minRole] ?? 0;
    if (userLevel < minLevel) {
      return res.status(403).json({ message: 'Acesso negado: permissao insuficiente' });
    }
    return next();
  };
}

/**
 * Exige que o adminRole do req.user esteja na lista de roles permitidos.
 * Uso: requireAnyAdminRole(['ADMIN', 'OWNER'])
 */
function requireAnyAdminRole(roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Nao autenticado' });
    if (!roles.includes(req.user.adminRole)) {
      return res.status(403).json({ message: 'Acesso negado: permissao insuficiente' });
    }
    return next();
  };
}

module.exports = {
  ensureAuthenticated,
  ensureRole,
  optionalAuth,
  requireAdminRole,
  requireAnyAdminRole,
  ADMIN_ROLE_LEVEL,
};
