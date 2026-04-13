const fs = require('fs');
const path = require('path');

console.log('=== DEBUGGING SERVER STARTUP ===');
console.log('Working directory:', process.cwd());

// Verificar se o arquivo .env existe
const envPath = path.join(__dirname, '.env');
console.log('.env file exists:', fs.existsSync(envPath));

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  console.log('DATABASE_URL present:', envContent.includes('DATABASE_URL'));
  console.log('GOOGLE_CLIENT_ID present:', envContent.includes('GOOGLE_CLIENT_ID'));
  console.log('GOOGLE_CLIENT_SECRET present:', envContent.includes('GOOGLE_CLIENT_SECRET'));
}

// Verificar se os arquivos principais existem
const serverPath = path.join(__dirname, 'src', 'server.js');
const passportConfigPath = path.join(__dirname, 'src', 'config', 'passport.config.js');
const dbServicePath = path.join(__dirname, 'src', 'services', 'db.js');

console.log('server.js exists:', fs.existsSync(serverPath));
console.log('passport.config.js exists:', fs.existsSync(passportConfigPath));
console.log('db.js exists:', fs.existsSync(dbServicePath));

// Testar importação do dotenv
try {
  require('dotenv').config();
  console.log('✅ Dotenv loaded successfully');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('PORT:', process.env.PORT);
  console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
} catch (error) {
  console.error('❌ Error loading dotenv:', error.message);
}

// Testar importação do prisma
try {
  const { prisma } = require('./src/services/db');
  console.log('✅ Prisma service loaded successfully');
} catch (error) {
  console.error('❌ Error loading prisma:', error.message);
}

// Testar importação do passport config
try {
  const passport = require('./src/config/passport.config');
  console.log('✅ Passport config loaded successfully');
} catch (error) {
  console.error('❌ Error loading passport config:', error.message);
}

console.log('=== DEBUGGING COMPLETED ===');