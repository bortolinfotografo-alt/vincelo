// Script para testar o login com a senha definida
require('dotenv').config();
const { prisma } = require('./src/services/db');
const { comparePassword } = require('./src/services/auth.service');

async function testLogin() {
  try {
    await prisma.$connect();

    const userEmail = 'bortolinfotografo@gmail.com';
    const testPassword = 'senha123';

    // Buscar o usuário e sua senha hash
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: {
        id: true,
        name: true,
        email: true,
        password: true
      }
    });

    if (user) {
      console.log('Usuário encontrado:', user.name);

      // Testar se a senha fornecida corresponde ao hash
      const isValid = await comparePassword(testPassword, user.password);
      console.log('Senha válida para login:', isValid);

      if (!isValid) {
        console.log('A senha fornecida não corresponde ao hash no banco de dados');

        // Vamos tentar verificar se temos caracteres especiais ou espaços
        console.log('Senha testada:', `"${testPassword}"`);
        console.log('Tamanho da senha testada:', testPassword.length);
      }
    } else {
      console.log('Usuário não encontrado');
    }

  } catch (error) {
    console.error('Erro ao testar login:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();