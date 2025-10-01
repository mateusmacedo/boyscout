// import type { LoggerOptions } from 'pino';
// import pino from 'pino';
import type { LogEntry } from './types.js';

// Extend global to include our process handlers flag
declare global {
  var __boyscout_logger_process_handlers_setup: boolean | undefined;
  var __boyscout_logger_sinks: Set<() => void> | undefined;
}

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
  flush?: () => void;
};

// Interface to accept pino-like loggers in tests without requiring all pino fields
export type PinoLike = {
  child: (...args: unknown[]) => PinoLike;
  trace: (...args: unknown[]) => unknown;
  debug: (...args: unknown[]) => unknown;
  info: (...args: unknown[]) => unknown;
  warn: (...args: unknown[]) => unknown;
  error: (...args: unknown[]) => unknown;
  fatal: (...args: unknown[]) => unknown;
  flush?: () => void;
};

export interface PinoSinkOptions {
  logger?: PinoLike;
  loggerOptions?: LoggerOptions;
  service?: string;
  env?: string;
  version?: string;
  messageFormat?: (e: LogEntry) => string;
  // Buffer mitigation options
  enableBackpressure?: boolean;
  bufferSize?: number;
  flushInterval?: number;
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

// Buffer for Pino backpressure mitigation
class LogBuffer {
  private buffer: LogEntry[] = [];
  private maxSize: number;
  private flushInterval: number;
  private flushTimer?: NodeJS.Timeout;
  private onFlush: (entries: LogEntry[]) => void;

  constructor(
    maxSize: number = 1000,
    flushInterval: number = 5000,
    onFlush: (entries: LogEntry[]) => void
  ) {
    this.maxSize = maxSize;
    this.flushInterval = flushInterval;
    this.onFlush = onFlush;
    this.startFlushTimer();
  }

  add(entry: LogEntry): void {
    if (this.buffer.length >= this.maxSize) {
      // Drop oldest entries if buffer is full
      this.buffer.shift();
    }
    this.buffer.push(entry);
  }

  flush(): void {
    if (this.buffer.length === 0) return;
    this.onFlush([...this.buffer]);
    this.buffer = [];
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.flushInterval);

    // Unref the timer to prevent it from keeping the process alive
    // This is crucial for tests to exit cleanly
    if (this.flushTimer && typeof this.flushTimer.unref === 'function') {
      this.flushTimer.unref();
    }
  }

  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined;
    }
    this.flush(); // Final flush
  }
}

export function createPinoSink(opts: PinoSinkOptions = {}) {
  // Use provided logger if available, otherwise create a real Pino logger
  let logger: PinoLogger;

  if (opts.logger) {
    // Use the provided logger (usually a mock in tests)
    logger = opts.logger as PinoLogger;
  } else {
    try {
      // Dynamic import to avoid bundling issues
      const pino = require('pino');
      const pinoLogger = pino({
        level: opts.loggerOptions?.level || 'info',
        base: {
          service: opts.service || 'node-logger',
          env: opts.env || process.env.NODE_ENV || 'development',
          version: opts.version || '1.0.0',
          ...opts.loggerOptions?.base,
        },
        ...opts.loggerOptions,
      });

      logger = pinoLogger as PinoLogger;
    } catch (_error) {
      // Fallback to mock logger if pino is not available
      const createMockLogger = (): PinoLogger => ({
        child: () => createMockLogger(),
        trace: () => undefined,
        debug: () => undefined,
        info: () => undefined,
        warn: () => undefined,
        error: () => undefined,
        fatal: () => undefined,
        flush: () => undefined,
      });

      logger = createMockLogger();
    }
  }

  const fmt =
    opts.messageFormat ??
    ((e: LogEntry) => {
      const cls = e.scope.className ?? '<anon>';
      return `${cls}.${e.scope.methodName} ${e.outcome} in ${e.durationMs.toFixed(1)}ms`;
    });

  // Buffer options with defaults
  const { enableBackpressure = true, bufferSize = 1000, flushInterval = 5000 } = opts;

  // Create buffer for backpressure mitigation
  let logBuffer: LogBuffer | null = null;

  if (enableBackpressure) {
    logBuffer = new LogBuffer(bufferSize, flushInterval, (entries: LogEntry[]) => {
      // Process buffered entries
      for (const entry of entries) {
        const level = asLevel(entry.level as string);
        const {
          level: _drop,
          timestamp: _timestamp,
          correlationId: _correlationId,
          ...payload
        } = entry;
        const l = entry.correlationId ? logger.child({ cid: entry.correlationId }) : logger;
        (l[level] as (...args: unknown[]) => unknown)(payload, fmt(entry));
      }
    });
  }

  // Setup process event handlers for graceful shutdown
  // Use a global registry to avoid multiple listeners across all sink instances
  if (!global.__boyscout_logger_process_handlers_setup) {
    // Initialize the sinks registry
    global.__boyscout_logger_sinks = new Set();

    const gracefulShutdown = () => {
      // Call cleanup for all registered sinks
      if (global.__boyscout_logger_sinks) {
        for (const cleanup of global.__boyscout_logger_sinks) {
          try {
            cleanup();
          } catch (_error) {
            // Ignore cleanup errors to prevent cascading failures
          }
        }
      }
    };

    process.on('beforeExit', gracefulShutdown);
    process.on('exit', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGQUIT', gracefulShutdown);

    global.__boyscout_logger_process_handlers_setup = true;
  }

  // Register this sink's cleanup function
  const cleanup = () => {
    if (logBuffer) {
      logBuffer.destroy();
    }
    if (logger.flush) {
      logger.flush();
    }
  };

  if (global.__boyscout_logger_sinks) {
    global.__boyscout_logger_sinks.add(cleanup);
  }

  return function pinoSink(e: LogEntry) {
    // Use buffer for backpressure mitigation
    if (logBuffer && enableBackpressure) {
      logBuffer.add(e);
      return;
    }

    // Direct logging when buffer is disabled
    const level = asLevel(e.level as string);
    const { level: _drop, timestamp: _timestamp, correlationId: _correlationId, ...payload } = e;
    const l = e.correlationId ? logger.child({ cid: e.correlationId }) : logger;
    (l[level] as (...args: unknown[]) => unknown)(payload, fmt(e));
  };
}

// Utility function to clean up all registered sinks (useful for tests)
export function cleanupAllSinks(): void {
  if (global.__boyscout_logger_sinks) {
    for (const cleanup of global.__boyscout_logger_sinks) {
      try {
        cleanup();
      } catch (_error) {
        // Ignore cleanup errors
      }
    }
    global.__boyscout_logger_sinks.clear();
  }
}
