// ============================================================
// USER SCHEMAS — Zod
// ============================================================

const { z } = require('zod');

const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  phone: z
    .string()
    .max(20)
    .regex(/^[\d\s\+\-\(\)]*$/, 'Telefone inválido')
    .optional()
    .nullable(),
  description: z.string().max(1000).trim().optional().nullable(),
  profileData: z
    .union([
      z.string().transform((s) => {
        try { return JSON.parse(s); } catch { return s; }
      }),
      z.object({
        location: z.string().max(200).trim().optional(),
        specialties: z.array(z.string().trim()).max(10).optional(),
        skills: z.array(z.string().trim()).max(20).optional(),
        hourlyRate: z.union([z.number().positive().max(9999), z.string()]).optional().nullable(),
        companyName: z.string().max(200).trim().optional(),
        companyWebsite: z.string().url().optional().or(z.literal('')).optional(),
        companySize: z.string().max(50).optional(),
        segment: z.string().max(100).optional(),
      }),
    ])
    .optional(),
});

module.exports = { updateProfileSchema };
