// ============================================================
// LOGGER
// Logger estruturado com niveis, timestamp e contexto
// Nao requer dependencias externas
// ============================================================

const LEVELS = { error: 0, warn: 1, info: 2, http: 3, debug: 4 };

const currentLevel = LEVELS[process.env.LOG_LEVEL] !== undefined
  ? LEVELS[process.env.LOG_LEVEL]
  : process.env.NODE_ENV === 'production' ? LEVELS.info : LEVELS.debug;

function log(level, message, meta = {}) {
  if (LEVELS[level] > currentLevel) return;

  const entry = {
    timestamp: new Date().toISOString(),
    level: level.toUpperCase(),
    message,
  };

  if (meta && Object.keys(meta).length > 0) {
    entry.meta = meta;
  }

  const output = JSON.stringify(entry);

  if (level === 'error') {
    process.stderr.write(output + '\n');
  } else {
    process.stdout.write(output + '\n');
  }
}

const logger = {
  error: (message, meta) => log('error', message, meta),
  warn:  (message, meta) => log('warn',  message, meta),
  info:  (message, meta) => log('info',  message, meta),
  http:  (message, meta) => log('http',  message, meta),
  debug: (message, meta) => log('debug', message, meta),
};

module.exports = logger;
