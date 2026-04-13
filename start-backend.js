// Script para iniciar o servidor backend com tratamento de erros
const { spawn } = require('child_process');
const path = require('path');

console.log('Iniciando o servidor backend...');

const serverPath = path.join(__dirname, 'backend', 'src', 'server.js');
const serverProcess = spawn('node', [serverPath], {
  cwd: path.join(__dirname, 'backend'),
  stdio: 'inherit'
});

serverProcess.on('error', (err) => {
  console.error('Erro ao iniciar o servidor:', err.message);
});

serverProcess.on('close', (code) => {
  console.log(`Servidor fechado com código: ${code}`);
});