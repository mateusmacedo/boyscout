import { getCid } from '../context.js';
import type { PinoLike } from '../pino-sink.js';
import { createPinoSink, type PinoSinkOptions } from '../pino-sink.js';
import { createRedactor } from '../redact.js';
import type { LogLevel } from '../types.js';
import type { Logger, LoggerConfig } from './logger.interface.js';

/**
 * Pino-based logger implementation
 * Encapsulates the existing Pino sink functionality in a Logger interface
 */
export class PinoLogger implements Logger {
  private sink: (entry: any) => void;
  private redactor: (value: unknown) => unknown;
  private getCorrelationId: () => string | undefined;
  private currentLevel: LogLevel;
  private messageFormat: (message: string, meta?: object) => string;

  constructor(
    private pino: PinoLike,
    config: LoggerConfig = {}
  ) {
    this.currentLevel = config.level || 'info';
    this.redactor = config.redact || createRedactor();
    this.getCorrelationId = config.getCorrelationId || getCid;

    // Create the Pino sink with configuration
    const sinkOptions: PinoSinkOptions = {
      logger: this.pino,
      service: config.service,
      env: config.env,
      version: config.version,
    };

    this.sink = createPinoSink(sinkOptions);

    // Default message format
    this.messageFormat =
      config.messageFormat ||
      ((message: string, meta?: object) => {
        if (meta && Object.keys(meta).length > 0) {
          return `${message} ${JSON.stringify(meta)}`;
        }
        return message;
      });
  }

  trace(message: string, meta?: object): void {
    if (this.isLevelEnabled('trace')) {
      this.log('trace', message, meta);
    }
  }

  debug(message: string, meta?: object): void {
    if (this.isLevelEnabled('debug')) {
      this.log('debug', message, meta);
    }
  }

  info(message: string, meta?: object): void {
    if (this.isLevelEnabled('info')) {
      this.log('info', message, meta);
    }
  }

  warn(message: string, meta?: object): void {
    if (this.isLevelEnabled('warn')) {
      this.log('warn', message, meta);
    }
  }

  error(message: string, meta?: object): void {
    if (this.isLevelEnabled('error')) {
      this.log('error', message, meta);
    }
  }

  child(context: object): Logger {
    // Create a new Pino logger with additional context
    const childPino = this.pino.child(context);
    return new PinoLogger(childPino, {
      level: this.currentLevel,
      redact: this.redactor,
      getCorrelationId: this.getCorrelationId,
      messageFormat: this.messageFormat,
    });
  }

  getLevel(): LogLevel {
    return this.currentLevel;
  }

  setLevel(level: LogLevel): void {
    this.currentLevel = level;
  }

  isLevelEnabled(level: LogLevel): boolean {
    const levels: LogLevel[] = ['trace', 'debug', 'info', 'warn', 'error'];
    const currentIndex = levels.indexOf(this.currentLevel);
    const requestedIndex = levels.indexOf(level);
    return requestedIndex >= currentIndex;
  }

  private log(level: LogLevel, message: string, meta?: object): void {
    const timestamp = new Date().toISOString();
    const correlationId = this.getCorrelationId?.();

    // Redact sensitive data from metadata
    const redactedMeta = meta ? (this.redactor(meta) as object) : undefined;

    // Create log entry in the same format as the decorator
    const logEntry = {
      timestamp,
      level,
      message: this.messageFormat(message, redactedMeta),
      correlationId,
      ...(redactedMeta && { meta: redactedMeta }),
    };

    // Send to the Pino sink
    this.sink(logEntry);
  }
}

/**
 * Create a Pino logger with the specified configuration
 * @param config - Logger configuration
 * @returns A configured Pino logger instance
 */
export function createPinoLogger(config: LoggerConfig = {}): Logger {
  // Try to create a real Pino logger
  let pino: PinoLike;

  try {
    const pinoModule = require('pino');
    pino = pinoModule({
      level: config.level || 'info',
      base: {
        service: config.service || 'node-logger',
        env: config.env || process.env.NODE_ENV || 'development',
        version: config.version || '1.0.0',
      },
    });
  } catch (_error) {
    // Fallback to mock logger if Pino is not available
    pino = {
      child: () => pino,
      trace: () => undefined,
      debug: () => undefined,
      info: () => undefined,
      warn: () => undefined,
      error: () => undefined,
      fatal: () => undefined,
    };
  }

  return new PinoLogger(pino, config);
}
