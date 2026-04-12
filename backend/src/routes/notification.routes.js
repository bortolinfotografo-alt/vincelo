// ============================================================
// NOTIFICATION ROUTES
// ============================================================

const express = require('express');
const router = express.Router();
const notifController = require('../controllers/notification.controller');
const { ensureAuthenticated } = require('../middlewares/auth.middleware');

router.get('/',                       ensureAuthenticated, notifController.listNotifications);
router.get('/unread-count',           ensureAuthenticated, notifController.getUnreadCount);
router.post('/read-all',              ensureAuthenticated, notifController.markAllRead);
router.patch('/:id/read',             ensureAuthenticated, notifController.markRead);

module.exports = router;
