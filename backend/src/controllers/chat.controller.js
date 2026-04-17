// ============================================================
// CHAT CONTROLLER
// Mensagens entre usuarios (freelancer <-> empresa)
// ============================================================

const { prisma } = require('../services/db');
const logger = require('../utils/logger');
const { parsePagination } = require('../utils/helpers');

/**
 * POST /api/chat
 * Envia uma mensagem
 */
async function sendMessage(req, res) {
  const { receiverId, content, jobReference, storyPreviewUrl } = req.body;
  const mediaUrl  = req.fileUrl || null;
  const mediaType = req.file
    ? (req.file.mimetype.startsWith('image') ? 'PHOTO' : req.file.mimetype === 'application/pdf' ? 'DOCUMENT' : 'VIDEO')
    : null;

  // Precisa ter texto, mídia ou ser uma resposta a story
  if ((!content || !content.trim()) && !mediaUrl && !storyPreviewUrl) {
    return res.status(400).json({ message: 'Mensagem deve ter texto ou arquivo' });
  }

  if (!receiverId) {
    return res.status(400).json({ message: 'Destinatario e obrigatorio' });
  }

  if (receiverId === req.user.id) {
    return res.status(400).json({ message: 'Voce nao pode enviar mensagem para si mesmo' });
  }

  const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
  if (!receiver) {
    return res.status(404).json({ message: 'Destinatario nao encontrado' });
  }

  const message = await prisma.chatMessage.create({
    data: {
      senderId: req.user.id,
      receiverId,
      content: content?.trim() || null,
      mediaUrl,
      mediaType,
      storyPreviewUrl: storyPreviewUrl || null,
      jobReference: jobReference || null,
    },
    include: {
      sender: { select: { id: true, name: true, avatar: true } },
    },
  });

  return res.status(201).json({ message });
}

/**
 * GET /api/chat/:userId
 * Lista conversa com um usuario especifico (mensagens entre ambos)
 * Com paginacao e marca mensagens como lidas
 */
async function getConversation(req, res) {
  const { userId } = req.params;
  const { page, limit, skip } = parsePagination(req.query, 100);

  // Verifica se o usuario existe
  const otherUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, avatar: true },
  });

  if (!otherUser) {
    return res.status(404).json({ message: 'Usuario nao encontrado' });
  }

  const [messages, total] = await prisma.$transaction([
    prisma.chatMessage.findMany({
      where: {
        OR: [
          { senderId: req.user.id, receiverId: userId },
          { senderId: userId, receiverId: req.user.id },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
    }),
    prisma.chatMessage.count({
      where: {
        OR: [
          { senderId: req.user.id, receiverId: userId },
          { senderId: userId, receiverId: req.user.id },
        ],
      },
    }),
  ]);

  // Marca mensagens recebidas como lidas em background (nao bloqueia a resposta)
  prisma.chatMessage.updateMany({
    where: {
      senderId: userId,
      receiverId: req.user.id,
      isRead: false,
    },
    data: { isRead: true },
  }).catch((err) => logger.error('[CHAT] Erro ao marcar mensagens como lidas', { error: err.message }));

  return res.json({
    messages: messages.reverse(), // Ordem cronologica (mais antigas primeiro)
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    otherUser,
  });
}

/**
 * GET /api/chat
 * Lista todas as conversas do usuario (apenas a ultima mensagem de cada)
 * Paginado e limitado para nao carregar todas as mensagens
 */
async function listConversations(req, res) {
  const CONVERSATIONS_LIMIT = 100; // Maximo de mensagens recentes para agregar conversas

  // Busca as mensagens mais recentes do usuario (limitado)
  const messages = await prisma.chatMessage.findMany({
    where: {
      OR: [
        { senderId: req.user.id },
        { receiverId: req.user.id },
      ],
    },
    orderBy: { createdAt: 'desc' },
    take: CONVERSATIONS_LIMIT,
    include: {
      sender: { select: { id: true, name: true, avatar: true } },
      receiver: { select: { id: true, name: true, avatar: true } },
    },
  });

  // Agrupa por contato (apenas a ultima mensagem de cada conversa)
  const conversationMap = new Map();

  messages.forEach((msg) => {
    const otherUser = msg.senderId === req.user.id ? msg.receiver : msg.sender;
    const key = otherUser.id;

    if (!conversationMap.has(key)) {
      conversationMap.set(key, {
        user: otherUser,
        lastMessage: msg.content || (msg.mediaUrl ? '[Arquivo]' : ''),
        lastMessageAt: msg.createdAt,
        unreadCount: 0,
      });
    }

    // Conta nao lidas (mensagens do outro usuario para mim)
    if (msg.receiverId === req.user.id && !msg.isRead) {
      conversationMap.get(key).unreadCount++;
    }
  });

  const conversations = Array.from(conversationMap.values()).sort(
    (a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt)
  );

  return res.json({ conversations });
}

/**
 * GET /api/chat/unread-count
 * Retorna total de mensagens não lidas (para badge no ícone)
 */
async function getUnreadCount(req, res) {
  const count = await prisma.chatMessage.count({
    where: { receiverId: req.user.id, isRead: false },
  });
  return res.json({ count });
}

module.exports = {
  sendMessage,
  getConversation,
  listConversations,
  getUnreadCount,
};
