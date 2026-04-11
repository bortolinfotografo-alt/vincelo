// ============================================================
// STORY ROUTES
// Rotas de stories de 24h
// ============================================================

const express = require('express');
const router = express.Router();
const storyController = require('../controllers/story.controller');
const { ensureAuthenticated, optionalAuth } = require('../middlewares/auth.middleware');
const { upload, validateMagicBytes, createUploadMiddleware } = require('../services/storage.service');

// Feed de stories (usuarios seguidos)
router.get('/feed', ensureAuthenticated, storyController.getStoriesFeed);

// Stories de um usuario especifico
router.get('/user/:userId', optionalAuth, storyController.getUserStories);

// Criar story (upload obrigatorio)
router.post('/', ensureAuthenticated, upload.single('media'), validateMagicBytes, createUploadMiddleware('stories'), storyController.createStory);

// Remover story
router.delete('/:id', ensureAuthenticated, storyController.deleteStory);

// Registrar visualizacao
router.post('/:id/view', ensureAuthenticated, storyController.viewStory);

// Curtir story (toggle)
router.post('/:id/like', ensureAuthenticated, storyController.toggleLike);

// Listar quem viu (apenas autor)
router.get('/:id/views', ensureAuthenticated, storyController.getStoryViews);

module.exports = router;
