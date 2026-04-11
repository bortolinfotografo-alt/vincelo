// ============================================================
// JOB ROUTES
// Rotas de vagas: CRUD e minhas vagas
// ============================================================

const express = require('express');
const router = express.Router();
const jobController = require('../controllers/job.controller');
const { ensureAuthenticated, ensureRole, optionalAuth } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { createJobSchema, updateJobSchema } = require('../schemas/job.schema');

// Listagem e detalhe sao publicos (visitantes podem ver vagas)
router.get('/', optionalAuth, jobController.listJobs);
router.get('/my', ensureAuthenticated, jobController.myJobs);
router.get('/:id', optionalAuth, jobController.getJobById);

// Apenas empresas podem criar e editar vagas
router.post('/', ensureAuthenticated, ensureRole('COMPANY'), validate(createJobSchema), jobController.createJob);
router.put('/:id', ensureAuthenticated, ensureRole('COMPANY'), validate(updateJobSchema), jobController.updateJob);
router.delete('/:id', ensureAuthenticated, ensureRole('COMPANY'), jobController.deleteJob);

module.exports = router;
