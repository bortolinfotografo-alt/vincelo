// ============================================================
// PORTFOLIO CONTROLLER
// Gerencia portfolio do freelancer (CRUD de midias)
// ============================================================

const { prisma } = require('../services/db');

/**
 * POST /api/portfolio
 * Adiciona item ao portfolio (com upload de arquivo)
 */
async function addPortfolioItem(req, res) {
  const { title, description, mediaType, order } = req.body;

  // So freelancer pode ter portfolio
  const freelancer = await prisma.freelancerProfile.findUnique({
    where: { userId: req.user.id },
  });

  if (!freelancer) {
    return res.status(400).json({ message: 'Perfil de freelancer necessario' });
  }

  // Precisa ter upload de arquivo
  if (!req.file) {
    return res.status(400).json({ message: 'Arquivo obrigator para portfolio' });
  }

  // Determina tipo de midia pelo mime type se nao foi informado
  const type = mediaType || (req.file.mimetype.startsWith('image') ? 'PHOTO' : 'VIDEO');

  const item = await prisma.portfolioItem.create({
    data: {
      freelancerId: freelancer.id,
      title,
      description: description || null,
      mediaType: type,
      url: req.fileUrl,
      order: Number(order) || 0,
    },
  });

  return res.status(201).json({ message: 'Item adicionado ao portfolio', item });
}

/**
 * GET /api/portfolio/:freelancerId
 * Lista portfolio de um freelancer especifico
 */
async function getPortfolio(req, res) {
  const items = await prisma.portfolioItem.findMany({
    where: { freelancerId: req.params.freelancerId },
    orderBy: { order: 'asc' },
  });

  return res.json({ items });
}

/**
 * PUT /api/portfolio/:id
 * Atualiza item do portfolio
 */
async function updatePortfolioItem(req, res) {
  const item = await prisma.portfolioItem.findUnique({
    where: { id: req.params.id },
    include: { freelancer: true },
  });

  if (!item) {
    return res.status(404).json({ message: 'Item nao encontrado' });
  }

  // Verifica se e dono do portfolio
  if (item.freelancer.userId !== req.user.id) {
    return res.status(403).json({ message: 'Acesso negado' });
  }

  const { title, description, order } = req.body;

  // Se tem upload novo, atualiza URL
  const updateData = {};
  if (title) updateData.title = title;
  if (description) updateData.description = description;
  if (order) updateData.order = Number(order);

  if (req.file) {
    updateData.url = req.fileUrl;
    updateData.mediaType = req.file.mimetype.startsWith('image') ? 'PHOTO' : 'VIDEO';
  }

  const updatedItem = await prisma.portfolioItem.update({
    where: { id: req.params.id },
    data: updateData,
  });

  return res.json({ message: 'Item atualizado', item: updatedItem });
}

/**
 * DELETE /api/portfolio/:id
 * Remove item do portfolio
 */
async function deletePortfolioItem(req, res) {
  const item = await prisma.portfolioItem.findUnique({
    where: { id: req.params.id },
    include: { freelancer: true },
  });

  if (!item) {
    return res.status(404).json({ message: 'Item nao encontrado' });
  }

  if (item.freelancer.userId !== req.user.id) {
    return res.status(403).json({ message: 'Acesso negado' });
  }

  await prisma.portfolioItem.delete({ where: { id: req.params.id } });

  return res.json({ message: 'Item removido do portfolio' });
}

module.exports = {
  addPortfolioItem,
  getPortfolio,
  updatePortfolioItem,
  deletePortfolioItem,
};
