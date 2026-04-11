// ============================================================
// PROPOSAL ROUTES
// Rotas de candidaturas
// ============================================================

const express = require('express');
const router = express.Router();
const proposalController = require('../controllers/proposal.controller');
const { ensureAuthenticated, ensureRole } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { createProposalSchema, updateProposalStatusSchema } = require('../schemas/proposal.schema');

// Apenas freelancer pode se candidatar e ver suas propostas
router.post('/', ensureAuthenticated, ensureRole('FREELANCER'), validate(createProposalSchema), proposalController.createProposal);
router.get('/my', ensureAuthenticated, ensureRole('FREELANCER'), proposalController.myProposals);

// Apenas empresa pode ver candidatos e aprovar/recusar
router.get('/job/:jobId', ensureAuthenticated, ensureRole('COMPANY'), proposalController.listProposalsForJob);
router.put('/:id/status', ensureAuthenticated, ensureRole('COMPANY'), validate(updateProposalStatusSchema), proposalController.updateProposalStatus);

module.exports = router;
