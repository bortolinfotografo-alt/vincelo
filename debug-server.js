// Script para debugar o servidor
require('dotenv').config();

console.log('Environment variables:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT || '3001');
console.log('GOOGLE_CLIENT_ID exists:', !!process.env.GOOGLE_CLIENT_ID);
console.log('GOOGLE_CLIENT_SECRET exists:', !!process.env.GOOGLE_CLIENT_SECRET);

// Carregar módulos
const express = require('express');
const { prisma } = require('./backend/src/services/db');

async function testServer() {
  try {
    console.log('\nTentando conectar ao banco...');
    await prisma.$connect();
    console.log('✅ Conexão com banco estabelecida');

    // Testar o passport
    let passport;
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
      passport = require('./backend/src/config/passport.config');
      console.log('✅ Passport com Google OAuth carregado');
    } else {
      passport = require('passport');
      console.log('✅ Passport básico carregado (Google OAuth desativado)');
    }

    const app = express();
    const PORT = process.env.PORT || 3001;

    // Middlewares básicos
    app.use(require('helmet')());
    app.use(require('compression')());
    app.use(require('cookie-parser')());
    app.use(express.json({ limit: '10mb' }));

    // Inicializa o Passport
    app.use(passport.initialize());

    // Rota de teste
    app.get('/health', async (req, res) => {
      try {
        await prisma.$queryRaw`SELECT 1`;
        res.json({ status: 'OK', db: 'connected' });
      } catch (error) {
        res.status(503).json({ status: 'ERROR', db: 'disconnected' });
      }
    });

    // Tentar iniciar o servidor
    const server = app.listen(PORT, () => {
      console.log(`\n🚀 Servidor iniciado com sucesso na porta ${PORT}`);
      console.log(`🔗 Teste: http://localhost:${PORT}/health`);

      // Fechar após 5 segundos para não manter o processo
      setTimeout(() => {
        console.log('\n✅ Teste concluído com sucesso!');
        server.close();
      }, 5000);
    });

    server.on('error', (err) => {
      console.error('\n❌ Erro ao iniciar servidor:', err.message);
    });

  } catch (error) {
    console.error('\n❌ Erro durante o teste:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testServer();