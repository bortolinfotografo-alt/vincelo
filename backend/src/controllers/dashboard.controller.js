// ============================================================
// DASHBOARD CONTROLLER
// Dados resumidos para o dashboard (diferente por role)
// ============================================================

const { prisma } = require('../services/db');
const { calculateAvgRating } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * GET /api/dashboard
 * Retorna dados do dashboard baseado no role do usuario
 */
async function getDashboard(req, res) {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: {
      freelancer: true,
      company: true,
      subscription: true,
      reviewsReceived: { select: { rating: true } },
    },
  });

  if (!user) {
    return res.status(404).json({ message: 'Usuario nao encontrado' });
  }

  if (user.role === 'FREELANCER') {
    return await getFreelancerDashboard(req, res, user);
  }

  if (user.role === 'COMPANY') {
    return await getCompanyDashboard(req, res, user);
  }

  return res.status(400).json({ message: 'Role nao reconhecido' });
}

/**
 * Dashboard para freelancer
 */
async function getFreelancerDashboard(req, res, user) {
  const freelancerId = user.freelancer?.id;

  if (!freelancerId) {
    return res.json({
      role: 'FREELANCER',
      stats: {},
    });
  }

  // Conta propostas por status
  // groupBy retorna [{ status: 'PENDING', _count: { _all: 3 } }]
  const proposals = await prisma.proposal.groupBy({
    by: ['status'],
    where: { freelancerId },
    _count: { _all: true },
  });

  // Jobs onde freelancer foi contratado
  const hiredJobs = await prisma.job.findMany({
    where: { assignedTo: freelancerId },
    include: {
      company: {
        include: {
          user: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  // Indisponibilidade do mes
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const unavailableDates = await prisma.unavailableDate.findMany({
    where: {
      freelancerId,
      date: { gte: monthStart, lte: monthEnd },
    },
    orderBy: { date: 'asc' },
  });

  // Monta stats de propostas corretamente (_count._all e nao _count)
  const proposalStats = { pending: 0, accepted: 0, rejected: 0 };
  proposals.forEach((p) => {
    const key = p.status.toLowerCase();
    if (key in proposalStats) {
      proposalStats[key] = p._count._all;
    }
  });

  // Candidaturas recentes do freelancer
  const recentProposals = await prisma.proposal.findMany({
    where: { freelancerId },
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
    take: 10,
  });

  const avgRating = calculateAvgRating(user.reviewsReceived);

  logger.debug('[DASHBOARD] Freelancer dashboard carregado', { userId: user.id });

  return res.json({
    role: 'FREELANCER',
    stats: {
      proposalsApplied: proposalStats.pending + proposalStats.accepted + proposalStats.rejected,
      pendingProposals: proposalStats.pending,
      acceptedProposals: proposalStats.accepted,
      rejectedProposals: proposalStats.rejected,
      hiredJobs: hiredJobs.length,
      avgRating,
      reviewCount: user.reviewsReceived.length,
      isAvailable: user.freelancer?.available,
    },
    unavailableDates,
    recentJobs: hiredJobs,
    recentProposals,
  });
}

/**
 * Dashboard para empresa
 */
async function getCompanyDashboard(req, res, user) {
  const companyId = user.company?.id;

  if (!companyId) {
    return res.json({
      role: 'COMPANY',
      stats: {},
    });
  }

  // Jobs criados
  const jobs = await prisma.job.findMany({
    where: { companyId },
    include: {
      _count: { select: { proposals: true } },
      assignedFreelancer: {
        include: {
          user: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Estatisticas por status
  const jobStats = { OPEN: 0, IN_PROGRESS: 0, COMPLETED: 0, CANCELLED: 0 };
  let totalCandidates = 0;

  jobs.forEach((job) => {
    if (job.status in jobStats) {
      jobStats[job.status] += 1;
    }
    totalCandidates += job._count?.proposals || 0;
  });

  logger.debug('[DASHBOARD] Company dashboard carregado', { userId: user.id });

  return res.json({
    role: 'COMPANY',
    stats: {
      totalJobs: jobs.length,
      openJobs: jobStats.OPEN,
      inProgressJobs: jobStats.IN_PROGRESS,
      completedJobs: jobStats.COMPLETED,
      cancelledJobs: jobStats.CANCELLED,
      totalCandidates,
    },
    recentJobs: jobs,
  });
}

module.exports = {
  getDashboard,
};
