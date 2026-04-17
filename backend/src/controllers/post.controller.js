// ============================================================
// POST CONTROLLER
// CRUD de posts sociais: criar, feed, curtir, comentar, salvar
// ============================================================

const { prisma } = require('../services/db');
const logger = require('../utils/logger');
const { createNotification, deleteNotification } = require('./notification.controller');

// Campos padrao para incluir em posts (autor, likes, comentarios, midia do carrossel)
function postInclude(currentUserId) {
  return {
    media: { orderBy: { order: 'asc' } },
    author: {
      select: {
        id: true,
        name: true,
        avatar: true,
        role: true,
        isVerified: true,
        freelancer: { select: { specialties: true } },
        company: { select: { companyName: true } },
      },
    },
    _count: { select: { likes: true, comments: true } },
    // Verifica se o usuario atual curtiu ou salvou o post
    likes: currentUserId
      ? { where: { userId: currentUserId }, select: { id: true } }
      : false,
    savedBy: currentUserId
      ? { where: { userId: currentUserId }, select: { id: true } }
      : false,
  };
}

// Formata post para resposta padrao
function formatPost(post, currentUserId) {
  return {
    ...post,
    likeCount: post._count.likes,
    commentCount: post._count.comments,
    isLiked: currentUserId ? post.likes?.length > 0 : false,
    isSaved: currentUserId ? post.savedBy?.length > 0 : false,
    likes: undefined,
    savedBy: undefined,
    _count: undefined,
  };
}

/**
 * POST /api/posts
 * Cria um novo post (suporta múltiplas mídias via upload.fields)
 * Fluxo novo: req.files.media[] + req.files.thumbnail[]
 * Fluxo legado: req.file (upload.single) — mantido para compatibilidade
 */
async function createPost(req, res) {
  const { description, aspectRatio } = req.body;
  const mediaFiles = req.files?.media || [];
  const singleFile = req.file; // legado

  if (!description && mediaFiles.length === 0 && !singleFile) {
    return res.status(400).json({ message: 'Post deve ter descricao ou midia' });
  }

  const validRatios = ['LANDSCAPE', 'PORTRAIT'];
  const ratio = validRatios.includes(aspectRatio) ? aspectRatio : 'LANDSCAPE';
  const thumbnailUrl = req.thumbnailUrl || null;

  const postData = {
    authorId: req.user.id,
    description: description || null,
    thumbnailUrl,
    aspectRatio: null,
  };

  if (mediaFiles.length > 0) {
    // Fluxo novo: múltiplas mídias (carrossel)
    const urls = req.fileUrls || [];
    const mediaItems = mediaFiles.map((f, i) => ({
      mediaUrl: urls[i],
      mediaType: f.mimetype.startsWith('image') ? 'PHOTO' : 'VIDEO',
      thumbnailUrl: i === 0 ? thumbnailUrl : null,
      order: i,
    }));

    // Mantém mediaUrl/mediaType no Post para compatibilidade com posts antigos
    postData.mediaUrl = mediaItems[0].mediaUrl;
    postData.mediaType = mediaItems[0].mediaType;
    postData.aspectRatio = ratio;
    postData.media = { create: mediaItems };
  } else if (singleFile) {
    // Fluxo legado: arquivo único
    postData.mediaUrl = req.fileUrl;
    postData.mediaType = singleFile.mimetype.startsWith('image') ? 'PHOTO' : 'VIDEO';
    postData.aspectRatio = ratio;
  }

  const post = await prisma.post.create({
    data: postData,
    include: postInclude(req.user.id),
  });

  logger.info('[POST] Post criado', { postId: post.id, userId: req.user.id, mediaCount: mediaFiles.length });

  return res.status(201).json(formatPost(post, req.user.id));
}

/**
 * GET /api/posts/feed
 * Feed do usuario: posts de quem ele segue + os proprios
 * Paginado, mais recentes primeiro
 */
async function getFeed(req, res) {
  const { page = 1, limit = 12 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  // IDs de quem o usuario segue
  const follows = await prisma.follow.findMany({
    where: { followerId: req.user.id },
    select: { followingId: true },
  });

  const followingIds = follows.map((f) => f.followingId);
  // Inclui os proprios posts no feed
  const authorIds = [...followingIds, req.user.id];

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where: { authorId: { in: authorIds } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: Number(limit),
      include: postInclude(req.user.id),
    }),
    prisma.post.count({ where: { authorId: { in: authorIds } } }),
  ]);

  return res.json({
    posts: posts.map((p) => formatPost(p, req.user.id)),
    page: Number(page),
    totalPages: Math.ceil(total / Number(limit)),
    total,
  });
}

/**
 * GET /api/posts/explore
 * Feed publico (explore): todos os posts, mais recentes
 */
async function getExploreFeed(req, res) {
  const { page = 1, limit = 12 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const currentUserId = req.user?.id || null;

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take: Number(limit),
      include: postInclude(currentUserId),
    }),
    prisma.post.count(),
  ]);

  return res.json({
    posts: posts.map((p) => formatPost(p, currentUserId)),
    page: Number(page),
    totalPages: Math.ceil(total / Number(limit)),
    total,
  });
}

/**
 * GET /api/posts/user/:userId
 * Posts de um usuario especifico (grid de perfil)
 */
async function getUserPosts(req, res) {
  const { userId } = req.params;
  const { page = 1, limit = 9 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const currentUserId = req.user?.id || null;

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: Number(limit),
      include: postInclude(currentUserId),
    }),
    prisma.post.count({ where: { authorId: userId } }),
  ]);

  return res.json({
    posts: posts.map((p) => formatPost(p, currentUserId)),
    page: Number(page),
    totalPages: Math.ceil(total / Number(limit)),
    total,
  });
}

/**
 * PUT /api/posts/:id
 * Atualiza a descricao de um post (apenas o autor)
 */
async function updatePost(req, res) {
  const { id } = req.params;
  const { description } = req.body;

  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) return res.status(404).json({ message: 'Post nao encontrado' });
  if (post.authorId !== req.user.id) return res.status(403).json({ message: 'Sem permissao' });

  const updated = await prisma.post.update({
    where: { id },
    data: { description: description ?? post.description },
  });

  return res.json({ post: updated });
}

/**
 * DELETE /api/posts/:id
 * Remove um post (apenas o autor)
 */
async function deletePost(req, res) {
  const { id } = req.params;

  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) return res.status(404).json({ message: 'Post nao encontrado' });
  if (post.authorId !== req.user.id) return res.status(403).json({ message: 'Sem permissao' });

  await prisma.post.delete({ where: { id } });
  logger.info('[POST] Post removido', { postId: id, userId: req.user.id });

  return res.json({ message: 'Post removido' });
}

/**
 * POST /api/posts/:id/like
 * Curtir post (toggle: se ja curtiu, remove a curtida)
 */
async function toggleLike(req, res) {
  const { id: postId } = req.params;
  const userId = req.user.id;

  const existing = await prisma.postLike.findUnique({
    where: { postId_userId: { postId, userId } },
  });

  if (existing) {
    await prisma.postLike.delete({ where: { postId_userId: { postId, userId } } });
    const count = await prisma.postLike.count({ where: { postId } });
    // Remove notificação de like ao descurtir
    const post = await prisma.post.findUnique({ where: { id: postId }, select: { authorId: true } });
    if (post) deleteNotification(post.authorId, userId, 'LIKE', { postId });
    return res.json({ liked: false, likeCount: count });
  }

  await prisma.postLike.create({ data: { postId, userId } });
  const count = await prisma.postLike.count({ where: { postId } });
  // Notifica o autor do post
  const post = await prisma.post.findUnique({ where: { id: postId }, select: { authorId: true } });
  if (post) createNotification(post.authorId, userId, 'LIKE', { postId });
  return res.json({ liked: true, likeCount: count });
}

/**
 * GET /api/posts/:id/comments
 * Lista comentarios de um post
 */
async function getComments(req, res) {
  const { id: postId } = req.params;

  const comments = await prisma.postComment.findMany({
    where: { postId },
    orderBy: { createdAt: 'asc' },
    include: {
      author: { select: { id: true, name: true, avatar: true } },
    },
  });

  return res.json({ comments });
}

/**
 * POST /api/posts/:id/comments
 * Adiciona comentario a um post
 */
async function addComment(req, res) {
  const { id: postId } = req.params;
  const { content } = req.body;

  if (!content || content.trim().length === 0) {
    return res.status(400).json({ message: 'Comentario nao pode ser vazio' });
  }

  if (content.length > 500) {
    return res.status(400).json({ message: 'Comentario muito longo (max 500 chars)' });
  }

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) return res.status(404).json({ message: 'Post nao encontrado' });

  const comment = await prisma.postComment.create({
    data: { postId, authorId: req.user.id, content: content.trim() },
    include: {
      author: { select: { id: true, name: true, avatar: true } },
    },
  });

  // Notifica o autor do post sobre o comentário
  createNotification(post.authorId, req.user.id, 'COMMENT', { postId });

  return res.status(201).json(comment);
}

/**
 * DELETE /api/posts/:id/comments/:commentId
 * Remove comentario (apenas autor do comentario ou do post)
 */
async function deleteComment(req, res) {
  const { id: postId, commentId } = req.params;

  const comment = await prisma.postComment.findUnique({
    where: { id: commentId },
    include: { post: { select: { authorId: true } } },
  });

  if (!comment) return res.status(404).json({ message: 'Comentario nao encontrado' });

  const isCommentAuthor = comment.authorId === req.user.id;
  const isPostAuthor = comment.post.authorId === req.user.id;

  if (!isCommentAuthor && !isPostAuthor) {
    return res.status(403).json({ message: 'Sem permissao' });
  }

  await prisma.postComment.delete({ where: { id: commentId } });
  return res.json({ message: 'Comentario removido' });
}

/**
 * PUT /api/posts/:id/comments/:commentId
 * Edita conteúdo do comentário (apenas o autor)
 */
async function updateComment(req, res) {
  const { commentId } = req.params;
  const { content } = req.body;

  if (!content || content.trim().length === 0) {
    return res.status(400).json({ message: 'Comentario nao pode ser vazio' });
  }
  if (content.length > 500) {
    return res.status(400).json({ message: 'Comentario muito longo (max 500 chars)' });
  }

  const comment = await prisma.postComment.findUnique({ where: { id: commentId } });
  if (!comment) return res.status(404).json({ message: 'Comentario nao encontrado' });
  if (comment.authorId !== req.user.id) return res.status(403).json({ message: 'Sem permissao' });

  const updated = await prisma.postComment.update({
    where: { id: commentId },
    data: { content: content.trim() },
    include: { author: { select: { id: true, name: true, avatar: true } } },
  });

  return res.json(updated);
}

/**
 * POST /api/posts/:id/save
 * Salvar/remover dos salvos (toggle)
 */
async function toggleSave(req, res) {
  const { id: postId } = req.params;
  const userId = req.user.id;

  const existing = await prisma.savedPost.findUnique({
    where: { postId_userId: { postId, userId } },
  });

  if (existing) {
    await prisma.savedPost.delete({ where: { postId_userId: { postId, userId } } });
    return res.json({ saved: false });
  }

  await prisma.savedPost.create({ data: { postId, userId } });
  return res.json({ saved: true });
}

/**
 * GET /api/posts/saved
 * Posts salvos pelo usuario logado
 */
async function getSavedPosts(req, res) {
  const { page = 1, limit = 9 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const [saved, total] = await Promise.all([
    prisma.savedPost.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      skip,
      take: Number(limit),
      include: {
        post: { include: postInclude(req.user.id) },
      },
    }),
    prisma.savedPost.count({ where: { userId: req.user.id } }),
  ]);

  return res.json({
    posts: saved.map((s) => formatPost(s.post, req.user.id)),
    page: Number(page),
    totalPages: Math.ceil(total / Number(limit)),
    total,
  });
}

module.exports = {
  createPost,
  updatePost,
  getFeed,
  getExploreFeed,
  getUserPosts,
  deletePost,
  toggleLike,
  getComments,
  addComment,
  deleteComment,
  updateComment,
  toggleSave,
  getSavedPosts,
};
