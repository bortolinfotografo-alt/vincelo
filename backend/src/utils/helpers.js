// ============================================================
// HELPERS / UTILITARIOS COMPARTILHADOS
// Funcoes reutilizadas em multiplos controllers
// ============================================================

/**
 * Calcula nota media de um array de reviews
 * @param {Array} reviews - array de objetos com campo `rating` (Number)
 * @returns {Number} media arredondada com 1 casa decimal, ou 0
 */
function calculateAvgRating(reviews = []) {
  if (!reviews || reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
  return Number((sum / reviews.length).toFixed(1));
}

/**
 * Verifica se um buffer corresponde a um tipo de arquivo permitido
 * usando magic bytes (assinaturas binarias do arquivo)
 * @param {Buffer} buffer - primeiros bytes do arquivo
 * @returns {Boolean} true se o tipo for permitido
 */
function isAllowedMagicBytes(buffer) {
  if (!buffer || buffer.length < 4) return false;

  const b = buffer;

  // JPEG: FF D8 FF
  if (b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF) return true;

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47) return true;

  // GIF: 47 49 46 38 (GIF8)
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38) return true;

  // WebP: RIFF????WEBP
  if (
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && // RIFF
    b.length >= 12 &&
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50   // WEBP
  ) return true;

  // MP4 / MOV: ftyp box (bytes 4-7 = "ftyp")
  if (
    b.length >= 8 &&
    b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70 // ftyp
  ) return true;

  // AVI: RIFF????AVI
  if (
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && // RIFF
    b.length >= 12 &&
    b[8] === 0x41 && b[9] === 0x56 && b[10] === 0x49 // AVI
  ) return true;

  // PDF: %PDF
  if (b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46) return true;

  return false;
}

/**
 * Valida e normaliza parâmetros de paginação de query string.
 * Previne valores negativos, zero, não-numéricos ou absurdamente grandes.
 * @param {object} query - req.query
 * @param {number} [maxLimit=100] - limite máximo permitido
 * @returns {{ page: number, limit: number, skip: number }}
 */
function parsePagination(query, maxLimit = 100) {
  let page = parseInt(query.page, 10);
  let limit = parseInt(query.limit, 10);

  if (!Number.isFinite(page) || page < 1) page = 1;
  if (!Number.isFinite(limit) || limit < 1) limit = 20;
  if (limit > maxLimit) limit = maxLimit;

  return { page, limit, skip: (page - 1) * limit };
}

module.exports = {
  calculateAvgRating,
  isAllowedMagicBytes,
  parsePagination,
};
