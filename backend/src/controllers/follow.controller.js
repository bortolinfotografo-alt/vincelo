// ============================================================
// FOLLOW CONTROLLER
// Sistema de seguir/deixar de seguir usuarios
// ============================================================

const { prisma } = require('../services/db');
const logger = require('../utils/logger');
const { createNotification, deleteNotification } = require('./notification.controller');
const { parsePagination } = require('../utils/helpers');

/**
 * POST /api/follow/:userId
 * Seguir um usuario (toggle: se ja segue, deixa de seguir)
 */
async function toggleFollow(req, res) {
  const followerId = req.user.id;
  const followingId = req.params.userId;

  if (followerId === followingId) {
    return res.status(400).json({ message: 'Voce nao pode seguir a si mesmo' });
  }

  // Verifica se o usuario alvo existe
  const target = await prisma.user.findUnique({
    where: { id: followingId },
    select: { id: true, name: true },
  });
  if (!target) return res.status(404).json({ message: 'Usuario nao encontrado' });

  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId, followingId } },
  });

  if (existing) {
    // Deixar de seguir
    await prisma.follow.delete({
      where: { followerId_followingId: { followerId, followingId } },
    });

    const [followersCount, followingCount] = await Promise.all([
      prisma.follow.count({ where: { followingId } }),
      prisma.follow.count({ where: { followerId: followingId } }),
    ]);

    deleteNotification(followingId, followerId, 'FOLLOW');
    logger.info('[FOLLOW] Deixou de seguir', { followerId, followingId });
    return res.json({ following: false, followersCount, followingCount });
  }

  // Seguir
  await prisma.follow.create({ data: { followerId, followingId } });

  const [followersCount, followingCount] = await Promise.all([
    prisma.follow.count({ where: { followingId } }),
    prisma.follow.count({ where: { followerId: followingId } }),
  ]);

  createNotification(followingId, followerId, 'FOLLOW');
  logger.info('[FOLLOW] Passou a seguir', { followerId, followingId });
  return res.json({ following: true, followersCount, followingCount });
}

/**
 * GET /api/follow/:userId/status
 * Verifica se o usuario logado segue o alvo e retorna contagens
 */
async function getFollowStatus(req, res) {
  const currentUserId = req.user?.id || null;
  const { userId } = req.params;

  const [followersCount, followingCount, isFollowing] = await Promise.all([
    prisma.follow.count({ where: { followingId: userId } }),
    prisma.follow.count({ where: { followerId: userId } }),
    currentUserId
      ? prisma.follow.findUnique({
          where: { followerId_followingId: { followerId: currentUserId, followingId: userId } },
        })
      : null,
  ]);

  return res.json({
    followersCount,
    followingCount,
    isFollowing: !!isFollowing,
  });
}

/**
 * GET /api/follow/:userId/followers
 * Lista seguidores de um usuario
 */
async function getFollowers(req, res) {
  const { userId } = req.params;
  const { page, limit, skip } = parsePagination(req.query);
  const currentUserId = req.user?.id || null;

  const [follows, total] = await Promise.all([
    prisma.follow.findMany({
      where: { followingId: userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        follower: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true,
            isVerified: true,
            freelancer: { select: { specialties: true, location: true } },
            company: { select: { companyName: true } },
          },
        },
      },
    }),
    prisma.follow.count({ where: { followingId: userId } }),
  ]);

  // Verifica quais desses seguidores o usuário logado já segue
  let followingSet = new Set();
  if (currentUserId && follows.length > 0) {
    const followerIds = follows.map((f) => f.follower.id);
    const myFollows = await prisma.follow.findMany({
      where: { followerId: currentUserId, followingId: { in: followerIds } },
      select: { followingId: true },
    });
    followingSet = new Set(myFollows.map((f) => f.followingId));
  }

  return res.json({
    users: follows.map((f) => ({
      ...f.follower,
      isFollowing: followingSet.has(f.follower.id),
    })),
    page,
    totalPages: Math.ceil(total / limit),
    total,
  });
}

/**
 * GET /api/follow/:userId/following
 * Lista quem um usuario segue
 */
async function getFollowing(req, res) {
  const { userId } = req.params;
  const { page, limit, skip } = parsePagination(req.query);

  const [follows, total] = await Promise.all([
    prisma.follow.findMany({
      where: { followerId: userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        following: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true,
            isVerified: true,
            freelancer: { select: { specialties: true, location: true } },
            company: { select: { companyName: true } },
          },
        },
      },
    }),
    prisma.follow.count({ where: { followerId: userId } }),
  ]);

  return res.json({
    users: follows.map((f) => f.following),
    page,
    totalPages: Math.ceil(total / limit),
    total,
  });
}

/**
 * GET /api/follow/suggestions
 * Sugestoes de usuarios para seguir (quem o usuario nao segue ainda)
 */
async function getSuggestions(req, res) {
  const currentUserId = req.user.id;

  // Pega IDs que ja segue
  const follows = await prisma.follow.findMany({
    where: { followerId: currentUserId },
    select: { followingId: true },
  });

  const alreadyFollowing = follows.map((f) => f.followingId);
  alreadyFollowing.push(currentUserId); // Exclui o proprio usuario

  const suggestions = await prisma.user.findMany({
    where: { id: { notIn: alreadyFollowing } },
    take: 6,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      avatar: true,
      role: true,
      isVerified: true,
      description: true,
      freelancer: { select: { specialties: true, location: true } },
      company: { select: { companyName: true } },
      _count: { select: { followers: true } },
    },
  });

  return res.json({ suggestions });
}

module.exports = {
  toggleFollow,
  getFollowStatus,
  getFollowers,
  getFollowing,
  getSuggestions,
};
