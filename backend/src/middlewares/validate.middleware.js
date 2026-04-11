// ============================================================
// VALIDATE MIDDLEWARE
// Valida req.body, req.query ou req.params com um schema Zod.
// Rejeita a request com 400 antes de chegar ao controller.
// ============================================================

const { ZodError } = require('zod');

/**
 * Cria um middleware de validação para um schema Zod.
 *
 * @param {import('zod').ZodSchema} schema - Schema Zod
 * @param {'body'|'query'|'params'} source - Parte da request a validar (default: body)
 */
function validate(schema, source = 'body') {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req[source]);
      // Substitui com os dados parseados (campos extras são removidos pelo strict)
      req[source] = parsed;
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        return res.status(400).json({
          message: 'Dados inválidos',
          errors,
        });
      }
      return next(error);
    }
  };
}

module.exports = { validate };
