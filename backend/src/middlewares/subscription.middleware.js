// ============================================================
// SUBSCRIPTION MIDDLEWARE
// Verifica se o usuario tem assinatura ativa
// ============================================================

const { prisma } = require('../services/db');

/**
 * Verifica se o usuario tem assinatura ativa (INACTIVE, CANCELLED, PAST_DUE bloqueiam)
 */
async function requireActiveSubscription(req, res, next) {
  const userId = req.user.id;

  const subscription = await prisma.stripeSubscription.findUnique({
    where: { userId },
  });

  // Se nao tem registro de assinatura ou esta inativa
  if (!subscription || subscription.status !== 'ACTIVE') {
    return res.status(402).json({
      message: 'Assinatura necessaria para acessar esta funcionalidade. Por favor, assine o plano.',
      subscriptionStatus: subscription?.status || 'NONE',
    });
  }

  // Tambem marca o user como ativo
  await prisma.user.update({
    where: { id: userId },
    data: { isActive: true },
  });

  return next();
}

module.exports = { requireActiveSubscription };
