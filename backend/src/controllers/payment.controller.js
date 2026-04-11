// ============================================================
// PAYMENT CONTROLLER
// Integracao com Stripe para assinatura mensal
// ============================================================

const Stripe = require('stripe');
const { prisma } = require('../services/db');
const logger = require('../utils/logger');

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-02-15' })
  : null;

/**
 * POST /api/payments/subscribe
 * Inicia assinatura - retorna URL de checkout do Stripe
 */
async function subscribe(req, res) {
  if (!stripe) {
    return res.status(501).json({
      message: 'Stripe nao configurado. Defina STRIPE_SECRET_KEY no .env',
    });
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: { subscription: true },
  });

  if (user.subscription && user.subscription.status === 'ACTIVE') {
    return res.status(400).json({ message: 'Voce ja possui assinatura ativa' });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      customer: user.subscription?.stripeCustomerId || undefined,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: `${process.env.CORS_ORIGIN || 'http://localhost:3000'}/dashboard?status=success`,
      cancel_url: `${process.env.CORS_ORIGIN || 'http://localhost:3000'}/dashboard?status=cancelled`,
      metadata: {
        userId: user.id,
      },
    });

    logger.info('[PAYMENT] Sessao de checkout criada', { userId: user.id, sessionId: session.id });

    return res.json({ sessionId: session.id, checkoutUrl: session.url });
  } catch (error) {
    logger.error('[STRIPE ERROR] Falha ao criar sessao de checkout', { error: error.message });
    return res.status(500).json({ message: 'Erro ao criar sessao de pagamento', error: error.message });
  }
}

/**
 * POST /api/payments/webhook
 * Webhook do Stripe - recebe eventos de pagamento
 */
async function webhook(req, res) {
  if (!stripe) {
    return res.status(501).json({ message: 'Stripe nao configurado' });
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    logger.warn('[STRIPE WEBHOOK] Assinatura invalida', { error: error.message });
    return res.status(400).json({ message: 'Webhook invalido' });
  }

  logger.info('[STRIPE WEBHOOK] Evento recebido', { type: event.type });

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const userId = session.metadata?.userId;

      // Valida que userId existe antes de usar
      if (!userId) {
        logger.error('[STRIPE WEBHOOK] userId ausente no metadata', { sessionId: session.id });
        break;
      }

      // Verifica se o usuario existe no banco
      const userExists = await prisma.user.findUnique({ where: { id: userId } });
      if (!userExists) {
        logger.error('[STRIPE WEBHOOK] Usuario nao encontrado', { userId });
        break;
      }

      await prisma.stripeSubscription.upsert({
        where: { userId },
        create: {
          userId,
          stripeCustomerId: session.customer,
          stripeSubscriptionId: session.subscription,
          status: 'ACTIVE',
        },
        update: {
          stripeCustomerId: session.customer,
          stripeSubscriptionId: session.subscription,
          status: 'ACTIVE',
        },
      });

      await prisma.user.update({
        where: { id: userId },
        data: { isActive: true },
      });

      logger.info('[STRIPE WEBHOOK] Assinatura ativada', { userId });
      break;
    }

    case 'invoice.paid': {
      const invoice = event.data.object;
      const customerId = invoice.customer;

      const subscription = await prisma.stripeSubscription.findFirst({
        where: { stripeCustomerId: customerId },
      });

      if (subscription) {
        const periodEnd = invoice.lines?.data?.[0]?.period?.end;
        await prisma.stripeSubscription.update({
          where: { id: subscription.id },
          data: {
            status: 'ACTIVE',
            lastChargeDate: new Date(),
            nextChargeDate: periodEnd ? new Date(periodEnd * 1000) : null,
          },
        });

        logger.info('[STRIPE WEBHOOK] Fatura paga', { subscriptionId: subscription.id });
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      const customerId = invoice.customer;

      const subscription = await prisma.stripeSubscription.findFirst({
        where: { stripeCustomerId: customerId },
      });

      if (subscription) {
        await prisma.stripeSubscription.update({
          where: { id: subscription.id },
          data: { status: 'PAST_DUE' },
        });

        await prisma.user.update({
          where: { id: subscription.userId },
          data: { isActive: false },
        });

        logger.warn('[STRIPE WEBHOOK] Pagamento falhou', { subscriptionId: subscription.id });
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const stripeSubscription = event.data.object;
      const customerId = stripeSubscription.customer;

      const subscription = await prisma.stripeSubscription.findFirst({
        where: { stripeCustomerId: customerId },
      });

      if (subscription) {
        await prisma.stripeSubscription.update({
          where: { id: subscription.id },
          data: { status: 'CANCELLED' },
        });

        await prisma.user.update({
          where: { id: subscription.userId },
          data: { isActive: false },
        });

        logger.info('[STRIPE WEBHOOK] Assinatura cancelada', { subscriptionId: subscription.id });
      }
      break;
    }

    default:
      logger.debug('[STRIPE WEBHOOK] Evento nao tratado', { type: event.type });
  }

  return res.json({ received: true });
}

/**
 * GET /api/payments/status
 * Verifica status da assinatura do usuario
 */
async function getSubscriptionStatus(req, res) {
  const subscription = await prisma.stripeSubscription.findUnique({
    where: { userId: req.user.id },
  });

  return res.json({
    subscription: subscription || { status: 'INACTIVE' },
  });
}

/**
 * POST /api/payments/cancel
 * Cancela sua assinatura (ao fim do periodo atual)
 */
async function cancelSubscription(req, res) {
  if (!stripe) {
    return res.status(501).json({ message: 'Stripe nao configurado' });
  }

  const subscription = await prisma.stripeSubscription.findUnique({
    where: { userId: req.user.id },
  });

  if (!subscription || !subscription.stripeSubscriptionId) {
    return res.status(400).json({ message: 'Assinatura nao encontrada' });
  }

  if (subscription.status !== 'ACTIVE') {
    return res.status(400).json({ message: 'Assinatura nao esta ativa' });
  }

  try {
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    await prisma.stripeSubscription.update({
      where: { userId: req.user.id },
      data: { status: 'CANCELLED' },
    });

    logger.info('[PAYMENT] Assinatura cancelada ao fim do periodo', { userId: req.user.id });

    return res.json({ message: 'Assinatura sera cancelada no fim do periodo' });
  } catch (error) {
    logger.error('[PAYMENT] Erro ao cancelar assinatura', { error: error.message });
    return res.status(500).json({ message: 'Erro ao cancelar assinatura', error: error.message });
  }
}

module.exports = {
  subscribe,
  webhook,
  getSubscriptionStatus,
  cancelSubscription,
};
