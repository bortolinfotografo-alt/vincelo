// Script para verificar se o usuário existe
require('dotenv').config();
const { prisma } = require('./src/services/db');

async function checkUser() {
  try {
    await prisma.$connect();

    const userEmail = 'bortolinfotografo@gmail.com';

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        createdAt: true
      }
    });

    if (user) {
      console.log('Usuário encontrado:');
      console.log('- ID:', user.id);
      console.log('- Nome:', user.name);
      console.log('- Email:', user.email);
      console.log('- Ativo:', user.isActive);
      console.log('- Criado em:', user.createdAt);
    } else {
      console.log('Usuário não encontrado no banco de dados');
    }

  } catch (error) {
    console.error('Erro ao buscar usuário:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();