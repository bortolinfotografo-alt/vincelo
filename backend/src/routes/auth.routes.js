// ============================================================
// AUTH ROUTES
// Rotas de autenticacao: login, cadastro, forgot password, me
// ============================================================

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { ensureAuthenticated } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } = require('../schemas/auth.schema');

// Publicas (com validação Zod)
router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

// Exige autenticacao
router.get('/me', ensureAuthenticated, authController.me);

module.exports = router;
