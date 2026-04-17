// Script temporário para redefinir a senha do usuário
const { prisma } = require('./src/services/db');
const { hashPassword } = require('./src/services/auth.service');

async function resetPassword() {
  try {
    await prisma.$connect();

    const userEmail = 'bortolinfotografo@gmail.com';
    const newPassword = 'senha123'; // Senha temporária

    // Hash da nova senha
    const hashedPassword = await hashPassword(newPassword);

    // Atualizar a senha do usuário
    const updatedUser = await prisma.user.update({
      where: { email: userEmail },
      data: {
        password: hashedPassword,
        resetToken: null, // Limpar qualquer token de reset pendente
        resetExpires: null
      }
    });

    console.log('Senha redefinida com sucesso!');
    console.log('Novos dados do usuário:');
    console.log('- ID:', updatedUser.id);
    console.log('- Nome:', updatedUser.name);
    console.log('- Email:', updatedUser.email);
    console.log('- Nova senha definida:', true);
    console.log('');
    console.log('⚠️  Informações de login temporárias:');
    console.log('📧 Email: bortolinfotografo@gmail.com');
    console.log('🔑 Senha: senha123');
    console.log('');
    console.log('💡 Recomendamos alterar a senha imediatamente após o login');

  } catch (error) {
    console.error('Erro ao redefinir senha:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

resetPassword();