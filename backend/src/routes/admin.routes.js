const { Router } = require('express');
const { ensureAuthenticated, requireAdminRole } = require('../middlewares/auth.middleware');
const { listUsers, getUser, updateAdminRole, toggleUserActive, listPosts, listStories, listJobs, deletePost, deleteStory, deleteJob, listAuditLogs, getStats } = require('../controllers/admin.controller');

const router = Router();

router.use(ensureAuthenticated);

// Stats — qualquer admin
router.get('/stats', requireAdminRole('MODERATOR'), getStats);

// Users — moderador pode listar; admin+ pode alterar roles e banir
router.get('/users', requireAdminRole('MODERATOR'), listUsers);
router.get('/users/:id', requireAdminRole('MODERATOR'), getUser);
router.patch('/users/:id/admin-role', requireAdminRole('ADMIN'), updateAdminRole);
router.patch('/users/:id/toggle-active', requireAdminRole('MODERATOR'), toggleUserActive);

// Content moderation
router.get('/posts', requireAdminRole('MODERATOR'), listPosts);
router.get('/stories', requireAdminRole('MODERATOR'), listStories);
router.get('/jobs', requireAdminRole('MODERATOR'), listJobs);
router.delete('/posts/:id', requireAdminRole('MODERATOR'), deletePost);
router.delete('/stories/:id', requireAdminRole('MODERATOR'), deleteStory);
router.delete('/jobs/:id', requireAdminRole('MODERATOR'), deleteJob);

// Audit logs — admin+
router.get('/audit-logs', requireAdminRole('ADMIN'), listAuditLogs);

module.exports = router;
