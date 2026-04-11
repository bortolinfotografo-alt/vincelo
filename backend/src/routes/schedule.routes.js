// ============================================================
// SCHEDULE ROUTES
// Rotas de agenda/disponibilidade do freelancer
// ============================================================

const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/schedule.controller');
const { ensureAuthenticated } = require('../middlewares/auth.middleware');

// Publica - qualquer um pode ver disponibilidade
router.get('/availability/:freelancerId', scheduleController.getAvailability);

// Protegidas - apenas freelancer pode gerenciar sua agenda
router.post('/unavailable', ensureAuthenticated, scheduleController.addUnavailableDate);
router.delete('/unavailable/:id', ensureAuthenticated, scheduleController.removeUnavailableDate);
router.put('/availability', ensureAuthenticated, scheduleController.toggleAvailability);

module.exports = router;
