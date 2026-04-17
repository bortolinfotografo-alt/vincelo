// Script para testar a API de login diretamente
const axios = require('axios');

async function testApiLogin() {
  try {
    const response = await axios.post('http://localhost:4001/api/auth/login', {
      email: 'bortolinfotografo@gmail.com',
      password: 'senha123'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Login bem-sucedido!');
    console.log('Resposta do servidor:', response.data);

  } catch (error) {
    console.error('❌ Erro no login:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      console.error('Headers:', error.response.headers);
    } else if (error.request) {
      console.error('Erro de requisição:', error.request);
    } else {
      console.error('Erro:', error.message);
    }
  }
}

testApiLogin();