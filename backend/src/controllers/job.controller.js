// ============================================================
// JOB CONTROLLER
// CRUD de vagas: criar, listar, ver detalhes, atualizar status
// ============================================================

const { prisma } = require('../services/db');
const logger = require('../utils/logger');

const TIME_REGEX = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

/**
 * Valida que a data da vaga seja hoje ou no futuro
 * @param {string} dateStr - data em formato ISO
 * @returns {boolean} true se valida
 */
function isValidFutureDate(dateStr) {
  const jobDate = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return jobDate >= today;
}

/**
 * POST /api/jobs
 * Cria uma nova vaga (apenas empresas)
 */
async function createJob(req, res) {
  const { title, description, serviceType, location, jobDate, jobTime, budget } = req.body;

  // Valida formato do horario (HH:MM)
  if (jobTime && !TIME_REGEX.test(jobTime)) {
    return res.status(400).json({ message: 'Formato de horario invalido. Use HH:MM' });
  }

  // Valida que a data da vaga seja hoje ou no futuro (obrigatoria)
  if (!jobDate) {
    return res.status(400).json({ message: 'A data da vaga e obrigatoria' });
  }

  if (!isValidFutureDate(jobDate)) {
    return res.status(400).json({ message: 'A data da vaga deve ser hoje ou no futuro' });
  }

  // Busca perfil da empresa
  const company = await prisma.companyProfile.findUnique({
    where: { userId: req.user.id },
  });

  if (!company) {
    return res.status(400).json({
      message: 'Perfil de empresa necessario para criar vagas',
    });
  }

  const job = await prisma.job.create({
    data: {
      companyId: company.id,
      title,
      description,
      serviceType,
      location,
      jobDate: new Date(jobDate),
      jobTime: jobTime || null,
      budget,
    },
    include: {
      company: {
        include: {
          user: { select: { id: true, name: true, avatar: true } },
        },
      },
    },
  });

  logger.info('[JOB] Vaga criada', { jobId: job.id, companyId: company.id });

  return res.status(201).json({ message: 'Vaga criada com sucesso', job });
}

/**
 * GET /api/jobs
 * Lista vagas abertas com filtros e paginacao
 */
async function listJobs(req, res) {
  const { serviceType, location, search, status, companyId, page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const where = {};

  if (serviceType) where.serviceType = serviceType;
  if (location) where.location = { contains: location, mode: 'insensitive' };
  if (companyId) {
    where.companyId = companyId;
    if (status) where.status = status;
  } else {
    // Listagem pública: só vagas abertas com data igual ou futura (UTC para evitar timezone)
    where.status = status || 'OPEN';
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    where.jobDate = { gte: today };
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [jobs, total] = await prisma.$transaction([
    prisma.job.findMany({
      where,
      include: {
        company: {
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
        },
        assignedFreelancer: {
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
        },
        _count: { select: { proposals: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      skip,
    }),
    prisma.job.count({ where }),
  ]);

  return res.json({
    jobs,
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / Number(limit)),
  });
}

/**
 * GET /api/jobs/:id
 * Detalhe de uma vaga
 */
async function getJobById(req, res) {
  const job = await prisma.job.findUnique({
    where: { id: req.params.id },
    include: {
      company: {
        include: {
          user: { select: { id: true, name: true, avatar: true } },
        },
      },
      proposals: {
        include: {
          freelancer: {
            include: {
              user: { select: { id: true, name: true, avatar: true } },
            },
          },
        },
      },
    },
  });

  if (!job) {
    return res.status(404).json({ message: 'Vaga nao encontrada' });
  }

  return res.json({ job });
}

/**
 * PUT /api/jobs/:id
 * Atualiza uma vaga (apenas quem criou e sem propostas aceitas)
 */
async function updateJob(req, res) {
  const job = await prisma.job.findUnique({
    where: { id: req.params.id },
    include: {
      company: { select: { userId: true } },
      _count: { select: { proposals: true } },
    },
  });

  if (!job) {
    return res.status(404).json({ message: 'Vaga nao encontrada' });
  }

  if (job.company.userId !== req.user.id) {
    return res.status(403).json({ message: 'Acesso negado' });
  }

  // Nao permite editar vaga que ja tem propostas aceitas (status IN_PROGRESS)
  if (job.status === 'IN_PROGRESS') {
    return res.status(400).json({
      message: 'Nao e possivel editar uma vaga em andamento. Um freelancer ja foi contratado.',
    });
  }

  // Campos criticos (budget, data, tipo) nao podem ser editados se ja houver candidatos
  const { title, description, serviceType, location, jobDate, jobTime, budget, status } = req.body;
  const hasCandidates = job._count.proposals > 0;

  if (hasCandidates && (budget !== undefined || jobDate !== undefined || serviceType !== undefined)) {
    return res.status(400).json({
      message: 'Nao e possivel alterar orcamento, data ou tipo de servico de uma vaga que ja possui candidatos.',
    });
  }

  const updateData = {};
  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (location !== undefined) updateData.location = location;

  if (!hasCandidates) {
    if (serviceType !== undefined) updateData.serviceType = serviceType;

    if (jobDate !== undefined) {
      if (!isValidFutureDate(jobDate)) {
        return res.status(400).json({ message: 'A data da vaga deve ser hoje ou no futuro' });
      }
      updateData.jobDate = new Date(jobDate);
    }

    if (budget !== undefined) updateData.budget = budget;
  }

  if (jobTime !== undefined) {
    if (!TIME_REGEX.test(jobTime)) {
      return res.status(400).json({ message: 'Formato de horario invalido. Use HH:MM' });
    }
    updateData.jobTime = jobTime;
  }

  // Status so pode ser CANCELLED pelo dono (nao pode setar IN_PROGRESS diretamente)
  if (status !== undefined) {
    if (!['OPEN', 'CANCELLED', 'COMPLETED'].includes(status)) {
      return res.status(400).json({ message: 'Status invalido' });
    }
    updateData.status = status;
  }

  const updatedJob = await prisma.job.update({
    where: { id: req.params.id },
    data: updateData,
  });

  logger.info('[JOB] Vaga atualizada', { jobId: updatedJob.id });

  return res.json({ message: 'Vaga atualizada com sucesso', job: updatedJob });
}

/**
 * DELETE /api/jobs/:id
 * Remove uma vaga (apenas quem criou e apenas se estiver OPEN)
 */
async function deleteJob(req, res) {
  const job = await prisma.job.findUnique({
    where: { id: req.params.id },
    select: {
      id: true,
      status: true,
      company: { select: { userId: true } },
    },
  });

  if (!job) {
    return res.status(404).json({ message: 'Vaga nao encontrada' });
  }

  if (job.company.userId !== req.user.id) {
    return res.status(403).json({ message: 'Acesso negado' });
  }

  if (job.status === 'IN_PROGRESS') {
    return res.status(400).json({
      message: 'Nao e possivel remover uma vaga em andamento. Cancele-a primeiro.',
    });
  }

  await prisma.job.delete({ where: { id: req.params.id } });

  logger.info('[JOB] Vaga removida', { jobId: req.params.id });

  return res.json({ message: 'Vaga removida com sucesso' });
}

/**
 * GET /api/jobs/my
 * Lista vagas do usuario logado:
 *  - Empresas: vagas criadas
 *  - Freelancers: vagas onde se candidatou
 */
async function myJobs(req, res) {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: { freelancer: true, company: true },
  });

  let jobs = [];

  if (user.role === 'COMPANY' && user.company) {
    jobs = await prisma.job.findMany({
      where: { companyId: user.company.id },
      include: {
        _count: { select: { proposals: true } },
        assignedFreelancer: {
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  } else if (user.role === 'FREELANCER' && user.freelancer) {
    const proposals = await prisma.proposal.findMany({
      where: { freelancerId: user.freelancer.id },
      include: {
        job: {
          include: {
            company: {
              include: {
                user: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    jobs = proposals.map((p) => ({ ...p.job, proposalStatus: p.status }));
  }

  return res.json({ jobs });
}

module.exports = {
  createJob,
  listJobs,
  getJobById,
  updateJob,
  deleteJob,
  myJobs,
};
