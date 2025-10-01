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

// Default configuration constants
const DEFAULT_BUFFER_SIZE = 1000;
const DEFAULT_FLUSH_INTERVAL = 5000;

// Default values for PinoSinkOptions
const DEFAULT_SERVICE = 'node-logger';
const DEFAULT_VERSION = '1.0.0';
const DEFAULT_LOG_LEVEL = 'info';

// Module-level state management for better isolation
class ProcessHandlerManager {
  private static instance: ProcessHandlerManager | null = null;
  private sinks = new Set<() => void>();
  private sinkInstances = new WeakMap<object, () => void>();
  private isSetup = false;

  static getInstance(): ProcessHandlerManager {
    if (!ProcessHandlerManager.instance) {
      ProcessHandlerManager.instance = new ProcessHandlerManager();
    }
    return ProcessHandlerManager.instance;
  }

  registerSink(sinkInstance: object, cleanup: () => void): void {
    this.sinks.add(cleanup);
    this.sinkInstances.set(sinkInstance, cleanup);
    this.setupProcessHandlers();
  }

  unregisterSink(sinkInstance: object): void {
    const cleanup = this.sinkInstances.get(sinkInstance);
    if (cleanup) {
      this.sinks.delete(cleanup);
      this.sinkInstances.delete(sinkInstance);
    }
  }

  private setupProcessHandlers(): void {
    if (this.isSetup) return;

    const gracefulShutdown = () => {
      // Call cleanup for all registered sinks
      for (const cleanup of this.sinks) {
        try {
          cleanup();
        } catch (_error) {
          // Ignore cleanup errors to prevent cascading failures
        }
      }
    };

    process.on('beforeExit', gracefulShutdown);
    process.on('exit', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGQUIT', gracefulShutdown);

    this.isSetup = true;
  }

  cleanupAllSinks(): void {
    for (const cleanup of this.sinks) {
      try {
        cleanup();
      } catch (_error) {
        // Ignore cleanup errors
      }
    }
    this.sinks.clear();
  }
}

type LevelName = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
const asLevel = (lvl: string | undefined): LevelName => {
  switch ((lvl ?? DEFAULT_LOG_LEVEL).toLowerCase()) {
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
      return DEFAULT_LOG_LEVEL;
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
    maxSize: number = DEFAULT_BUFFER_SIZE,
    flushInterval: number = DEFAULT_FLUSH_INTERVAL,
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
        level: opts.loggerOptions?.level || DEFAULT_LOG_LEVEL,
        base: {
          service: opts.service || DEFAULT_SERVICE,
          env: opts.env || process.env.NODE_ENV || 'development',
          version: opts.version || DEFAULT_VERSION,
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
  // TODO: In next major version, change default to false for backward compatibility
  const {
    enableBackpressure = true,
    bufferSize = DEFAULT_BUFFER_SIZE,
    flushInterval = DEFAULT_FLUSH_INTERVAL,
  } = opts;

  // Emit deprecation warning when enableBackpressure is not explicitly set
  if (opts.enableBackpressure === undefined) {
    console.warn(
      '[boyscout-logger] DEPRECATION WARNING: enableBackpressure defaults to true. ' +
        'This may cause unexpected behavior for existing users. ' +
        'Explicitly set enableBackpressure: false to disable buffering, or enableBackpressure: true to acknowledge this behavior. ' +
        'In the next major version, the default will change to false for better backward compatibility.'
    );
  }

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

  // Get the process handler manager instance
  const manager = ProcessHandlerManager.getInstance();

  // Create a unique sink instance for this logger
  const sinkInstance = {};

  // Register this sink's cleanup function
  const cleanup = () => {
    if (logBuffer) {
      logBuffer.destroy();
    }
    if (logger.flush) {
      logger.flush();
    }
  };

  manager.registerSink(sinkInstance, cleanup);

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
  const manager = ProcessHandlerManager.getInstance();
  manager.cleanupAllSinks();
}
