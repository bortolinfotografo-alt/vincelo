// ============================================================
// REVIEW CONTROLLER
// Avaliacoes pos-trabalho entre freelancer e empresa
// ============================================================

const { prisma } = require('../services/db');

/**
 * POST /api/reviews
 * Cria uma avaliacao (1-5 estrelas + comentario)
 */
async function createReview(req, res) {
  const { reviewedId, jobId, rating, comment } = req.body;

  // Validacao: 1-5 estrelas
  if (rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'Nota deve ser entre 1 e 5' });
  }

  // Verifica se o job existe
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      company: true,
      assignedFreelancer: { include: { user: true } },
    },
  });

  if (!job) {
    return res.status(404).json({ message: 'Job nao encontrado' });
  }

  // Apenas pode avaliar quem participou do job
  const reviewer = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: { freelancer: true, company: true },
  });

  const isJobParticipant =
    (reviewer.company?.id === job.companyId) ||
    (reviewer.freelancer?.id === job.assignedTo);

  if (!isJobParticipant) {
    return res.status(403).json({
      message: 'Apenas participantes do job podem avaliar',
    });
  }

  // Ja avaliou neste job?
  const existingReview = await prisma.review.findUnique({
    where: {
      reviewerId_reviewedId_jobId: {
        reviewerId: req.user.id,
        reviewedId,
        jobId,
      },
    },
  });

  if (existingReview) {
    return res.status(409).json({ message: 'Voce ja avaliou este usuario neste job' });
  }

  // Descobre qual profile (freelancer ou company) esta sendo avaliado
  const reviewedUser = await prisma.user.findUnique({
    where: { id: reviewedId },
    include: { freelancer: true, company: true },
  });

  if (!reviewedUser) {
    return res.status(404).json({ message: 'Usuario avaliado nao encontrado' });
  }

  const review = await prisma.review.create({
    data: {
      reviewerId: req.user.id,
      reviewedId,
      jobId,
      rating,
      comment,
    },
  });

  return res.status(201).json({ message: 'Avaliacao criada com sucesso', review });
}

/**
 * GET /api/reviews/job/:jobId
 * Avaliacoes de um job especifico
 */
async function getJobReviews(req, res) {
  const reviews = await prisma.review.findMany({
    where: { jobId: req.params.jobId },
    include: {
      reviewer: { select: { id: true, name: true, avatar: true } },
      reviewedUser: { select: { id: true, name: true, avatar: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return res.json({ reviews });
}

/**
 * GET /api/reviews/user/:userId
 * Todas as avaliacoes de um usuario
 */
async function getUserReviews(req, res) {
  const reviews = await prisma.review.findMany({
    where: { reviewedId: req.params.userId },
    include: {
      reviewer: { select: { id: true, name: true, avatar: true } },
      job: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Calcula media
  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return res.json({
    reviews,
    total: reviews.length,
    avgRating: Number(avgRating.toFixed(1)),
  });
}

module.exports = {
  createReview,
  getJobReviews,
  getUserReviews,
};
