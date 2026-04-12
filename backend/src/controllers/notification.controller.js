// ============================================================
// NOTIFICATION CONTROLLER
// Notificações de likes, comentários, seguidores, story likes
// ============================================================

const { prisma } = require('../services/db');
const logger = require('../utils/logger');

// Include padrão para retornar ator e referência
function notifInclude() {
  return {
    actor: { select: { id: true, name: true, avatar: true } },
    post:  { select: { id: true, mediaUrl: true, media: { take: 1, orderBy: { order: 'asc' }, select: { mediaUrl: true } } } },
    story: { select: { id: true, mediaUrl: true } },
  };
}

/**
 * Cria (ou atualiza timestamp de) uma notificação.
 * Para LIKE/FOLLOW/STORY_LIKE: upsert — evita duplicatas por actor+type+target.
 * Para COMMENT/STORY_REPLY: cria sempre (cada ação é única).
 * Não notifica o próprio usuário.
 * @param {string} userId   - destinatário
 * @param {string} actorId  - quem fez a ação
 * @param {string} type     - NotificationType
 * @param {object} meta     - { postId?, storyId? }
 */
async function createNotification(userId, actorId, type, meta = {}) {
  if (userId === actorId) return; // não notifica a si mesmo

  try {
    const upsertTypes = ['LIKE', 'FOLLOW', 'STORY_LIKE'];

    if (upsertTypes.includes(type)) {
      await prisma.notification.upsert({
        where: {
          // índice único composto — criado abaixo como @@unique
          userId_actorId_type_postId_storyId: {
            userId,
            actorId,
            type,
            postId:  meta.postId  || null,
            storyId: meta.storyId || null,
          },
        },
        create: { userId, actorId, type, postId: meta.postId || null, storyId: meta.storyId || null, isRead: false },
        update: { isRead: false, createdAt: new Date() },
      });
    } else {
      await prisma.notification.create({
        data: { userId, actorId, type, postId: meta.postId || null, storyId: meta.storyId || null },
      });
    }
  } catch (err) {
    // Notificações são não-críticas — logar mas não quebrar o fluxo principal
    logger.error('[NOTIF] Erro ao criar notificação', { err: err.message, userId, actorId, type });
  }
}

/**
 * Remove notificação de like/follow (quando usuário desfaz a ação).
 */
async function deleteNotification(userId, actorId, type, meta = {}) {
  try {
    await prisma.notification.deleteMany({
      where: {
        userId,
        actorId,
        type,
        postId:  meta.postId  || null,
        storyId: meta.storyId || null,
      },
    });
  } catch (err) {
    logger.error('[NOTIF] Erro ao remover notificação', { err: err.message });
  }
}

/**
 * GET /api/notifications
 * Lista notificações do usuário logado (max 50, ordenadas por data desc)
 */
async function listNotifications(req, res) {
  const userId = req.user.id;

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: notifInclude(),
  });

  const unreadCount = await prisma.notification.count({
    where: { userId, isRead: false },
  });

  return res.json({ notifications, unreadCount });
}

/**
 * GET /api/notifications/unread-count
 * Retorna apenas o contador de não lidas (leve, para polling)
 */
async function getUnreadCount(req, res) {
  const count = await prisma.notification.count({
    where: { userId: req.user.id, isRead: false },
  });
  return res.json({ count });
}

/**
 * POST /api/notifications/read-all
 * Marca todas como lidas
 */
async function markAllRead(req, res) {
  await prisma.notification.updateMany({
    where: { userId: req.user.id, isRead: false },
    data: { isRead: true },
  });
  return res.json({ message: 'Todas as notificações marcadas como lidas' });
}

/**
 * PATCH /api/notifications/:id/read
 * Marca uma notificação como lida
 */
async function markRead(req, res) {
  const { id } = req.params;
  const notif = await prisma.notification.findUnique({ where: { id } });
  if (!notif || notif.userId !== req.user.id) {
    return res.status(404).json({ message: 'Notificação não encontrada' });
  }
  await prisma.notification.update({ where: { id }, data: { isRead: true } });
  return res.json({ message: 'Lida' });
}

module.exports = {
  createNotification,
  deleteNotification,
  listNotifications,
  getUnreadCount,
  markAllRead,
  markRead,
};
