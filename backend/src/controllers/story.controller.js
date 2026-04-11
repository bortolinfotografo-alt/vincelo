// ============================================================
// STORY CONTROLLER
// Stories de 24h: criar, listar, visualizar, limpar expirados
// ============================================================

const { prisma } = require('../services/db');
const logger = require('../utils/logger');

// Inclui dados do autor em cada story
const storyInclude = {
  author: {
    select: {
      id: true,
      name: true,
      avatar: true,
      role: true,
      isVerified: true,
    },
  },
  _count: { select: { views: true } },
};

/**
 * POST /api/stories
 * Cria um novo story (expira em 24h)
 */
async function createStory(req, res) {
  const { caption } = req.body;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ message: 'Story deve conter uma imagem ou video' });
  }

  const mediaUrl = req.fileUrl;
  const mediaType = file.mimetype.startsWith('image') ? 'PHOTO' : 'VIDEO';
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // +24h

  const story = await prisma.story.create({
    data: {
      authorId: req.user.id,
      mediaUrl,
      mediaType,
      caption: caption || null,
      expiresAt,
    },
    include: storyInclude,
  });

  logger.info('[STORY] Story criado', { storyId: story.id, userId: req.user.id, expiresAt });

  return res.status(201).json(story);
}

/**
 * GET /api/stories/feed
 * Stories dos usuarios seguidos (agrupados por autor, so nao expirados)
 */
async function getStoriesFeed(req, res) {
  const now = new Date();

  // IDs de quem o usuario segue + o proprio
  const follows = await prisma.follow.findMany({
    where: { followerId: req.user.id },
    select: { followingId: true },
  });

  const authorIds = [req.user.id, ...follows.map((f) => f.followingId)];

  // Busca stories ativos dos usuarios seguidos
  const stories = await prisma.story.findMany({
    where: {
      authorId: { in: authorIds },
      expiresAt: { gt: now },
    },
    orderBy: { createdAt: 'desc' },
    include: {
      ...storyInclude,
      // Verifica se o usuario ja viu este story
      views: {
        where: { viewerId: req.user.id },
        select: { id: true },
      },
    },
  });

  // Agrupa por autor para exibir no formato StoriesBar
  const grouped = {};
  for (const story of stories) {
    const authorId = story.authorId;
    if (!grouped[authorId]) {
      grouped[authorId] = {
        author: story.author,
        stories: [],
        hasUnseen: false,
      };
    }
    const seen = story.views.length > 0;
    if (!seen) grouped[authorId].hasUnseen = true;
    grouped[authorId].stories.push({
      ...story,
      viewCount: story._count.views,
      seen,
      views: undefined,
      _count: undefined,
    });
  }

  // Ordena: autores com stories nao vistos primeiro
  const result = Object.values(grouped).sort((a, b) =>
    b.hasUnseen - a.hasUnseen
  );

  return res.json({ groups: result });
}

/**
 * GET /api/stories/user/:userId
 * Stories ativos de um usuario especifico
 */
async function getUserStories(req, res) {
  const { userId } = req.params;
  const now = new Date();

  const stories = await prisma.story.findMany({
    where: {
      authorId: userId,
      expiresAt: { gt: now },
    },
    orderBy: { createdAt: 'asc' },
    include: {
      ...storyInclude,
      views: req.user
        ? { where: { viewerId: req.user.id }, select: { id: true } }
        : false,
    },
  });

  return res.json({
    stories: stories.map((s) => ({
      ...s,
      viewCount: s._count.views,
      seen: req.user ? s.views?.length > 0 : false,
      views: undefined,
      _count: undefined,
    })),
  });
}

/**
 * POST /api/stories/:id/view
 * Registra visualizacao de um story
 */
async function viewStory(req, res) {
  const { id: storyId } = req.params;
  const viewerId = req.user.id;

  const story = await prisma.story.findUnique({ where: { id: storyId } });
  if (!story) return res.status(404).json({ message: 'Story nao encontrado' });
  if (new Date() > story.expiresAt) {
    return res.status(410).json({ message: 'Story expirado' });
  }

  // Usa upsert para nao duplicar visualizacoes
  await prisma.storyView.upsert({
    where: { storyId_viewerId: { storyId, viewerId } },
    create: { storyId, viewerId },
    update: { viewedAt: new Date() },
  });

  return res.json({ message: 'Visualizacao registrada' });
}

/**
 * GET /api/stories/:id/views
 * Lista quem viu o story (apenas para o autor)
 */
async function getStoryViews(req, res) {
  const { id: storyId } = req.params;

  const story = await prisma.story.findUnique({ where: { id: storyId } });
  if (!story) return res.status(404).json({ message: 'Story nao encontrado' });
  if (story.authorId !== req.user.id) {
    return res.status(403).json({ message: 'Apenas o autor pode ver as visualizacoes' });
  }

  const views = await prisma.storyView.findMany({
    where: { storyId },
    orderBy: { viewedAt: 'desc' },
    include: {
      viewer: { select: { id: true, name: true, avatar: true } },
    },
  });

  return res.json({ views, total: views.length });
}

/**
 * DELETE /api/stories/:id
 * Remove story antes de expirar (apenas autor)
 */
async function deleteStory(req, res) {
  const { id } = req.params;

  const story = await prisma.story.findUnique({ where: { id } });
  if (!story) return res.status(404).json({ message: 'Story nao encontrado' });
  if (story.authorId !== req.user.id) return res.status(403).json({ message: 'Sem permissao' });

  await prisma.story.delete({ where: { id } });
  return res.json({ message: 'Story removido' });
}

/**
 * Rotina de limpeza de stories expirados
 * Chamada pelo cron interno do servidor (a cada hora)
 */
async function cleanExpiredStories() {
  const now = new Date();
  const result = await prisma.story.deleteMany({
    where: { expiresAt: { lt: now } },
  });

  if (result.count > 0) {
    logger.info('[STORY] Stories expirados removidos', { count: result.count });
  }

  return result.count;
}

module.exports = {
  createStory,
  getStoriesFeed,
  getUserStories,
  viewStory,
  getStoryViews,
  deleteStory,
  cleanExpiredStories,
};
