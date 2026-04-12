// ============================================================
// CHAT ROUTES
// Rotas de mensagens
// ============================================================

const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const { ensureAuthenticated } = require('../middlewares/auth.middleware');
const { upload, validateMagicBytes, createUploadMiddleware } = require('../services/storage.service');

// Todas exigem autenticacao
router.get('/', ensureAuthenticated, chatController.listConversations);
router.post('/', ensureAuthenticated, upload.single('media'), validateMagicBytes, createUploadMiddleware('chat'), chatController.sendMessage);
router.get('/:userId', ensureAuthenticated, chatController.getConversation);

module.exports = router;
