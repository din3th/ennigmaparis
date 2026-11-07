/**
 * Minimal structured logger. Emits one JSON line per entry in production
 * (easy to search in Vercel / Docker logs) and readable lines in development.
 */
const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test' || process.env.VITEST;

const serializeError = (err) =>
  err instanceof Error ? { name: err.name, message: err.message, stack: err.stack } : err;

const write = (level, message, meta = {}) => {
  if (isTest && level !== 'error') return;
  const entry = { level, time: new Date().toISOString(), msg: message };
  for (const [key, value] of Object.entries(meta)) {
    entry[key] = serializeError(value);
  }
  const out = level === 'error' || level === 'warn' ? console.error : console.log;
  if (isProduction) {
    out(JSON.stringify(entry));
  } else {
    const extra = Object.keys(meta).length ? ` ${JSON.stringify(entry, (k, v) => (k === 'level' || k === 'time' || k === 'msg' ? undefined : v))}` : '';
    out(`[${level.toUpperCase()}] ${message}${extra}`);
  }
};

const logger = {
  info: (msg, meta) => write('info', msg, meta),
  warn: (msg, meta) => write('warn', msg, meta),
  error: (msg, meta) => write('error', msg, meta),
};

export default logger;
