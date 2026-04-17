// ============================================================
// STORAGE SERVICE
// Gerencia upload de arquivos para Supabase Storage
// Inclui validacao de magic bytes para seguranca
// ============================================================

const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const { isAllowedMagicBytes } = require('../utils/helpers');
const logger = require('../utils/logger');

// Cliente Supabase com service role (permissao total no Storage)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ============================================================
// CONFIGURACAO DO MULTER (MEMORIA)
// Arquivo fica em RAM temporariamente antes de ir ao Supabase
// ============================================================

function generateFileName(originalName) {
  const hash = crypto.randomBytes(16).toString('hex');
  const ext = path.extname(originalName).toLowerCase();
  return `${hash}${ext}`;
}

const ALLOWED_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/quicktime',
  'video/x-msvideo',
  'application/pdf',
];

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.mp4', '.mov', '.avi', '.pdf'];

const EXT_TO_MIME = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.webp': 'image/webp', '.gif': 'image/gif',
  '.mp4': 'video/mp4', '.mov': 'video/quicktime', '.avi': 'video/x-msvideo',
  '.pdf': 'application/pdf',
};

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  // Fallback: se o browser não enviou mimetype correto, infere pela extensão
  if (!file.mimetype || file.mimetype === 'application/octet-stream') {
    const inferred = EXT_TO_MIME[ext];
    if (inferred) {
      file.mimetype = inferred;
    }
  }

  if (!ALLOWED_MIMES.includes(file.mimetype)) {
    return cb(new Error('Formato de arquivo nao permitido. Use JPG, PNG, WebP, GIF, MP4 ou MOV.'), false);
  }

  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(new Error('Extensao de arquivo nao permitida.'), false);
  }

  cb(null, true);
};

// Multer armazena em memoria (buffer) — nao grava no disco
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter,
});

// ============================================================
// VALIDACAO DE MAGIC BYTES (buffer em memoria)
// ============================================================

function validateMagicBytes(req, res, next) {
  // Suporta upload.single() → req.file
  //         upload.array()  → req.files (array)
  //         upload.fields() → req.files (objeto { campo: [files] })
  let filesToCheck = [];

  if (req.file) {
    filesToCheck = [req.file];
  } else if (req.files) {
    if (Array.isArray(req.files)) {
      filesToCheck = req.files;
    } else {
      filesToCheck = Object.values(req.files).flat();
    }
  }

  if (filesToCheck.length === 0) return next();

  for (const file of filesToCheck) {
    const buffer = file.buffer.slice(0, 12);
    if (!isAllowedMagicBytes(buffer)) {
      logger.warn('[STORAGE] Arquivo rejeitado por magic bytes invalidos', {
        originalName: file.originalname,
        mimetype: file.mimetype,
      });
      return res.status(400).json({
        message: 'Arquivo invalido. O conteudo nao corresponde ao tipo declarado.',
      });
    }
  }

  return next();
}

// ============================================================
// UPLOAD PARA SUPABASE STORAGE
// ============================================================

/**
 * Faz upload de um arquivo para o Supabase Storage
 * @param {Express.Multer.File} file - arquivo do multer (memoryStorage)
 * @param {string} bucket - nome do bucket: 'posts' | 'stories' | 'avatars' | 'portfolio'
 * @returns {Promise<string>} URL publica do arquivo
 */
async function uploadFile(file, bucket = 'posts') {
  const filename = generateFileName(file.originalname);

  const { error } = await supabase.storage
    .from(bucket)
    .upload(filename, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (error) {
    logger.error('[STORAGE] Erro ao fazer upload para Supabase', { error: error.message, bucket });
    throw new Error(`Falha no upload: ${error.message}`);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(filename);
  return data.publicUrl;
}

/**
 * Middleware que faz upload para o Supabase apos o multer processar o arquivo.
 * Anexa a URL publica em req.fileUrl para uso no controller.
 * @param {string} bucket - bucket de destino
 */
function createUploadMiddleware(bucket = 'posts') {
  return async (req, res, next) => {
    if (!req.file) return next();

    try {
      req.fileUrl = await uploadFile(req.file, bucket);
      next();
    } catch (err) {
      logger.error('[STORAGE] Falha no upload para Supabase', { error: err.message });
      return res.status(500).json({ message: 'Erro ao fazer upload do arquivo' });
    }
  };
}

/**
 * Middleware para upload múltiplo via upload.fields()
 * Processa req.files.media[] e req.files.thumbnail[]
 * Anexa req.fileUrls (array) e req.thumbnailUrl ao request.
 */
function createMultiUploadMiddleware(bucket = 'posts') {
  return async (req, res, next) => {
    const mediaFiles = req.files?.media || [];
    const thumbnailFiles = req.files?.thumbnail || [];

    try {
      if (mediaFiles.length > 0) {
        req.fileUrls = await Promise.all(mediaFiles.map((f) => uploadFile(f, bucket)));
      } else {
        req.fileUrls = [];
      }

      if (thumbnailFiles.length > 0) {
        req.thumbnailUrl = await uploadFile(thumbnailFiles[0], bucket);
      } else {
        req.thumbnailUrl = null;
      }

      next();
    } catch (err) {
      logger.error('[STORAGE] Falha no multi-upload', { error: err.message });
      return res.status(500).json({ message: 'Erro ao fazer upload dos arquivos' });
    }
  };
}

module.exports = {
  upload,
  validateMagicBytes,
  generateFileName,
  uploadFile,
  createUploadMiddleware,
  createMultiUploadMiddleware,
};
