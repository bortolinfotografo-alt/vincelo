// Script para iniciar o servidor backend com tratamento completo de erros
require('dotenv').config();

console.log('Iniciando servidor com tratamento de erros...');

try {
  // Validar variáveis de ambiente críticas
  const required = ['DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error('❌ Variáveis de ambiente obrigatórias ausentes:', missing);
    process.exit(1);
  }

  console.log('✅ Variáveis de ambiente OK');

  // Importar dependências
  const express = require('express');
  const { prisma } = require('./src/services/db');

  console.log('✅ Dependências importadas');

  // Testar conexão com o banco de dados
  async function testConnection() {
    try {
      await prisma.$connect();
      console.log('✅ Conexão com banco de dados estabelecida');

      // Testar uma consulta simples
      const userCount = await prisma.user.count();
      console.log(`📊 Total de usuários: ${userCount}`);

      await prisma.$disconnect();
      console.log('✅ Banco desconectado com sucesso');
    } catch (error) {
      console.error('❌ Erro na conexão com banco de dados:', error.message);
      throw error;
    }
  }

  testConnection()
    .then(() => {
      console.log('✅ Teste de banco de dados concluído com sucesso!');
    })
    .catch((error) => {
      console.error('❌ Falha no teste de banco de dados:', error.message);
    });

} catch (error) {
  console.error('❌ Erro ao iniciar servidor:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}