// ============================================================
// USER CONTROLLER
// CRUD de perfil, listar freelancers, detalhe de perfil
// ============================================================

const { prisma } = require('../services/db');
const { calculateAvgRating } = require('../utils/helpers');

/**
 * GET /api/users/freelancers
 * Lista freelancers com filtros compostos.
 *
 * Query params:
 *   search      – texto livre (nome ou descrição do usuário)
 *   location    – cidade/estado (case-insensitive, contains)
 *   specialty   – especialidade exata (fotografia, video, drone...)
 *   available   – "true" | "false" (flag geral de disponibilidade)
 *   availableOn – data ISO (YYYY-MM-DD) — retorna apenas quem NÃO tem
 *                 essa data marcada como indisponível na agenda
 */
async function listFreelancers(req, res) {
  const { location, specialty, available, search, availableOn } = req.query;

  // ── Filtro base: usuário ativo com role FREELANCER ───────────
  const where = {
    role: 'FREELANCER',
    isActive: true,
  };

  // ── Filtros do perfil FreelancerProfile ──────────────────────
  // IMPORTANTE: NÃO misturar "isNot: null" com filtros de campo no mesmo objeto.
  // Em Prisma, "isNot" é um filtro de relação (nivel de relação),
  // enquanto location/specialty etc. são filtros de campo (nível de campo).
  // Combinar os dois com spread causa query malformada → zero resultados.
  //
  // Solução: construir um objeto de filtros de campo puro; a existência da
  // relação é garantida implicitamente quando há campos filtrados.
  // Para "sem filtros de campo", usar { isNot: null } separadamente.
  const freelancerFieldFilters = {};

  if (location) {
    freelancerFieldFilters.location = { contains: location, mode: 'insensitive' };
  }

  if (specialty) {
    freelancerFieldFilters.specialties = { has: specialty };
  }

  // Filtro de disponibilidade geral (flag boolean)
  if (available !== undefined && available !== '') {
    freelancerFieldFilters.available = available === 'true';
  }

  // Filtro de data: exclui freelancers que tenham a data na agenda de indisponibilidade
  if (availableOn) {
    const targetDate = new Date(availableOn);
    // Início e fim do dia UTC para cobrir qualquer timezone do banco
    const dayStart = new Date(targetDate);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(targetDate);
    dayEnd.setUTCHours(23, 59, 59, 999);

    // "none" → nenhum registro de indisponibilidade nessa data
    freelancerFieldFilters.unavailability = {
      none: {
        date: { gte: dayStart, lte: dayEnd },
      },
    };
    // Também garante que o freelancer está marcado como disponível
    // (a menos que o filtro "available" já tenha sido setado manualmente)
    if (available === undefined || available === '') {
      freelancerFieldFilters.available = true;
    }
  }

  // Aplica filtros de perfil de forma correta:
  // com campos → usa os campos diretamente (relação deve existir implicitamente)
  // sem campos → exige apenas que o perfil exista ({ isNot: null })
  where.freelancer = Object.keys(freelancerFieldFilters).length > 0
    ? freelancerFieldFilters
    : { isNot: null };

  // ── Filtro de texto (nome ou descrição do usuário) ───────────
  if (search) {
    // Busca também em skills e especialidades do perfil freelancer
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { freelancer: { skills: { hasSome: [search] } } },
    ];
  }

  // ── Paginação ─────────────────────────────────────────────────
  const { page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const [freelancers, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      include: {
        freelancer: {
          include: {
            portfolio: { orderBy: { order: 'asc' }, take: 6 },
            unavailability: true,
          },
        },
        reviewsReceived: { select: { rating: true } },
        _count: { select: { followers: true } },
      },
      orderBy: [{ createdAt: 'desc' }],
      take: Number(limit),
      skip,
    }),
    prisma.user.count({ where }),
  ]);

  // ── Formata resposta ──────────────────────────────────────────
  // Data de referência para o badge: usa o filtro availableOn se informado, senão usa hoje
  const refDate = availableOn ? new Date(availableOn + 'T12:00:00Z') : new Date();
  const refKey = `${refDate.getUTCFullYear()}-${String(refDate.getUTCMonth() + 1).padStart(2, '0')}-${String(refDate.getUTCDate()).padStart(2, '0')}`;

  const result = freelancers
    .map((f) => {
      const avgRating = calculateAvgRating(f.reviewsReceived);

      // Verifica se a data de referência está bloqueada na agenda do freelancer
      const blockedOnRef = f.freelancer?.unavailability?.some((u) => {
        const d = new Date(u.date);
        const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
        return key === refKey;
      }) ?? false;

      // Disponível = toggle geral ativo E data de referência não está bloqueada
      const available = (f.freelancer?.available ?? false) && !blockedOnRef;

      const followerCount = f._count?.followers || 0;
      // Score de popularidade: avaliação tem peso maior, seguidores complementam
      const popularityScore = (avgRating || 0) * 20 + followerCount;

      return {
        id: f.id,
        name: f.name,
        avatar: f.avatar,
        description: f.description,
        location: f.freelancer?.location,
        specialties: f.freelancer?.specialties,
        skills: f.freelancer?.skills,
        hourlyRate: f.freelancer?.hourlyRate,
        rateType: f.freelancer?.rateType,
        available,
        portfolio: f.freelancer?.portfolio,
        avgRating,
        reviewCount: f.reviewsReceived?.length || 0,
        followerCount,
        popularityScore,
      };
    })
    .sort((a, b) => {
      const hasFilters = !!(search || location || specialty || (available !== undefined && available !== '') || availableOn);

      if (hasFilters) {
        // Com filtro ativo: disponíveis primeiro, depois por popularidade
        if (a.available && !b.available) return -1;
        if (!a.available && b.available) return 1;
        return b.popularityScore - a.popularityScore;
      }

      // Sem filtros: mais populares em destaque (disponíveis ganham bônus leve)
      const aScore = a.popularityScore + (a.available ? 10 : 0);
      const bScore = b.popularityScore + (b.available ? 10 : 0);
      return bScore - aScore;
    });

  return res.json({
    freelancers: result,
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / Number(limit)),
  });
}

/**
 * GET /api/users/:id
 * Detalhe de um usuario (freelancer ou empresa)
 */
async function getUserById(req, res) {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    include: {
      freelancer: {
        include: {
          portfolio: { orderBy: { order: 'asc' } },
          unavailability: true,
        },
      },
      company: true,
      reviewsReceived: { select: { rating: true } },
      _count: {
        select: {
          posts: true,
          followers: true,
          following: true,
        },
      },
    },
  });

  if (!user) {
    return res.status(404).json({ message: 'Usuario nao encontrado' });
  }

  const { password, resetToken, resetExpires, ...safeUser } = user;

  if (user.freelancer) {
    const avgRating = calculateAvgRating(user.reviewsReceived);
    const reviewCount = user.reviewsReceived?.length || 0;

    // Disponibilidade real: toggle geral ativo E hoje não bloqueado na agenda
    const nowU = new Date();
    const todayKeyU = `${nowU.getUTCFullYear()}-${String(nowU.getUTCMonth() + 1).padStart(2, '0')}-${String(nowU.getUTCDate()).padStart(2, '0')}`;
    const blockedToday = user.freelancer.unavailability?.some((u) => {
      const d = new Date(u.date);
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
      return key === todayKeyU;
    }) ?? false;

    const freelancerWithAvail = {
      ...safeUser,
      freelancer: {
        ...safeUser.freelancer,
        available: (user.freelancer.available ?? false) && !blockedToday,
      },
      avgRating,
      reviewCount,
    };
    return res.json(freelancerWithAvail);
  }

  return res.json(safeUser);
}

/**
 * PUT /api/users/profile
 * Atualiza perfil do usuario logado
 */
async function updateProfile(req, res) {
  const { name, phone, description, profileData } = req.body;

  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (phone !== undefined) updateData.phone = phone;
  if (description !== undefined) updateData.description = description;

  if (req.file) {
    updateData.avatar = req.fileUrl;
  }

  const updatedUser = await prisma.user.update({
    where: { id: req.user.id },
    data: updateData,
    include: { freelancer: true, company: true },
  });

  if (updatedUser.role === 'FREELANCER' && profileData) {
    const parsedData = typeof profileData === 'string' ? JSON.parse(profileData) : profileData;
    await prisma.freelancerProfile.update({
      where: { userId: req.user.id },
      data: {
        location: parsedData.location,
        specialties: parsedData.specialties,
        skills: parsedData.skills,
        hourlyRate: parsedData.hourlyRate ? Number(parsedData.hourlyRate) : undefined,
        rateType: parsedData.rateType || undefined,
      },
    });
  }

  if (updatedUser.role === 'COMPANY' && profileData) {
    const parsedData = typeof profileData === 'string' ? JSON.parse(profileData) : profileData;
    await prisma.companyProfile.update({
      where: { userId: req.user.id },
      data: {
        companyName: parsedData.companyName,
        companyWebsite: parsedData.companyWebsite,
        companySize: parsedData.companySize,
        segment: parsedData.segment,
      },
    });
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: { freelancer: true, company: true },
  });

  const { password, resetToken, resetExpires, ...safeUser } = user;
  return res.json({ message: 'Perfil atualizado com sucesso', user: safeUser });
}

/**
 * GET /api/users/companies
 */
async function listCompanies(req, res) {
  const { page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const [companies, total] = await prisma.$transaction([
    prisma.user.findMany({
      where: { role: 'COMPANY', isActive: true, company: { isNot: null } },
      include: {
        company: {
          include: {
            postedJobs: { where: { status: 'OPEN' }, orderBy: { createdAt: 'desc' }, take: 3 },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      skip,
    }),
    prisma.user.count({ where: { role: 'COMPANY', isActive: true, company: { isNot: null } } }),
  ]);

  const result = companies.map((c) => ({
    id: c.id,
    name: c.company?.companyName,
    description: c.description,
    companyWebsite: c.company?.companyWebsite,
    companySize: c.company?.companySize,
    segment: c.company?.segment,
    openJobs: c.company?.postedJobs?.length || 0,
    recentJobs: c.company?.postedJobs,
  }));

  return res.json({ companies: result, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) });
}

module.exports = { listFreelancers, getUserById, updateProfile, listCompanies };
