// ============================================================
// PAYMENT ROUTES
// Rotas de pagamento via Stripe
// ============================================================

const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { ensureAuthenticated } = require('../middlewares/auth.middleware');

// Webhook precisa vir antes de outros middlewares para processar body raw
const { requireRawBody } = require('../middlewares/rawbody.middleware');

// Webhook do Stripe (body parser custom)
router.post('/webhook', requireRawBody, paymentController.webhook);

// Rotas protegidas
router.post('/subscribe', ensureAuthenticated, paymentController.subscribe);
router.get('/status', ensureAuthenticated, paymentController.getSubscriptionStatus);
router.post('/cancel', ensureAuthenticated, paymentController.cancelSubscription);

module.exports = router;
