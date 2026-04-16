// ============================================================
// SCRIPT: Apagar todas as contas de usuários
// Uso: node backend/scripts/reset-users.js
//      node backend/scripts/reset-users.js --confirm
//
// Sem --confirm: apenas lista o que seria apagado (modo dry-run)
// Com --confirm: executa a limpeza
// ============================================================

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const isDryRun = !process.argv.includes('--confirm');

async function main() {
  console.log(isDryRun
    ? '\n[DRY-RUN] Nenhuma alteração será feita. Use --confirm para executar.\n'
    : '\n[EXECUÇÃO] Apagando todos os usuários...\n'
  );

  // Contagens antes de apagar
  const counts = await Promise.all([
    prisma.user.count(),
    prisma.post.count(),
    prisma.story.count(),
    prisma.follow.count(),
    prisma.notification.count(),
    prisma.chatMessage.count(),
  ]);

  console.log('Dados que serão apagados:');
  console.log(`  Usuários:       ${counts[0]}`);
  console.log(`  Posts:          ${counts[1]}`);
  console.log(`  Stories:        ${counts[2]}`);
  console.log(`  Follows:        ${counts[3]}`);
  console.log(`  Notificações:   ${counts[4]}`);
  console.log(`  Mensagens:      ${counts[5]}`);
  console.log('');

  if (isDryRun) {
    console.log('Execute com --confirm para apagar os dados acima.');
    return;
  }

  // Deleta em ordem de dependência (cascata não é garantida em todos os DBs)
  await prisma.notification.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.storyView.deleteMany();
  await prisma.storyLike.deleteMany();
  await prisma.story.deleteMany();
  await prisma.postComment.deleteMany();
  await prisma.postLike.deleteMany();
  await prisma.savedPost.deleteMany();
  await prisma.postMedia.deleteMany();
  await prisma.post.deleteMany();
  await prisma.review.deleteMany();
  await prisma.proposal.deleteMany();
  await prisma.stripeSubscription.deleteMany();
  await prisma.freelancerProfile.deleteMany();
  await prisma.companyProfile.deleteMany();
  await prisma.user.deleteMany();

  console.log('✓ Todos os usuários e dados relacionados foram apagados.');
  console.log('  Os e-mails estão livres para novos cadastros.');
}

main()
  .catch((e) => { console.error('Erro:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
