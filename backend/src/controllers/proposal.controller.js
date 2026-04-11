// ============================================================
// PROPOSAL CONTROLLER
// Candidatura a vagas, aprovar/recusar candidatos
// ============================================================

const { prisma } = require('../services/db');
const { calculateAvgRating } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * POST /api/proposals
 * Freelancer se candidata a uma vaga
 */
async function createProposal(req, res) {
  const { jobId, coverLetter, proposedBudget } = req.body;

  // Busca freelancer com dados de disponibilidade
  const freelancer = await prisma.freelancerProfile.findUnique({
    where: { userId: req.user.id },
  });

  if (!freelancer) {
    return res.status(400).json({
      message: 'Perfil de freelancer necessario para se candidatar',
    });
  }

  // Bloqueia candidatura se freelancer marcou disponibilidade como false
  if (!freelancer.available) {
    return res.status(400).json({
      message: 'Voce esta marcado como indisponivel. Atualize sua disponibilidade no perfil antes de se candidatar.',
    });
  }

  // Verifica se a vaga existe e esta aberta
  const job = await prisma.job.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    return res.status(404).json({ message: 'Vaga nao encontrada' });
  }

  if (job.status !== 'OPEN') {
    return res.status(400).json({
      message: 'Vaga nao esta mais aberta para candidaturas',
    });
  }

  // Verifica se a data da vaga nao passou (se houver data)
  if (job.jobDate) {
    const jobDate = new Date(job.jobDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (jobDate < today) {
      return res.status(400).json({
        message: 'Nao e possivel se candidatar a uma vaga com data ja passada',
      });
    }
  }

  // Verifica se freelancer ja se candidatou
  const existingProposal = await prisma.proposal.findUnique({
    where: { jobId_freelancerId: { jobId, freelancerId: freelancer.id } },
  });

  if (existingProposal) {
    return res.status(409).json({
      message: 'Voce ja se candidatou a esta vaga',
    });
  }

  const proposal = await prisma.proposal.create({
    data: {
      jobId,
      freelancerId: freelancer.id,
      coverLetter,
      proposedBudget: proposedBudget ? Number(proposedBudget) : null,
    },
    include: {
      freelancer: {
        include: {
          user: { select: { id: true, name: true, avatar: true } },
        },
      },
    },
  });

  logger.info('[PROPOSAL] Candidatura criada', { proposalId: proposal.id, jobId, freelancerId: freelancer.id });

  return res.status(201).json({ message: 'Candidatura realizada com sucesso', proposal });
}

/**
 * GET /api/proposals/job/:jobId
 * Lista candidaturas de uma vaga (apenas empresa dona da vaga)
 */
async function listProposalsForJob(req, res) {
  const job = await prisma.job.findUnique({
    where: { id: req.params.jobId },
    include: { company: true },
  });

  if (!job) {
    return res.status(404).json({ message: 'Vaga nao encontrada' });
  }

  if (job.company.userId !== req.user.id) {
    return res.status(403).json({ message: 'Acesso negado. Apenas o criador da vaga pode ver candidatos.' });
  }

  const proposals = await prisma.proposal.findMany({
    where: { jobId: req.params.jobId },
    include: {
      freelancer: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
              description: true,
              reviewsReceived: { select: { rating: true } },
            },
          },
          portfolio: { take: 3, orderBy: { order: 'asc' } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Calcula nota media de cada freelancer usando reviewsReceived do User
  const result = proposals.map((p) => {
    const reviews = p.freelancer.user?.reviewsReceived || [];
    const avgRating = calculateAvgRating(reviews);

    return {
      ...p,
      freelancer: {
        ...p.freelancer,
        avgRating,
        reviewCount: reviews.length,
      },
    };
  });

  return res.json({ proposals: result, total: result.length });
}

/**
 * PUT /api/proposals/:id/status
 * Empresa aprova ou recusa candidatura
 */
async function updateProposalStatus(req, res) {
  const { status } = req.body;

  if (!['ACCEPTED', 'REJECTED'].includes(status)) {
    return res.status(400).json({ message: 'Status deve ser ACCEPTED ou REJECTED' });
  }

  const proposal = await prisma.proposal.findUnique({
    where: { id: req.params.id },
    include: {
      job: { include: { company: true } },
      freelancer: { include: { user: true } },
    },
  });

  if (!proposal) {
    return res.status(404).json({ message: 'Candidatura nao encontrada' });
  }

  // Verifica se e a empresa dona da vaga
  if (proposal.job.company.userId !== req.user.id) {
    return res.status(403).json({ message: 'Acesso negado' });
  }

  // Nao permite alterar proposta que ja foi decidida
  if (proposal.status !== 'PENDING') {
    return res.status(400).json({
      message: `Esta candidatura ja foi ${proposal.status === 'ACCEPTED' ? 'aceita' : 'recusada'}`,
    });
  }

  if (status === 'ACCEPTED') {
    await prisma.$transaction([
      // Aceita esta proposta
      prisma.proposal.update({
        where: { id: proposal.id },
        data: { status: 'ACCEPTED' },
      }),
      // Recusa todas as outras desta vaga
      prisma.proposal.updateMany({
        where: { jobId: proposal.jobId, id: { not: proposal.id } },
        data: { status: 'REJECTED' },
      }),
      // Atualiza status do job e atribui ao freelancer
      prisma.job.update({
        where: { id: proposal.jobId },
        data: {
          status: 'IN_PROGRESS',
          assignedTo: proposal.freelancerId,
        },
      }),
    ]);

    logger.info('[PROPOSAL] Candidatura aceita', { proposalId: proposal.id, jobId: proposal.jobId });
  } else {
    await prisma.proposal.update({
      where: { id: proposal.id },
      data: { status: 'REJECTED' },
    });

    logger.info('[PROPOSAL] Candidatura recusada', { proposalId: proposal.id });
  }

  return res.json({ message: `Candidatura ${status === 'ACCEPTED' ? 'aceita' : 'recusada'} com sucesso` });
}

/**
 * GET /api/proposals/my
 * Lista propostas do freelancer logado
 */
async function myProposals(req, res) {
  const freelancer = await prisma.freelancerProfile.findUnique({
    where: { userId: req.user.id },
  });

  if (!freelancer) {
    return res.status(400).json({ message: 'Perfil de freelancer nao encontrado' });
  }

  const proposals = await prisma.proposal.findMany({
    where: { freelancerId: freelancer.id },
    include: {
      job: {
        include: {
          company: {
            include: {
              user: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return res.json({ proposals, total: proposals.length });
}

module.exports = {
  createProposal,
  listProposalsForJob,
  updateProposalStatus,
  myProposals,
};
