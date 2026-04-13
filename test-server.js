// Script para testar o servidor
const { prisma } = require('./backend/src/services/db');

async function test() {
  try {
    console.log('Tentando conectar ao banco...');
    await prisma.$connect();
    console.log('✅ Banco de dados conectado');

    // Testar se o usuário existe e a senha está correta
    const user = await prisma.user.findUnique({
      where: { email: 'bortolinfotografo@gmail.com' },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        isActive: true
      }
    });

    if (user) {
      console.log('✅ Usuário encontrado:', user.name);

      // Testar a comparação de senha
      const { comparePassword } = require('./backend/src/services/auth.service');
      const isValid = await comparePassword('senha123', user.password);
      console.log('✅ Senha válida para login temporário:', isValid);
    } else {
      console.log('❌ Usuário não encontrado');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();