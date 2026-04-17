require('dotenv').config();
const axios = require('axios');

async function testDirectLogin() {
  try {
    console.log('Testando login diretamente no backend...');

    const response = await axios.post('http://localhost:4001/api/auth/login', {
      email: 'bortolinfotografo@gmail.com',
      password: 'senha123'
    }, {
      withCredentials: true  // Importante para testar cookies
    });

    console.log('Login bem-sucedido!');
    console.log('Resposta:', response.data);

  } catch (error) {
    console.log('Erro no login:', error.response?.data || error.message);
  }
}

testDirectLogin();