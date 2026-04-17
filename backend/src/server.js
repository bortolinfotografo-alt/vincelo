// ============================================================
// SERVER ENTRY POINT
// Configura o Express, conecta ao banco, inicia servidor
// ============================================================

require('dotenv').config();
require('express-async-errors');

const express = require('express');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const cron = require('node-cron');
const logger = require('./utils/logger');

// Configuração do Passport
require('./config/passport.config');

// ============================================================
// VALIDACAO DE VARIAVEIS DE AMBIENTE CRITICAS
// Falha rapido se variaveis obrigatorias estiverem ausentes
// ============================================================

function validateEnv() {
  const required = ['DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    logger.error('[ENV] Variaveis de ambiente obrigatorias ausentes', { missing });
    process.exit(1);
  }

  // Avisos para variaveis opcionais importantes
  if (!process.env.STRIPE_SECRET_KEY) {
    logger.warn('[ENV] STRIPE_SECRET_KEY nao definida - pagamentos desabilitados');
  }

  if (!process.env.MAIL_HOST) {
    logger.warn('[ENV] MAIL_HOST nao definido - emails de reset serao logados no console (modo dev)');
  }

  if (process.env.JWT_SECRET === 'your-super-secret-key-change-in-production') {
    logger.warn('[ENV] JWT_SECRET com valor padrao inseguro! Altere em producao.');
  }
}

validateEnv();

// ============================================================
// IMPORTACOES
// ============================================================

const { prisma } = require('./services/db');
const { corsConfig } = require('./middlewares/cors.middleware');
const { authLimiter, generalLimiter, strictLimiter } = require('./middlewares/rate-limit.middleware');
const { rawBodyMiddleware } = require('./middlewares/rawbody.middleware');
const { sanitizeBody } = require('./middlewares/sanitize.middleware');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const jobRoutes = require('./routes/job.routes');
const proposalRoutes = require('./routes/proposal.routes');
const chatRoutes = require('./routes/chat.routes');
const reviewRoutes = require('./routes/review.routes');
const portfolioRoutes = require('./routes/portfolio.routes');
const scheduleRoutes = require('./routes/schedule.routes');
const paymentRoutes = require('./routes/payment.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const postRoutes = require('./routes/post.routes');
const storyRoutes = require('./routes/story.routes');
const followRoutes = require('./routes/follow.routes');
const notificationRoutes = require('./routes/notification.routes');
const googleAuthRoutes = require('./routes/google-auth.routes');
const adminRoutes = require('./routes/admin.routes');
const { cleanExpiredStories } = require('./controllers/story.controller');

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================================
// MIDDLEWARES GLOBAIS
// ============================================================

// Segurança: headers HTTP com helmet
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // permite servir uploads
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'none'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  strictTransportSecurity: {
    maxAge: 31536000, // 1 ano
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: { policy: 'no-referrer' },
}));

// Compressão gzip de respostas
app.use(compression());

// CORS com configuracao dedicada (dev vs prod)
app.use(corsConfig());

// Cookie parser para httpOnly cookies (refresh token)
app.use(cookieParser());

// Rate limiting geral para todas as rotas da API
app.use('/api', generalLimiter);

// Raw body para webhook do Stripe (deve vir ANTES do express.json)
app.use('/api/payments/webhook', rawBodyMiddleware);

// Parsing JSON e formularios
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Sanitização de inputs HTML (previne XSS armazenado)
// Deve vir APÓS parsing e ANTES das rotas
app.use(sanitizeBody);

// Inicializa o Passport
app.use(passport.initialize());

// Serve uploads locais em modo desenvolvimento
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// HTTP request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.http(`${req.method} ${req.path}`, {
      status: res.statusCode,
      duration: `${Date.now() - start}ms`,
      ip: req.ip,
    });
  });
  next();
});

// ============================================================
// ROTAS
// ============================================================

// Rate limiting estrito para autenticacao (brute force)
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', strictLimiter);
app.use('/api/auth/reset-password', strictLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/follow', followRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/google-auth', googleAuthRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      db: 'connected',
    });
  } catch {
    return res.status(503).json({
      status: 'DEGRADED',
      timestamp: new Date().toISOString(),
      db: 'disconnected',
    });
  }
});

app.get('/', (req, res) => {
  res.json({
    message: 'Vincelo API',
    version: '1.0.0',
    health: '/health',
  });
});

// ============================================================
// MIDDLEWARE DE ERRO GLOBAL
// ============================================================

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  logger.error('[SERVER ERROR]', { message: err.message, stack: err.stack, path: req.path });

  if (err.name === 'ZodError') {
    return res.status(400).json({
      message: 'Dados invalidos',
      errors: err.errors,
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: 'Token invalido' });
  }

  if (err.code === 'P2002') {
    return res.status(409).json({
      message: 'Registro duplicado',
      field: err.meta?.target?.[0],
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({ message: 'Registro nao encontrado' });
  }

  // Erro de upload (multer)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'Arquivo muito grande. Tamanho maximo: 50MB' });
  }

  return res.status(500).json({
    message: 'Erro interno do servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// ============================================================
// INICIA SERVIDOR
// ============================================================

async function start() {
  try {
    await prisma.$connect();
    logger.info('[DB] Conectado ao PostgreSQL com sucesso');

    app.listen(PORT, () => {
      logger.info(`[SERVER] Servidor rodando na porta ${PORT}`, {
        env: process.env.NODE_ENV || 'development',
        port: PORT,
      });
    });

    // Cron: limpa stories expirados toda hora (persiste entre deploys)
    cron.schedule('0 * * * *', async () => {
      try {
        await cleanExpiredStories();
        logger.info('[CRON] Stories expirados limpos com sucesso');
      } catch (err) {
        logger.error('[CRON] Erro ao limpar stories expirados', { error: err.message });
      }
    });

  } catch (error) {
    logger.error('[DB] Falha ao conectar ao banco', { error: error.message });
    process.exit(1);
  }
}

start();

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  logger.info('[DB] Conexao com banco encerrada');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  logger.info('[DB] Conexao com banco encerrada (SIGTERM)');
  process.exit(0);
});

module.exports = app;
