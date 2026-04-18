// ============================================================
// CHAT ROUTES
// Rotas de mensagens
// ============================================================

const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const { ensureAuthenticated } = require('../middlewares/auth.middleware');
const { upload, validateMagicBytes, createMultiUploadMiddleware } = require('../services/storage.service');

// Todas exigem autenticacao
router.get('/unread-count', ensureAuthenticated, chatController.getUnreadCount);
router.get('/', ensureAuthenticated, chatController.listConversations);
router.post(
  '/',
  ensureAuthenticated,
  upload.fields([{ name: 'media', maxCount: 10 }]),
  validateMagicBytes,
  createMultiUploadMiddleware('posts'),
  chatController.sendMessage
);
router.get('/:userId', ensureAuthenticated, chatController.getConversation);

module.exports = router;
