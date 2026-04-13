// ============================================================
// GOOGLE AUTH ROUTES
// Rotas de autenticação com Google OAuth 2.0
// ============================================================

const express = require('express');
const router = express.Router();
const { googleAuth, googleAuthCallback, getCurrentUser } = require('../controllers/google-auth.controller');
const { ensureAuthenticated } = require('../middlewares/auth.middleware');

// Iniciar autenticação com Google
router.get('/google', googleAuth);

// Callback do Google OAuth
router.get('/google/callback', googleAuthCallback);

// Obter dados do usuário logado (requer autenticação)
router.get('/me', ensureAuthenticated, getCurrentUser);

module.exports = router;