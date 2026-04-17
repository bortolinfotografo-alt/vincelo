// Teste de login usando o módulo HTTP nativo do Node.js
const http = require('http');
const querystring = require('querystring');

const postData = JSON.stringify({
  email: 'bortolinfotografo@gmail.com',
  password: 'senha123'
});

const options = {
  hostname: 'localhost',
  port: 4001,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers: ${JSON.stringify(res.headers)}`);
    console.log(`Resposta: ${data}`);
  });
});

req.on('error', (error) => {
  console.error('Erro na requisição:', error.message);
});

req.write(postData);
req.end();