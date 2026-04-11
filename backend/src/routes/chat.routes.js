// ============================================================
// CHAT ROUTES
// Rotas de mensagens
// ============================================================

const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const { ensureAuthenticated } = require('../middlewares/auth.middleware');

// Todas exigem autenticacao
router.get('/', ensureAuthenticated, chatController.listConversations);
router.post('/', ensureAuthenticated, chatController.sendMessage);
router.get('/:userId', ensureAuthenticated, chatController.getConversation);

module.exports = router;
