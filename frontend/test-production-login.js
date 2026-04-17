// Script para testar o login diretamente no backend de produção
const axios = require('axios');

async function testProductionLogin() {
  try {
    console.log('Testando login no backend de produção...');

    const response = await axios.post('https://vincelo-production.up.railway.app/api/auth/login', {
      email: 'bortolinfotografo@gmail.com',
      password: 'senha123'
    }, {
      withCredentials: true
    });

    console.log('Login bem-sucedido no backend de produção!');
    console.log('Resposta:', response.data);

  } catch (error) {
    console.log('Erro no login no backend de produção:', error.response?.data || error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Headers:', error.response.headers);
    }
  }
}

testProductionLogin();