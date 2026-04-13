const { spawn } = require('child_process');

console.log('Tentando iniciar o servidor com captura de erro...');

const serverProcess = spawn('node', ['src/server.js'], {
  cwd: __dirname,
  stdio: 'pipe',
  env: { ...process.env }
});

serverProcess.stdout.on('data', (data) => {
  console.log(`STDOUT: ${data}`);
});

serverProcess.stderr.on('data', (data) => {
  console.error(`STDERR: ${data}`);
});

serverProcess.on('close', (code) => {
  console.log(`Processo fechado com código: ${code}`);
});