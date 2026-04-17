// Teste simples de hash de senha
const bcrypt = require('bcryptjs');

async function testHash() {
  const plainPassword = 'senha123';
  const hashedPassword = '$2b$10$9vPq4OEooHnqH/hYB8z57.1Y0XqYlXp3YJyFVXc6k9o5r8J8zvQdO'; // hash exemplo

  console.log('Senha original:', plainPassword);
  console.log('Senha hash exemplo:', hashedPassword);

  try {
    const isValid = await bcrypt.compare(plainPassword, hashedPassword);
    console.log('Comparação válida?', isValid);
  } catch (error) {
    console.log('Erro na comparação:', error.message);
  }

  // Testar criação de hash
  const newHash = await bcrypt.hash(plainPassword, 10);
  console.log('Novo hash criado:', newHash);

  const isValidNew = await bcrypt.compare(plainPassword, newHash);
  console.log('Nova comparação válida?', isValidNew);
}

testHash().catch(console.error);