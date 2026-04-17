// Script para atualizar a senha de forma simples
require('dotenv').config();
const { prisma } = require('./src/services/db');
const bcrypt = require('bcryptjs');

async function updatePassword() {
  try {
    await prisma.$connect();

    const userEmail = 'bortolinfotografo@gmail.com';
    const newPassword = 'senha123';

    // Criar hash da senha
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Atualizar a senha
    await prisma.user.update({
      where: { email: userEmail },
      data: { password: hashedPassword }
    });

    console.log('✅ Senha atualizada com sucesso para o usuário:', userEmail);
    console.log('🔑 Nova senha: senha123');
    console.log('💡 Lembre-se de alterar esta senha temporária após o primeiro login');

  } catch (error) {
    console.error('Erro ao atualizar senha:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

updatePassword();