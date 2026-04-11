// ============================================================
// REVIEW ROUTES
// Rotas de avaliacoes
// ============================================================

const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const { ensureAuthenticated } = require('../middlewares/auth.middleware');

// Publicas
router.get('/job/:jobId', reviewController.getJobReviews);
router.get('/user/:userId', reviewController.getUserReviews);

// Protegida (apenas quem participou do job)
router.post('/', ensureAuthenticated, reviewController.createReview);

module.exports = router;
