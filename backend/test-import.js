// Teste simples para verificar se o servidor pode ser importado
require('dotenv').config();

console.log('Variáveis de ambiente carregadas');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT || 3001);

try {
  console.log('Tentando importar o Prisma...');
  const { prisma } = require('./src/services/db');
  console.log('Prisma importado com sucesso');
} catch (error) {
  console.error('Erro ao importar Prisma:', error.message);
  process.exit(1);
}

try {
  console.log('Tentando importar o Passport config...');
  const passport = require('./src/config/passport.config');
  console.log('Passport config importado com sucesso');
} catch (error) {
  console.error('Erro ao importar Passport config:', error.message);
  // Não sai do processo aqui porque pode ser esperado se as variáveis do Google não estiverem definidas
}

console.log('Todos os imports básicos funcionaram!');