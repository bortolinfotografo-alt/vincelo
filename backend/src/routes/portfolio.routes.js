// ============================================================
// PORTFOLIO ROUTES
// Rotas de portfolio do freelancer (crud com upload)
// ============================================================

const express = require('express');
const router = express.Router();
const portfolioController = require('../controllers/portfolio.controller');
const { upload, validateMagicBytes, createUploadMiddleware } = require('../services/storage.service');
const { ensureAuthenticated } = require('../middlewares/auth.middleware');

// Publica
router.get('/:freelancerId', portfolioController.getPortfolio);

// Protegidas (apenas freelancer dono pode adicionar/editar/remover)
router.post('/', ensureAuthenticated, upload.single('file'), validateMagicBytes, createUploadMiddleware('portfolio'), portfolioController.addPortfolioItem);
router.put('/:id', ensureAuthenticated, upload.single('file'), validateMagicBytes, createUploadMiddleware('portfolio'), portfolioController.updatePortfolioItem);
router.delete('/:id', ensureAuthenticated, portfolioController.deletePortfolioItem);

module.exports = router;
