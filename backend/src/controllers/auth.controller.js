// ============================================================
// AUTH CONTROLLER
// Login, cadastro, refresh token, forgot password
// ============================================================

const crypto = require('crypto');
const { prisma } = require('../services/db');
const { hashPassword, comparePassword, generateToken, generateRefreshToken, verifyRefreshToken } = require('../services/auth.service');
const { sendPasswordReset } = require('../services/email.service');
const logger = require('../utils/logger');

// ── Configuração do cookie de refresh token ───────────────────
const REFRESH_COOKIE_NAME = 'refreshToken';
const COOKIE_OPTIONS = {
  httpOnly: true,                                           // não acessível por JS
  secure: process.env.NODE_ENV === 'production',            // HTTPS apenas em prod
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  maxAge: 30 * 24 * 60 * 60 * 1000,                       // 30 dias em ms
  path: '/',
};

function setRefreshCookie(res, refreshToken) {
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, COOKIE_OPTIONS);
}

function clearRefreshCookie(res) {
  res.clearCookie(REFRESH_COOKIE_NAME, { ...COOKIE_OPTIONS, maxAge: 0 });
}

/**
 * Gera hash SHA-256 de um token (para armazenar com seguranca no banco)
 */
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * POST /api/auth/register
 * Cadastra um novo usuario (freelancer ou empresa)
 */
async function register(req, res) {
  const { name, email, password, role, profileData } = req.body;

  // Verifica se o email ja existe
  const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (existingUser) {
    return res.status(409).json({ message: 'Email ja cadastrado' });
  }

  // Valida role
  if (!['FREELANCER', 'COMPANY'].includes(role)) {
    return res.status(400).json({ message: 'Role deve ser FREELANCER ou COMPANY' });
  }

  // Cria o usuario com a transacao para garantir consistencia
  const user = await prisma.$transaction(async (tx) => {
    const hashedPassword = await hashPassword(password);

    const newUser = await tx.user.create({
      data: {
        name,
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role,
        isActive: true,
      },
    });

    if (role === 'FREELANCER') {
      await tx.freelancerProfile.create({
        data: {
          userId: newUser.id,
          location: profileData?.location || '',
          specialties: profileData?.specialties || [],
          skills: profileData?.skills || [],
        },
      });
    }

    if (role === 'COMPANY') {
      await tx.companyProfile.create({
        data: {
          userId: newUser.id,
          companyName: profileData?.companyName || name,
          companyWebsite: profileData?.companyWebsite || null,
          companySize: profileData?.companySize || null,
          segment: profileData?.segment || null,
        },
      });
    }

    return newUser;
  });

  const token = generateToken(user);
  const refreshToken = generateRefreshToken(user);

  // Refresh token em httpOnly cookie (seguro contra XSS)
  setRefreshCookie(res, refreshToken);

  logger.info('[AUTH] Novo usuario registrado', { userId: user.id, role });

  return res.status(201).json({
    message: 'Usuario criado com sucesso',
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    },
    token,
    // refreshToken também no body para clientes que não suportam cookies (ex: mobile nativo)
    refreshToken,
  });
}

/**
 * POST /api/auth/login
 * Autentica usuario com email e senha
 */
async function login(req, res) {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    include: {
      freelancer: true,
      company: true,
    },
  });

  if (!user) {
    return res.status(401).json({ message: 'Email ou senha invalidos' });
  }

  const isValidPassword = await comparePassword(password, user.password);
  if (!isValidPassword) {
    return res.status(401).json({ message: 'Email ou senha invalidos' });
  }

  const token = generateToken(user);
  const refreshToken = generateRefreshToken(user);

  // Refresh token em httpOnly cookie
  setRefreshCookie(res, refreshToken);

  logger.info('[AUTH] Login realizado', { userId: user.id });

  return res.json({
    message: 'Login realizado com sucesso',
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      phone: user.phone,
      description: user.description,
      avatar: user.avatar,
    },
    token,
    refreshToken,
  });
}

/**
 * POST /api/auth/refresh
 * Renova o token usando o refresh token
 */
async function refresh(req, res) {
  // Aceita refresh token do cookie httpOnly (preferencial) ou do body (fallback para apps mobile)
  const tokenFromCookie = req.cookies?.[REFRESH_COOKIE_NAME];
  const tokenFromBody = req.body?.refreshToken;
  const refreshToken = tokenFromCookie || tokenFromBody;

  if (!refreshToken) {
    return res.status(400).json({ message: 'Refresh token nao fornecido' });
  }

  try {
    const decoded = verifyRefreshToken(refreshToken);

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });

    if (!user || !user.isActive) {
      clearRefreshCookie(res);
      return res.status(401).json({ message: 'Usuario nao encontrado' });
    }

    const newToken = generateToken(user);
    const newRefreshToken = generateRefreshToken(user);

    // Renova o cookie
    setRefreshCookie(res, newRefreshToken);

    return res.json({ token: newToken, refreshToken: newRefreshToken });
  } catch (error) {
    clearRefreshCookie(res);
    return res.status(401).json({ message: 'Refresh token invalido ou expirado' });
  }
}

/**
 * POST /api/auth/logout
 * Invalida o refresh token limpando o cookie
 */
async function logout(req, res) {
  clearRefreshCookie(res);
  return res.json({ message: 'Logout realizado com sucesso' });
}

/**
 * POST /api/auth/forgot-password
 * Gera token de reset, armazena hash e envia email
 */
async function forgotPassword(req, res) {
  const { email } = req.body;

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });

  // Retorna 200 mesmo se email nao existir para nao vazar informacao de usuarios
  if (!user) {
    return res.json({ message: 'Se o email existir, voce recebera as instrucoes' });
  }

  // Gera token aleatorio de reset (enviado ao usuario)
  const resetToken = crypto.randomBytes(32).toString('hex');
  // Armazena apenas o HASH do token no banco (seguranca: se banco for comprometido, token nao vaza)
  const hashedToken = hashToken(resetToken);
  const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetToken: hashedToken,
      resetExpires,
    },
  });

  // Envia email com o token em texto puro (apenas o token, nao o hash)
  try {
    await sendPasswordReset(user.email, resetToken);
    logger.info('[AUTH] Email de reset enviado', { userId: user.id });
  } catch (emailError) {
    logger.error('[AUTH] Falha ao enviar email de reset', { error: emailError.message });
    // Nao falha a request - o usuario recebe resposta generica de qualquer forma
  }

  return res.json({ message: 'Se o email existir, voce recebera as instrucoes' });
}

/**
 * POST /api/auth/reset-password
 * Reset senha usando o token recebido por email
 */
async function resetPassword(req, res) {
  const { resetToken, newPassword } = req.body;

  if (!resetToken || !newPassword) {
    return res.status(400).json({ message: 'Token e nova senha sao obrigatorios' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'A nova senha deve ter pelo menos 6 caracteres' });
  }

  // Compara o hash do token recebido com o hash armazenado
  const hashedToken = hashToken(resetToken);

  const user = await prisma.user.findFirst({
    where: {
      resetToken: hashedToken,
      resetExpires: { gt: new Date() },
    },
  });

  if (!user) {
    return res.status(400).json({ message: 'Token invalido ou expirado' });
  }

  const hashedPassword = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetToken: null,
      resetExpires: null,
    },
  });

  logger.info('[AUTH] Senha redefinida com sucesso', { userId: user.id });

  return res.json({ message: 'Senha atualizada com sucesso' });
}

/**
 * GET /api/auth/me
 * Retorna dados do usuario logado
 */
async function me(req, res) {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: {
      freelancer: true,
      company: true,
    },
  });

  if (!user) {
    return res.status(404).json({ message: 'Usuario nao encontrado' });
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
}

module.exports = {
  register,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  me,
};
