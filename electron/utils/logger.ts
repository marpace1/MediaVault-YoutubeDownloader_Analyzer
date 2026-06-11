/**
 * Minimal structured logger. Writes to stdout in dev and to a rotating file in
 * the user-data directory in production so crashes can be diagnosed.
 */
import { app } from 'electron';
import { createWriteStream, type WriteStream } from 'node:fs';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

type Level = 'info' | 'warn' | 'error' | 'debug';

let stream: WriteStream | null = null;

function ensureStream(): WriteStream | null {
  if (stream) return stream;
  try {
    const dir = join(app.getPath('userData'), 'logs');
    mkdirSync(dir, { recursive: true });
    stream = createWriteStream(join(dir, 'mediavault.log'), { flags: 'a' });
    return stream;
  } catch {
    return null;
  }
}

function write(level: Level, scope: string, msg: unknown, ...rest: unknown[]) {
  const line = `[${new Date().toISOString()}] [${level.toUpperCase()}] [${scope}] ${String(
    msg,
  )} ${rest.map((r) => (typeof r === 'object' ? JSON.stringify(r) : String(r))).join(' ')}`.trim();

  // Always echo to console.
  // eslint-disable-next-line no-console
  (console[level === 'debug' ? 'log' : level] ?? console.log)(line);

  const s = ensureStream();
  s?.write(line + '\n');
}

export function createLogger(scope: string) {
  return {
    info: (msg: unknown, ...rest: unknown[]) => write('info', scope, msg, ...rest),
    warn: (msg: unknown, ...rest: unknown[]) => write('warn', scope, msg, ...rest),
    error: (msg: unknown, ...rest: unknown[]) => write('error', scope, msg, ...rest),
    debug: (msg: unknown, ...rest: unknown[]) => write('debug', scope, msg, ...rest),
  };
}
