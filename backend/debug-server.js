// Script para iniciar o servidor backend com mais informações de debug
require('dotenv').config();
console.log('Carregando variáveis de ambiente...');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT || 3001);

try {
  console.log('Tentando importar módulos...');
  const express = require('express');
  const { prisma } = require('./src/services/db');
  const path = require('path');

  console.log('Módulos carregados com sucesso');

  // Testar conexão com o banco
  async function testConnection() {
    console.log('Testando conexão com o banco de dados...');
    try {
      await prisma.$connect();
      console.log('Conexão com o banco bem-sucedida!');

      // Testar se encontramos o usuário
      const user = await prisma.user.findUnique({
        where: { email: 'bortolinfotografo@gmail.com' },
        select: { id: true, name: true, email: true }
      });

      if (user) {
        console.log('Usuário encontrado no banco:', user);
      } else {
        console.log('Usuário NÃO encontrado no banco');
      }

      await prisma.$disconnect();
    } catch (connectionError) {
      console.error('Erro na conexão com o banco:', connectionError.message);
    }
  }

  testConnection();
} catch (error) {
  console.error('Erro ao carregar o servidor:', error.message);
  console.error('Stack:', error.stack);
}