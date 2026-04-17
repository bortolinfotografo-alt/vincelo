// Teste rápido para verificar se o login está funcionando
require('dotenv').config();

const express = require('express');
const cors = require('./src/middlewares/cors.middleware');
const cookieParser = require('cookie-parser');
const authRoutes = require('./src/routes/auth.routes');
const { authLimiter, generalLimiter, strictLimiter } = require('./src/middlewares/rate-limit.middleware');
const logger = require('./src/utils/logger');

const app = express();

// Middlewares
app.use(cors());
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));

// Rate limiting para autenticação
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', strictLimiter);
app.use('/api/auth/reset-password', strictLimiter);

// Rotas
app.use('/api/auth', authRoutes);

// Rota de teste
app.get('/', (req, res) => {
  res.json({ message: 'Servidor de teste funcionando', status: 'ok' });
});

const PORT = 4002; // Usar uma porta diferente para teste
app.listen(PORT, () => {
  console.log(`Servidor de teste rodando na porta ${PORT}`);
  console.log(`Teste de login: POST http://localhost:${PORT}/api/auth/login`);
});