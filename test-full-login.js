// Script para testar o login com todas as configurações
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const axios = require('axios');

// Criar um servidor temporário para testar a requisição como o frontend faria
const app = express();

// Middleware para permitir CORS de localhost:3001
app.use(cors({
  origin: ['http://localhost:3001'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Rota de teste que faz a requisição para o backend
app.post('/test-login', async (req, res) => {
  try {
    const response = await axios.post('http://localhost:4001/api/auth/login', {
      email: 'bortolinfotografo@gmail.com',
      password: 'senha123'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3001'
      }
    });

    res.json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json({
        message: error.response.data,
        status: error.response.status
      });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Servidor de teste rodando em http://localhost:${PORT}`);
  console.log(`Teste de login: POST http://localhost:${PORT}/test-login`);
});