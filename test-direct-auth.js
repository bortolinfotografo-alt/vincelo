// Script para testar o controller de autenticação diretamente
require('dotenv').config();
const { prisma } = require('./backend/src/services/db');
const { comparePassword } = require('./backend/src/services/auth.service');

async function testDirectLogin() {
  try {
    await prisma.$connect();

    const email = 'bortolinfotografo@gmail.com';
    const password = 'senha123';

    // Buscar o usuário
    const user = await prisma.user.findUnique({
      where: { email: email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        isActive: true
      }
    });

    if (!user) {
      console.log('❌ Usuário não encontrado');
      return;
    }

    console.log('✅ Usuário encontrado:', user.name);

    // Comparar a senha
    const isValid = await comparePassword(password, user.password);

    if (isValid) {
      console.log('✅ Senha válida - login deve funcionar');

      // Retornar informações básicas para debug
      console.log('Informações do usuário:');
      console.log('- ID:', user.id);
      console.log('- Nome:', user.name);
      console.log('- Email:', user.email);
      console.log('- Ativo:', user.isActive);
    } else {
      console.log('❌ Senha inválida');
      console.log('Senha fornecida:', password);
      console.log('Senha no banco:', user.password.substring(0, 20) + '...'); // Mostrar apenas parte do hash
    }

  } catch (error) {
    console.error('❌ Erro ao testar login:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testDirectLogin();