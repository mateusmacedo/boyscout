// import type { LoggerOptions } from 'pino';
// import pino from 'pino';
import type { LogEntry } from './types.js';

// Type definitions for optional pino dependency
type LoggerOptions = {
  level?: string;
  base?: object;
  [key: string]: unknown;
};

type PinoLogger = {
  child: (...args: unknown[]) => PinoLogger;
  trace: (...args: unknown[]) => unknown;
  debug: (...args: unknown[]) => unknown;
  info: (...args: unknown[]) => unknown;
  warn: (...args: unknown[]) => unknown;
  error: (...args: unknown[]) => unknown;
  fatal: (...args: unknown[]) => unknown;
};

// Minimal interface to accept pino-like loggers in tests without requiring all pino fields
type PinoLike = {
  child: (...args: unknown[]) => PinoLike;
  trace: (...args: unknown[]) => unknown;
  debug: (...args: unknown[]) => unknown;
  info: (...args: unknown[]) => unknown;
  warn: (...args: unknown[]) => unknown;
  error: (...args: unknown[]) => unknown;
  fatal: (...args: unknown[]) => unknown;
};

export interface PinoSinkOptions {
  logger?: PinoLike;
  loggerOptions?: LoggerOptions;
  service?: string;
  env?: string;
  version?: string;
  messageFormat?: (e: LogEntry) => string;
}

type LevelName = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
const asLevel = (lvl: string | undefined): LevelName => {
  switch ((lvl ?? 'info').toLowerCase()) {
    case 'trace':
      return 'trace';
    case 'debug':
      return 'debug';
    case 'info':
      return 'info';
    case 'warn':
      return 'warn';
    case 'error':
      return 'error';
    case 'fatal':
      return 'fatal';
    default:
      return 'info';
  }
};

export function createPinoSink(opts: PinoSinkOptions = {}) {
  // Create a mock logger if pino is not available
  const createMockLogger = (): PinoLogger => ({
    child: () => createMockLogger(),
    trace: () => undefined,
    debug: () => undefined,
    info: () => undefined,
    warn: () => undefined,
    error: () => undefined,
    fatal: () => undefined,
  });

  const logger = opts.logger ?? createMockLogger();

  const fmt =
    opts.messageFormat ??
    ((e: LogEntry) => {
      const cls = e.scope.className ?? '<anon>';
      return `${cls}.${e.scope.methodName} ${e.outcome} in ${e.durationMs.toFixed(1)}ms`;
    });

  return function pinoSink(e: LogEntry) {
    const level = asLevel(e.level as string);
    const { level: _drop, ...payload } = e;
    const l = e.correlationId ? logger.child({ cid: e.correlationId }) : logger;
    (l[level] as (...args: unknown[]) => unknown)(payload, fmt(e));
  };
}
