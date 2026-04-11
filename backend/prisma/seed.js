// ============================================================
// SEED - Dados de exemplo para desenvolvimento
// Execute com: npm run db:seed
// ============================================================

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('[SEED] Iniciando seed de dados...');

  // ============================================================
  // LIMPA DADOS EXISTENTES (ordem correta por FK)
  // ============================================================
  await prisma.storyView.deleteMany();
  await prisma.story.deleteMany();
  await prisma.postComment.deleteMany();
  await prisma.postLike.deleteMany();
  await prisma.savedPost.deleteMany();
  await prisma.post.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.review.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.proposal.deleteMany();
  await prisma.portfolioItem.deleteMany();
  await prisma.unavailableDate.deleteMany();
  await prisma.stripeSubscription.deleteMany();
  await prisma.job.deleteMany();
  await prisma.freelancerProfile.deleteMany();
  await prisma.companyProfile.deleteMany();
  await prisma.user.deleteMany();

  console.log('[SEED] Dados anteriores removidos');

  const hash = await bcrypt.hash('senha123', 12);

  // ============================================================
  // EMPRESAS
  // ============================================================
  const empresa1 = await prisma.user.create({
    data: {
      name: 'Studio Criativo Ltda',
      email: 'empresa@teste.com',
      password: hash,
      role: 'COMPANY',
      isActive: true,
      isVerified: true,
      description: 'Agencia de marketing especializada em conteudo visual',
      company: {
        create: {
          companyName: 'Studio Criativo',
          companyWebsite: 'https://studiocriativo.com.br',
          companySize: '11-50',
          segment: 'Marketing Digital',
        },
      },
    },
    include: { company: true },
  });

  const empresa2 = await prisma.user.create({
    data: {
      name: 'Eventos Premium',
      email: 'eventos@teste.com',
      password: hash,
      role: 'COMPANY',
      isActive: true,
      description: 'Empresa especializada em eventos corporativos e sociais',
      company: {
        create: {
          companyName: 'Eventos Premium',
          companyWebsite: 'https://eventospremium.com.br',
          companySize: '1-10',
          segment: 'Eventos',
        },
      },
    },
    include: { company: true },
  });

  console.log('[SEED] 2 empresas criadas');

  // ============================================================
  // FREELANCERS
  // ============================================================
  const freelancer1 = await prisma.user.create({
    data: {
      name: 'Carlos Fotografo',
      email: 'freelancer@teste.com',
      password: hash,
      role: 'FREELANCER',
      isActive: true,
      isVerified: true,
      description: 'Fotografo profissional com 8 anos de experiencia em eventos, produtos e moda.',
      phone: '(11) 98765-4321',
      freelancer: {
        create: {
          location: 'Sao Paulo, SP',
          specialties: ['fotografia', 'drone', 'evento'],
          skills: ['Lightroom', 'Photoshop', 'DJI Mini 3 Pro'],
          hourlyRate: 150.00,
          available: true,
        },
      },
    },
    include: { freelancer: true },
  });

  const freelancer2 = await prisma.user.create({
    data: {
      name: 'Ana Videomaker',
      email: 'videomaker@teste.com',
      password: hash,
      role: 'FREELANCER',
      isActive: true,
      description: 'Especialista em video corporativo e social media. Portfolio com +200 projetos entregues.',
      phone: '(11) 91234-5678',
      freelancer: {
        create: {
          location: 'Rio de Janeiro, RJ',
          specialties: ['video', 'edicao', 'drone'],
          skills: ['Premiere Pro', 'After Effects', 'DaVinci Resolve', 'Final Cut'],
          hourlyRate: 120.00,
          available: true,
        },
      },
    },
    include: { freelancer: true },
  });

  const freelancer3 = await prisma.user.create({
    data: {
      name: 'Pedro Designer',
      email: 'designer@teste.com',
      password: hash,
      role: 'FREELANCER',
      isActive: false,
      description: 'Designer grafico e motion designer com foco em identidade visual para marcas.',
      freelancer: {
        create: {
          location: 'Belo Horizonte, MG',
          specialties: ['design', 'edicao'],
          skills: ['Illustrator', 'Photoshop', 'After Effects', 'Figma'],
          hourlyRate: 90.00,
          available: true,
        },
      },
    },
    include: { freelancer: true },
  });

  console.log('[SEED] 3 freelancers criados');

  // ============================================================
  // ASSINATURAS
  // ============================================================
  await prisma.stripeSubscription.createMany({
    data: [
      {
        userId: freelancer1.id,
        stripeCustomerId: 'cus_seed_001',
        stripeSubscriptionId: 'sub_seed_001',
        status: 'ACTIVE',
        lastChargeDate: new Date(),
        nextChargeDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      {
        userId: freelancer2.id,
        stripeCustomerId: 'cus_seed_002',
        stripeSubscriptionId: 'sub_seed_002',
        status: 'ACTIVE',
        lastChargeDate: new Date(),
        nextChargeDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  console.log('[SEED] Assinaturas criadas');

  // ============================================================
  // VAGAS
  // ============================================================
  const d14 = new Date(); d14.setDate(d14.getDate() + 14);
  const d30 = new Date(); d30.setDate(d30.getDate() + 30);
  const d7  = new Date(); d7.setDate(d7.getDate() + 7);

  const job1 = await prisma.job.create({
    data: {
      companyId: empresa1.company.id,
      title: 'Fotografo para lancamento de produto',
      description: 'Cobertura do lancamento de produto de beleza. Fotos do produto, com modelos e registro do evento.',
      serviceType: 'fotografia',
      location: 'Sao Paulo, SP',
      jobDate: d14,
      jobTime: '09:00',
      budget: 2500.00,
      status: 'OPEN',
    },
  });

  const job2 = await prisma.job.create({
    data: {
      companyId: empresa1.company.id,
      title: 'Video institucional para empresa de tecnologia',
      description: 'Producao completa de video institucional de 2-3 minutos com motion graphics.',
      serviceType: 'video',
      location: 'Sao Paulo, SP',
      jobDate: d30,
      jobTime: '08:00',
      budget: 5000.00,
      status: 'OPEN',
    },
  });

  await prisma.job.create({
    data: {
      companyId: empresa2.company.id,
      title: 'Fotografo para casamento civil',
      description: 'Cobertura completa de casamento civil. Cerimonia + festa. 500 fotos editadas.',
      serviceType: 'fotografia',
      location: 'Rio de Janeiro, RJ',
      jobDate: d7,
      jobTime: '15:00',
      budget: 3500.00,
      status: 'OPEN',
    },
  });

  await prisma.job.create({
    data: {
      companyId: empresa2.company.id,
      title: 'Filmagem com drone para construtora',
      description: 'Filmagem aerea profissional de empreendimento imobiliario em construcao. Video 4K editado.',
      serviceType: 'drone',
      location: 'Campinas, SP',
      jobDate: d30,
      jobTime: '07:00',
      budget: 1800.00,
      status: 'OPEN',
    },
  });

  console.log('[SEED] 4 vagas criadas');

  // ============================================================
  // PROPOSTAS
  // ============================================================
  await prisma.proposal.create({
    data: {
      jobId: job1.id,
      freelancerId: freelancer1.freelancer.id,
      coverLetter: 'Tenho ampla experiencia com fotografia de produtos. Portfolio com trabalhos para grandes marcas. Disponivel na data, entrego em 5 dias uteis.',
      proposedBudget: 2300.00,
      status: 'PENDING',
    },
  });

  await prisma.proposal.create({
    data: {
      jobId: job2.id,
      freelancerId: freelancer2.freelancer.id,
      coverLetter: 'Ja produzi mais de 50 videos institucionais. Equipamento profissional, motion graphics e trilha licenciada inclusos.',
      proposedBudget: 4800.00,
      status: 'PENDING',
    },
  });

  console.log('[SEED] Propostas criadas');

  // ============================================================
  // PORTFOLIO
  // ============================================================
  await prisma.portfolioItem.createMany({
    data: [
      { freelancerId: freelancer1.freelancer.id, title: 'Evento Corporativo Tech', mediaType: 'PHOTO', url: 'https://picsum.photos/seed/pf1/800/600', order: 1 },
      { freelancerId: freelancer1.freelancer.id, title: 'Lancamento de Produto', mediaType: 'PHOTO', url: 'https://picsum.photos/seed/pf2/800/600', order: 2 },
      { freelancerId: freelancer1.freelancer.id, title: 'Drone - Vista Aerea SP', mediaType: 'PHOTO', url: 'https://picsum.photos/seed/pf3/800/600', order: 3 },
      { freelancerId: freelancer2.freelancer.id, title: 'Video Institucional Startup', mediaType: 'VIDEO', url: 'https://www.w3schools.com/html/mov_bbb.mp4', order: 1 },
      { freelancerId: freelancer2.freelancer.id, title: 'Reel Social Media 2024', mediaType: 'VIDEO', url: 'https://www.w3schools.com/html/mov_bbb.mp4', order: 2 },
    ],
  });

  console.log('[SEED] Portfolio criado');

  // ============================================================
  // FOLLOWS (rede social)
  // ============================================================
  await prisma.follow.createMany({
    data: [
      { followerId: empresa1.id,   followingId: freelancer1.id },
      { followerId: empresa1.id,   followingId: freelancer2.id },
      { followerId: empresa2.id,   followingId: freelancer1.id },
      { followerId: freelancer1.id, followingId: empresa1.id },
      { followerId: freelancer1.id, followingId: freelancer2.id },
      { followerId: freelancer2.id, followingId: freelancer1.id },
      { followerId: freelancer2.id, followingId: empresa1.id },
      { followerId: freelancer3.id, followingId: freelancer1.id },
    ],
  });

  console.log('[SEED] Follows criados');

  // ============================================================
  // POSTS (rede social)
  // ============================================================
  const post1 = await prisma.post.create({
    data: {
      authorId: freelancer1.id,
      mediaUrl: 'https://picsum.photos/seed/post1/800/800',
      mediaType: 'PHOTO',
      description: 'Mais um dia incrivel fotografando o skyline de Sao Paulo do alto. Drone DJI Mini 3 Pro, golden hour, resultado impecavel. #fotografia #drone #saopaulocity',
    },
  });

  const post2 = await prisma.post.create({
    data: {
      authorId: freelancer1.id,
      mediaUrl: 'https://picsum.photos/seed/post2/800/800',
      mediaType: 'PHOTO',
      description: 'Lancamento de produto para uma marca de cosmeticos. Tres dias de producao, dezenas de looks, resultado que superou todas as expectativas. #fotografiadeproduto #beauty',
    },
  });

  const post3 = await prisma.post.create({
    data: {
      authorId: freelancer2.id,
      mediaUrl: 'https://picsum.photos/seed/post3/800/800',
      mediaType: 'PHOTO',
      description: 'Finalizando o video institucional da semana! Cada projeto e uma historia nova. Se voce precisa de video profissional para sua empresa, manda mensagem. #videomaker #corporativo',
    },
  });

  const post4 = await prisma.post.create({
    data: {
      authorId: empresa1.id,
      mediaUrl: 'https://picsum.photos/seed/post4/800/800',
      mediaType: 'PHOTO',
      description: 'Nos bastidores do nosso ultimo projeto fotografico. Adoramos trabalhar com profissionais talentosos que encontramos aqui na plataforma! #marketingdigital #studio',
    },
  });

  const post5 = await prisma.post.create({
    data: {
      authorId: freelancer3.id,
      description: 'Acabei de fechar um projeto de identidade visual para uma startup de fintech. Motion design + branding completo. Portfolio atualizado! #design #motiondesign',
    },
  });

  console.log('[SEED] Posts criados');

  // ============================================================
  // LIKES nos posts
  // ============================================================
  await prisma.postLike.createMany({
    data: [
      { postId: post1.id, userId: empresa1.id },
      { postId: post1.id, userId: empresa2.id },
      { postId: post1.id, userId: freelancer2.id },
      { postId: post1.id, userId: freelancer3.id },
      { postId: post2.id, userId: empresa1.id },
      { postId: post2.id, userId: freelancer2.id },
      { postId: post3.id, userId: empresa1.id },
      { postId: post3.id, userId: freelancer1.id },
      { postId: post4.id, userId: freelancer1.id },
      { postId: post4.id, userId: freelancer2.id },
      { postId: post5.id, userId: freelancer1.id },
    ],
  });

  console.log('[SEED] Likes criados');

  // ============================================================
  // COMENTARIOS
  // ============================================================
  await prisma.postComment.createMany({
    data: [
      { postId: post1.id, authorId: empresa1.id, content: 'Trabalho lindo Carlos! Vamos falar sobre o proximo projeto?' },
      { postId: post1.id, authorId: freelancer2.id, content: 'Que angulo perfeito! Qual foi a altitude?' },
      { postId: post1.id, authorId: freelancer3.id, content: 'Impressionante! Golden hour e sempre magico.' },
      { postId: post3.id, authorId: empresa1.id, content: 'Ana, adoramos seus trabalhos! Ja mandamos mensagem no chat 😊' },
      { postId: post3.id, authorId: freelancer1.id, content: 'Parceria incrivel a nossa! Quando juntamos foto e video o resultado e outro nivel.' },
      { postId: post4.id, authorId: freelancer1.id, content: 'Foi um prazer trabalhar com voces! Ate o proximo projeto.' },
    ],
  });

  console.log('[SEED] Comentarios criados');

  // ============================================================
  // MENSAGENS DE CHAT
  // ============================================================
  await prisma.chatMessage.createMany({
    data: [
      { senderId: empresa1.id, receiverId: freelancer1.id, content: 'Oi Carlos! Vi seu portfolio e adorei. Voce topa o projeto de lancamento?' },
      { senderId: freelancer1.id, receiverId: empresa1.id, content: 'Ola! Claro, seria um prazer. Ja candidatei na vaga do sistema!' },
      { senderId: empresa1.id, receiverId: freelancer1.id, content: 'Perfeito, ja vi a candidatura. Vamos conversar mais detalhes.' },
    ],
  });

  console.log('[SEED] Chat criado');

  // ============================================================
  // RESUMO
  // ============================================================
  console.log('\n[SEED] ==========================================');
  console.log('[SEED]  SEED CONCLUIDO! Contas para acesso:');
  console.log('[SEED] ==========================================');
  console.log('[SEED]');
  console.log('[SEED]  EMPRESAS:');
  console.log('[SEED]    empresa@teste.com   / senha123  (Studio Criativo - verificada)');
  console.log('[SEED]    eventos@teste.com   / senha123  (Eventos Premium)');
  console.log('[SEED]');
  console.log('[SEED]  FREELANCERS:');
  console.log('[SEED]    freelancer@teste.com / senha123  (Carlos - verificado, ativo)');
  console.log('[SEED]    videomaker@teste.com / senha123  (Ana - ativa)');
  console.log('[SEED]    designer@teste.com   / senha123  (Pedro - sem assinatura)');
  console.log('[SEED]');
  console.log('[SEED] ==========================================\n');
}

main()
  .catch((e) => {
    console.error('[SEED ERROR]', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
