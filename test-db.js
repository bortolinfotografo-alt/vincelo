// Script para testar a conexão com o banco de dados
const { prisma } = require('./backend/src/services/db');

async function testConnection() {
  try {
    console.log('Tentando conectar ao banco de dados...');

    // Testar a conexão
    await prisma.$connect();
    console.log('✅ Conexão bem-sucedida com o banco de dados!');

    // Testar uma consulta simples
    const userCount = await prisma.user.count();
    console.log(`📊 Total de usuários no banco: ${userCount}`);

    // Buscar o usuário específico
    const user = await prisma.user.findUnique({
      where: { email: 'bortolinfotografo@gmail.com' },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        createdAt: true
      }
    });

    if (user) {
      console.log('👤 Usuário encontrado:', user);
    } else {
      console.log('👤 Usuário NÃO encontrado');
    }

  } catch (error) {
    console.error('❌ Erro na conexão com o banco de dados:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();