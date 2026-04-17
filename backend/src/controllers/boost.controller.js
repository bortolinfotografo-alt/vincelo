const { prisma } = require('../services/db');
const logger = require('../utils/logger');

const BOOST_DURATION_DAYS = 7;

/**
 * Retorna a data de expiração: agora + 7 dias
 */
function calcEndDate() {
  const d = new Date();
  d.setDate(d.getDate() + BOOST_DURATION_DAYS);
  return d;
}

/**
 * POST /api/boosts
 * Cria um impulsionamento para perfil ou vaga
 * body: { targetId, type: 'PROFILE' | 'JOB' }
 */
async function createBoost(req, res) {
  const { targetId, type } = req.body;
  const userId = req.user.id;

  if (!targetId || !['PROFILE', 'JOB'].includes(type)) {
    return res.status(400).json({ message: 'targetId e type (PROFILE | JOB) são obrigatórios' });
  }

  // Verifica propriedade do alvo
  if (type === 'PROFILE') {
    if (targetId !== userId) {
      return res.status(403).json({ message: 'Você só pode impulsionar seu próprio perfil' });
    }
  }

  if (type === 'JOB') {
    const job = await prisma.job.findUnique({ where: { id: targetId }, select: { company: { select: { userId: true } } } });
    if (!job) return res.status(404).json({ message: 'Vaga não encontrada' });
    if (job.company.userId !== userId) {
      return res.status(403).json({ message: 'Você só pode impulsionar suas próprias vagas' });
    }
  }

  // Verifica se já há boost ativo para este alvo
  const existing = await prisma.boost.findFirst({
    where: { userId, targetId, type, status: 'ACTIVE', endDate: { gt: new Date() } },
  });

  if (existing) {
    return res.status(409).json({
      message: 'Já existe um impulsionamento ativo para este item',
      boost: existing,
    });
  }

  const boost = await prisma.boost.create({
    data: {
      userId,
      targetId,
      type,
      startDate: new Date(),
      endDate: calcEndDate(),
      status: 'ACTIVE',
    },
  });

  logger.info('[BOOST] Impulsionamento criado', { userId, targetId, type });

  return res.status(201).json({ message: 'Impulsionamento ativado com sucesso', boost });
}

/**
 * GET /api/boosts/me
 * Lista meus impulsionamentos ativos
 */
async function getMyBoosts(req, res) {
  const userId = req.user.id;

  // Expira automaticamente os vencidos
  await prisma.boost.updateMany({
    where: { userId, status: 'ACTIVE', endDate: { lte: new Date() } },
    data: { status: 'EXPIRED' },
  });

  const boosts = await prisma.boost.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  return res.json({ boosts });
}

/**
 * DELETE /api/boosts/:id
 * Cancela um impulsionamento
 */
async function cancelBoost(req, res) {
  const userId = req.user.id;

  const boost = await prisma.boost.findUnique({ where: { id: req.params.id } });
  if (!boost) return res.status(404).json({ message: 'Impulsionamento não encontrado' });
  if (boost.userId !== userId) return res.status(403).json({ message: 'Acesso negado' });
  if (boost.status !== 'ACTIVE') return res.status(400).json({ message: 'Impulsionamento não está ativo' });

  await prisma.boost.update({ where: { id: boost.id }, data: { status: 'CANCELLED' } });

  return res.json({ message: 'Impulsionamento cancelado' });
}

/**
 * Utilitário interno: retorna Set de targetIds com boost ativo para um type
 * Usado pelos controllers de listagem
 */
async function getActiveBoostedIds(type) {
  const boosts = await prisma.boost.findMany({
    where: { type, status: 'ACTIVE', endDate: { gt: new Date() } },
    select: { targetId: true },
  });
  return new Set(boosts.map((b) => b.targetId));
}

/**
 * Utilitário interno: verifica se um targetId tem boost ativo
 */
async function isActiveBoost(targetId, type) {
  const boost = await prisma.boost.findFirst({
    where: { targetId, type, status: 'ACTIVE', endDate: { gt: new Date() } },
  });
  return !!boost;
}

module.exports = { createBoost, getMyBoosts, cancelBoost, getActiveBoostedIds, isActiveBoost };
