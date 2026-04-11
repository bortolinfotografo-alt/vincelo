// ============================================================
// PRISMA CLIENT
// Singleton do PrismaClient para reutilizar conexao
// ============================================================

const { PrismaClient } = require('@prisma/client');

// Evita multiplas instancias do Prisma em hot-reload (dev)
const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'error', 'warn']
    : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

module.exports = { prisma };
