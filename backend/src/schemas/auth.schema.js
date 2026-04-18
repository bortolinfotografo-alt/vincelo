// ============================================================
// AUTH SCHEMAS — Zod
// Validação de entrada para todos os endpoints de autenticação
// ============================================================

const { z } = require('zod');

const registerSchema = z.object({
  name: z
    .string({ required_error: 'Nome é obrigatório' })
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome muito longo')
    .trim(),
  email: z
    .string({ required_error: 'Email é obrigatório' })
    .email('Email inválido')
    .toLowerCase()
    .trim(),
  password: z
    .string({ required_error: 'Senha é obrigatória' })
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .max(128, 'Senha muito longa'),
  role: z.enum(['FREELANCER', 'COMPANY'], {
    errorMap: () => ({ message: 'Role deve ser FREELANCER ou COMPANY' }),
  }),
  profileData: z
    .object({
      // Freelancer
      location: z.string().max(200).trim().optional(),
      specialties: z.array(z.string().trim()).max(10).optional(),
      skills: z.array(z.string().trim()).max(20).optional(),
      // Company
      companyName: z.string().max(200).trim().optional(),
      companyWebsite: z.string().url('URL do site inválida').optional().or(z.literal('')).optional(),
      companySize: z.string().max(50).optional(),
      segment: z.string().max(100).optional(),
    })
    .optional(),
});

const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email é obrigatório' })
    .email('Email inválido')
    .toLowerCase()
    .trim(),
  password: z.string({ required_error: 'Senha é obrigatória' }).min(1, 'Senha é obrigatória'),
});

const forgotPasswordSchema = z.object({
  email: z
    .string({ required_error: 'Email é obrigatório' })
    .email('Email inválido')
    .toLowerCase()
    .trim(),
});

const resetPasswordSchema = z.object({
  resetToken: z.string({ required_error: 'Token é obrigatório' }).min(1),
  newPassword: z
    .string({ required_error: 'Nova senha é obrigatória' })
    .min(8, 'A nova senha deve ter pelo menos 8 caracteres')
    .max(128),
});

module.exports = {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};
