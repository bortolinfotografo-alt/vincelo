// ============================================================
// AUTH SERVICE
// Funcoes de autenticacao: gerar token, verificar senha, hash
// ============================================================

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * Gera hash bcrypt para uma senha
 */
async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

/**
 * Compara senha com hash
 */
async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Gera token JWT com dados do usuario
 */
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      adminRole: user.adminRole || 'USER',
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

/**
 * Gera refresh token para renovacao sem re-login
 */
function generateRefreshToken(user) {
  return jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
  );
}

/**
 * Verifica e decodifica token JWT
 */
function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

/**
 * Verifica refresh token
 */
function verifyRefreshToken(token) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
}

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  generateRefreshToken,
  verifyToken,
  verifyRefreshToken,
};
