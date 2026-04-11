// ============================================================
// SCHEDULE CONTROLLER
// Gerencia disponibilidade do freelancer (agenda/calendario)
// ============================================================

const { prisma } = require('../services/db');

/**
 * POST /api/schedule/unavailable
 * Marca um dia como indisponivel
 */
async function addUnavailableDate(req, res) {
  const { date, reason } = req.body;

  // So freelancer pode definir indisponibilidade
  const freelancer = await prisma.freelancerProfile.findUnique({
    where: { userId: req.user.id },
  });

  if (!freelancer) {
    return res.status(400).json({ message: 'Perfil de freelancer necessario' });
  }

  try {
    const unavailability = await prisma.unavailableDate.create({
      data: {
        freelancerId: freelancer.id,
        date: new Date(date),
        reason: reason || null,
      },
    });

    return res.status(201).json({ message: 'Data marcada como indisponivel', unavailability });
  } catch (error) {
    // Constraint unique: ja existe
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Esta data ja esta marcada como indisponivel' });
    }
    throw error;
  }
}

/**
 * DELETE /api/schedule/unavailable/:id
 * Remove indisponibilidade
 */
async function removeUnavailableDate(req, res) {
  const record = await prisma.unavailableDate.findUnique({
    where: { id: req.params.id },
    include: { freelancer: true },
  });

  if (!record) {
    return res.status(404).json({ message: 'Registro nao encontrado' });
  }

  if (record.freelancer.userId !== req.user.id) {
    return res.status(403).json({ message: 'Acesso negado' });
  }

  await prisma.unavailableDate.delete({ where: { id: req.params.id } });

  return res.json({ message: 'Data removida da indisponibilidade' });
}

/**
 * GET /api/schedule/availability/:freelancerId
 * Lista datas indisponiveis de um freelancer
 */
async function getAvailability(req, res) {
  const { freelancerId } = req.params;
  const { startDate, endDate } = req.query;

  // Monta filtro de datas se fornecido
  const where = { freelancerId };

  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }

  const unavailableDates = await prisma.unavailableDate.findMany({
    where,
    orderBy: { date: 'asc' },
  });

  const freelancer = await prisma.freelancerProfile.findUnique({
    where: { id: freelancerId },
    select: { available: true },
  });

  return res.json({
    available: freelancer?.available ?? false,
    unavailableDates: unavailableDates.map((d) => ({
      id: d.id,
      date: d.date,
      reason: d.reason,
    })),
  });
}

/**
 * PUT /api/schedule/availability
 * Define se freelancer esta disponivel (switch geral)
 */
async function toggleAvailability(req, res) {
  const { available } = req.body;

  const freelancer = await prisma.freelancerProfile.update({
    where: { userId: req.user.id },
    data: { available: !!available },
  });

  return res.json({
    message: `Disponibilidade ${available ? 'ativada' : 'desativada'}`,
    available: freelancer.available,
  });
}

module.exports = {
  addUnavailableDate,
  removeUnavailableDate,
  getAvailability,
  toggleAvailability,
};
