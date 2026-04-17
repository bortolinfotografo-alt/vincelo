// ============================================================
// USER ROUTES
// Rotas de perfil: listar freelancers, detalhe, atualizar perfil
// ============================================================

const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { ensureAuthenticated } = require('../middlewares/auth.middleware');
const { upload, validateMagicBytes, createUploadMiddleware } = require('../services/storage.service');
const { validate } = require('../middlewares/validate.middleware');
const { updateProfileSchema } = require('../schemas/user.schema');

// Rota publica para listar freelancers
router.get('/freelancers', userController.listFreelancers);
router.get('/companies', userController.listCompanies);
router.get('/:id', userController.getUserById);

// Rotas protegidas
router.put('/heartbeat', ensureAuthenticated, userController.heartbeat);
router.put('/profile', ensureAuthenticated, upload.single('avatar'), validateMagicBytes, createUploadMiddleware('avatars'), userController.updateProfile);

module.exports = router;
