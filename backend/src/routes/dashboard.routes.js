// ============================================================
// DASHBOARD ROUTES
// Dados do dashboard (diferente para freelancer e empresa)
// ============================================================

const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { ensureAuthenticated } = require('../middlewares/auth.middleware');

router.get('/', ensureAuthenticated, dashboardController.getDashboard);

module.exports = router;
