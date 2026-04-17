// Script temporário para verificar se o servidor backend está funcionando
require('dotenv').config();

const express = require('express');
const { prisma } = require('./src/services/db');
const { comparePassword } = require('./src/services/auth.service');

const app = express();
const PORT = process.env.PORT || 4001;

app.use(express.json());

app.post('/api/auth/test-login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email e senha são obrigatórios' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { id: true, name: true, email: true, password: true }
    });

    if (!user) {
      return res.status(401).json({ message: 'Email ou senha inválidos' });
    }

    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Email ou senha inválidos' });
    }

    res.json({
      message: 'Login bem-sucedido',
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor de teste rodando na porta ${PORT}`);
  console.log(`Teste de login disponível em: http://localhost:${PORT}/api/auth/test-login`);
});