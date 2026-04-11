// ============================================================
// POST ROUTES
// Rotas de posts sociais: feed, criar, curtir, comentar, salvar
// ============================================================

const express = require('express');
const router = express.Router();
const postController = require('../controllers/post.controller');
const { ensureAuthenticated, optionalAuth } = require('../middlewares/auth.middleware');
const { upload, validateMagicBytes, createMultiUploadMiddleware } = require('../services/storage.service');

// Feed e explore sao protegidos (feed personalizado exige login)
router.get('/feed', ensureAuthenticated, postController.getFeed);
router.get('/explore', optionalAuth, postController.getExploreFeed);
router.get('/saved', ensureAuthenticated, postController.getSavedPosts);
router.get('/user/:userId', optionalAuth, postController.getUserPosts);

// Criar post (até 10 mídias + 1 thumbnail opcional)
router.post(
  '/',
  ensureAuthenticated,
  upload.fields([
    { name: 'media', maxCount: 10 },
    { name: 'thumbnail', maxCount: 1 },
  ]),
  validateMagicBytes,
  createMultiUploadMiddleware('posts'),
  postController.createPost
);

// Editar descricao do post
router.put('/:id', ensureAuthenticated, postController.updatePost);

// Remover post
router.delete('/:id', ensureAuthenticated, postController.deletePost);

// Curtir (toggle)
router.post('/:id/like', ensureAuthenticated, postController.toggleLike);

// Comentarios
router.get('/:id/comments', optionalAuth, postController.getComments);
router.post('/:id/comments', ensureAuthenticated, postController.addComment);
router.delete('/:id/comments/:commentId', ensureAuthenticated, postController.deleteComment);

// Salvar (toggle)
router.post('/:id/save', ensureAuthenticated, postController.toggleSave);

module.exports = router;
