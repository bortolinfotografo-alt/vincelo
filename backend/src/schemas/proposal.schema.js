// ============================================================
// PROPOSAL SCHEMAS — Zod
// ============================================================

const { z } = require('zod');

const createProposalSchema = z.object({
  jobId: z
    .string({ required_error: 'ID da vaga é obrigatório' })
    .uuid('ID da vaga inválido'),
  coverLetter: z
    .string({ required_error: 'Carta de apresentação é obrigatória' })
    .min(30, 'Carta de apresentação deve ter pelo menos 30 caracteres')
    .max(3000, 'Carta de apresentação muito longa')
    .trim(),
  proposedBudget: z
    .number({ invalid_type_error: 'Orçamento proposto deve ser um número' })
    .positive('Orçamento proposto deve ser positivo')
    .max(999999.99)
    .optional()
    .nullable(),
});

const updateProposalStatusSchema = z.object({
  status: z.enum(['ACCEPTED', 'REJECTED'], {
    errorMap: () => ({ message: 'Status deve ser ACCEPTED ou REJECTED' }),
  }),
});

module.exports = { createProposalSchema, updateProposalStatusSchema };
