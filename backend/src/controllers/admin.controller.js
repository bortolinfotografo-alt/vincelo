const { prisma } = require('../services/db');
const logger = require('../utils/logger');

const ROLE_LEVEL = { USER: 0, MODERATOR: 1, ADMIN: 2, OWNER: 3 };

async function logAction(adminId, action, targetId = null, details = null) {
  await prisma.auditLog.create({ data: { adminId, action, targetId, details } });
}

/**
 * GET /api/admin/users
 * Lista usuarios com filtros opcionais
 */
async function listUsers(req, res) {
  const { page = 1, limit = 20, search, role, adminRole, isActive } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (role) where.role = role;
  if (adminRole) where.adminRole = adminRole;
  if (isActive !== undefined) where.isActive = isActive === 'true';

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        adminRole: true,
        isActive: true,
        avatar: true,
        createdAt: true,
        lastSeenAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  return res.json({ users, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
}

/**
 * GET /api/admin/users/:id
 */
async function getUser(req, res) {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      adminRole: true,
      isActive: true,
      avatar: true,
      phone: true,
      description: true,
      emailVerified: true,
      createdAt: true,
      lastSeenAt: true,
      freelancer: true,
      company: true,
    },
  });

  if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });
  return res.json(user);
}

/**
 * PATCH /api/admin/users/:id/admin-role
 * Altera o adminRole de um usuário (com validação de hierarquia)
 */
async function updateAdminRole(req, res) {
  const { adminRole: newRole } = req.body;
  const actorRole = req.user.adminRole;
  const actorLevel = ROLE_LEVEL[actorRole] ?? 0;

  if (!newRole || ROLE_LEVEL[newRole] === undefined) {
    return res.status(400).json({ message: 'adminRole inválido' });
  }

  const target = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!target) return res.status(404).json({ message: 'Usuário não encontrado' });

  const targetCurrentLevel = ROLE_LEVEL[target.adminRole] ?? 0;
  const targetNewLevel = ROLE_LEVEL[newRole];

  // Não pode alterar usuário com role >= o próprio
  if (targetCurrentLevel >= actorLevel) {
    return res.status(403).json({ message: 'Você não pode alterar um usuário com role igual ou superior ao seu' });
  }

  // Não pode promover para role >= o próprio
  if (targetNewLevel >= actorLevel) {
    return res.status(403).json({ message: 'Você não pode promover para um role igual ou superior ao seu' });
  }

  await prisma.user.update({ where: { id: target.id }, data: { adminRole: newRole } });

  await logAction(req.user.id, 'UPDATE_ADMIN_ROLE', target.id, {
    from: target.adminRole,
    to: newRole,
  });

  logger.info('[ADMIN] adminRole atualizado', { adminId: req.user.id, targetId: target.id, from: target.adminRole, to: newRole });

  return res.json({ message: 'Role atualizado com sucesso', adminRole: newRole });
}

/**
 * PATCH /api/admin/users/:id/toggle-active
 * Bane ou desbane um usuário
 */
async function toggleUserActive(req, res) {
  const actorLevel = ROLE_LEVEL[req.user.adminRole] ?? 0;

  const target = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!target) return res.status(404).json({ message: 'Usuário não encontrado' });

  // Não pode banir usuário com adminRole >= o próprio
  if ((ROLE_LEVEL[target.adminRole] ?? 0) >= actorLevel) {
    return res.status(403).json({ message: 'Você não pode banir um usuário com role igual ou superior ao seu' });
  }

  const newActive = !target.isActive;
  await prisma.user.update({ where: { id: target.id }, data: { isActive: newActive } });

  await logAction(req.user.id, newActive ? 'UNBAN_USER' : 'BAN_USER', target.id);

  logger.info(`[ADMIN] Usuário ${newActive ? 'desbanido' : 'banido'}`, { adminId: req.user.id, targetId: target.id });

  return res.json({ message: newActive ? 'Usuário desbanido' : 'Usuário banido', isActive: newActive });
}

/**
 * DELETE /api/admin/posts/:id
 * Remove um post por moderação
 */
async function deletePost(req, res) {
  const post = await prisma.post.findUnique({ where: { id: req.params.id } });
  if (!post) return res.status(404).json({ message: 'Post não encontrado' });

  await prisma.post.delete({ where: { id: req.params.id } });
  await logAction(req.user.id, 'DELETE_POST', req.params.id, { authorId: post.authorId });

  logger.info('[ADMIN] Post removido', { adminId: req.user.id, postId: req.params.id });

  return res.json({ message: 'Post removido com sucesso' });
}

/**
 * DELETE /api/admin/stories/:id
 * Remove um story por moderação
 */
async function deleteStory(req, res) {
  const story = await prisma.story.findUnique({ where: { id: req.params.id } });
  if (!story) return res.status(404).json({ message: 'Story não encontrado' });

  await prisma.story.delete({ where: { id: req.params.id } });
  await logAction(req.user.id, 'DELETE_STORY', req.params.id, { authorId: story.authorId });

  logger.info('[ADMIN] Story removido', { adminId: req.user.id, storyId: req.params.id });

  return res.json({ message: 'Story removido com sucesso' });
}

/**
 * GET /api/admin/audit-logs
 * Lista logs de auditoria
 */
async function listAuditLogs(req, res) {
  const { page = 1, limit = 30, adminId, action } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {};
  if (adminId) where.adminId = adminId;
  if (action) where.action = { contains: action, mode: 'insensitive' };

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        admin: { select: { id: true, name: true, email: true, avatar: true, adminRole: true } },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return res.json({ logs, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
}

/**
 * GET /api/admin/stats
 * Dashboard stats gerais
 */
async function getStats(req, res) {
  const [totalUsers, activeUsers, totalPosts, totalStories, totalJobs, recentLogs] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.post.count(),
    prisma.story.count(),
    prisma.job.count(),
    prisma.auditLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { admin: { select: { id: true, name: true, avatar: true } } },
    }),
  ]);

  return res.json({ totalUsers, activeUsers, bannedUsers: totalUsers - activeUsers, totalPosts, totalStories, totalJobs, recentLogs });
}

module.exports = { listUsers, getUser, updateAdminRole, toggleUserActive, deletePost, deleteStory, listAuditLogs, getStats };
