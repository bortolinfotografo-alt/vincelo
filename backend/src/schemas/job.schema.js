// ============================================================
// JOB SCHEMAS — Zod
// ============================================================

const { z } = require('zod');

const TIME_REGEX = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

const createJobSchema = z.object({
  title: z
    .string({ required_error: 'Título é obrigatório' })
    .min(5, 'Título deve ter pelo menos 5 caracteres')
    .max(200, 'Título muito longo')
    .trim(),
  description: z
    .string({ required_error: 'Descrição é obrigatória' })
    .min(20, 'Descrição deve ter pelo menos 20 caracteres')
    .max(5000, 'Descrição muito longa')
    .trim(),
  serviceType: z
    .string({ required_error: 'Tipo de serviço é obrigatório' })
    .min(1, 'Tipo de serviço é obrigatório')
    .max(100)
    .trim(),
  location: z
    .string({ required_error: 'Localização é obrigatória' })
    .min(2, 'Localização muito curta')
    .max(200)
    .trim(),
  jobDate: z
    .string({ required_error: 'Data da vaga é obrigatória' })
    .refine((d) => {
      const date = new Date(d);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date >= today;
    }, 'A data da vaga deve ser hoje ou no futuro'),
  jobTime: z
    .string()
    .regex(TIME_REGEX, 'Formato de horário inválido. Use HH:MM')
    .optional()
    .nullable(),
  budget: z
    .number({ required_error: 'Orçamento é obrigatório', invalid_type_error: 'Orçamento deve ser um número' })
    .positive('Orçamento deve ser positivo')
    .max(999999.99, 'Orçamento inválido'),
});

const updateJobSchema = z.object({
  title: z.string().min(5).max(200).trim().optional(),
  description: z.string().min(20).max(5000).trim().optional(),
  serviceType: z.string().min(1).max(100).trim().optional(),
  location: z.string().min(2).max(200).trim().optional(),
  jobDate: z
    .string()
    .refine((d) => {
      const date = new Date(d);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date >= today;
    }, 'A data da vaga deve ser hoje ou no futuro')
    .optional(),
  jobTime: z.string().regex(TIME_REGEX, 'Formato HH:MM').optional().nullable(),
  budget: z.number().positive().max(999999.99).optional(),
  status: z.enum(['OPEN', 'CANCELLED', 'COMPLETED']).optional(),
});

module.exports = { createJobSchema, updateJobSchema };
