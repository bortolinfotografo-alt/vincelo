// ============================================================
// GOOGLE AUTH ROUTES
// Rotas de autenticação com Google OAuth 2.0
// ============================================================

const express = require('express');
const router = express.Router();
const { googleAuth, googleAuthCallback, getCurrentUser, exchangeToken } = require('../controllers/google-auth.controller');
const { ensureAuthenticated } = require('../middlewares/auth.middleware');

// Iniciar autenticação com Google
router.get('/google', googleAuth);

// Callback do Google OAuth
router.get('/google/callback', googleAuthCallback);

// Troca código temporário pós-OAuth pelo JWT real
router.get('/exchange', exchangeToken);

// Obter dados do usuário logado (requer autenticação)
router.get('/me', ensureAuthenticated, getCurrentUser);

module.exports = router;