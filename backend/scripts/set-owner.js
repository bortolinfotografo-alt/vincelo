/**
 * Script one-shot: define adminRole = OWNER para o email informado.
 * Uso: node backend/scripts/set-owner.js
 */
const { prisma } = require('../src/services/db');

const TARGET_EMAIL = 'bortolinfotografo@gmail.com';

async function main() {
  const user = await prisma.user.findUnique({ where: { email: TARGET_EMAIL } });
  if (!user) {
    console.error(`[OWNER] Usuário não encontrado: ${TARGET_EMAIL}`);
    process.exit(1);
  }

  if (user.adminRole === 'OWNER') {
    console.log(`[OWNER] ${TARGET_EMAIL} já é OWNER. Nada a fazer.`);
    return;
  }

  await prisma.user.update({
    where: { email: TARGET_EMAIL },
    data: { adminRole: 'OWNER' },
  });

  console.log(`[OWNER] ✅ ${TARGET_EMAIL} agora é OWNER.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());