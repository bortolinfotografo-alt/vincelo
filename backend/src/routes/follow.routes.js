// ============================================================
// FOLLOW ROUTES
// Rotas do sistema de seguidores
// ============================================================

const express = require('express');
const router = express.Router();
const followController = require('../controllers/follow.controller');
const { ensureAuthenticated, optionalAuth } = require('../middlewares/auth.middleware');

// Sugestoes de quem seguir
router.get('/suggestions', ensureAuthenticated, followController.getSuggestions);

// Status de follow (segue ou nao) e contagens
router.get('/:userId/status', optionalAuth, followController.getFollowStatus);

// Listas
router.get('/:userId/followers', optionalAuth, followController.getFollowers);
router.get('/:userId/following', optionalAuth, followController.getFollowing);

// Seguir / deixar de seguir (toggle)
router.post('/:userId', ensureAuthenticated, followController.toggleFollow);

module.exports = router;
