// Script temporário para verificar se o usuário existe
const { prisma } = require('./backend/src/services/db');

async function checkUser() {
  try {
    await prisma.$connect();

    const userEmail = 'bortolinfotografo@gmail.com';
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: {
        freelancer: true,
        company: true,
      }
    });

    if (user) {
      console.log('Usuário encontrado:');
      console.log('- ID:', user.id);
      console.log('- Nome:', user.name);
      console.log('- Email:', user.email);
      console.log('- Ativo:', user.isActive);
      console.log('- Role:', user.role);
      console.log('- Data de criação:', user.createdAt);
      console.log('- Tem perfil freelancer?', !!user.freelancer);
      console.log('- Tem perfil empresa?', !!user.company);
    } else {
      console.log('Usuário NÃO encontrado no banco de dados');
    }
  } catch (error) {
    console.error('Erro ao verificar usuário:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();