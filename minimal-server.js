// Servidor mínimo para testar a funcionalidade
require('dotenv').config();
require('express-async-errors');

const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const logger = require('./backend/src/utils/logger');

// Configuração do Passport (condicional)
let passport;
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport = require('./backend/src/config/passport.config');
} else {
  // Criar um mock do passport se não tiver credenciais do Google
  passport = { initialize: () => (req, res, next) => next(), use: () => {} };
  console.log('⚠️ Google OAuth desativado (variáveis de ambiente não definidas)');
}

const { prisma } = require('./backend/src/services/db');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares básicos
app.use(helmet());
app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));

// Inicializa o Passport
app.use(passport.initialize());

// Rota de health check
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      db: 'connected',
    });
  } catch (error) {
    res.status(503).json({
      status: 'DEGRADED',
      timestamp: new Date().toISOString(),
      db: 'disconnected',
    });
  }
});

// Rota principal
app.get('/', (req, res) => {
  res.json({
    message: 'Vincelo API - Servidor Mínimo',
    version: '1.0.0',
    health: '/health',
  });
});

// Middleware de erro
app.use((err, req, res, next) => {
  logger.error('[SERVER ERROR]', { message: err.message, path: req.path });
  res.status(500).json({
    message: 'Erro interno do servidor',
  });
});

async function start() {
  try {
    await prisma.$connect();
    console.log('✅ Banco de dados conectado');

    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
      console.log(`🔧 Ambiente: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    });

  } catch (error) {
    console.error('❌ Erro ao iniciar o servidor:', error.message);
    process.exit(1);
  }
}

start();