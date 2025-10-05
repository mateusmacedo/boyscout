import { getCid } from '../context.js';
import { createRedactor } from '../redact.js';
import type { LogLevel } from '../types.js';
import type { Logger, LoggerConfig } from './logger.interface.js';

/**
 * Console-based logger implementation
 * Provides a simple console output for development and testing
 */
export class ConsoleLogger implements Logger {
  private redactor: (value: unknown) => unknown;
  private getCorrelationId: () => string | undefined;
  private currentLevel: LogLevel;
  private messageFormat: (message: string, meta?: object) => string;
  private structured: boolean;

  constructor(config: LoggerConfig = {}) {
    this.currentLevel = config.level || 'info';
    this.redactor = config.redact || createRedactor();
    this.getCorrelationId = config.getCorrelationId || getCid;
    this.structured = config.structured ?? true;

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

  child(_context: object): Logger {
    // Create a new console logger with additional context
    return new ConsoleLogger({
      level: this.currentLevel,
      redact: this.redactor,
      getCorrelationId: this.getCorrelationId,
      messageFormat: this.messageFormat,
      structured: this.structured,
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

    if (this.structured) {
      // Structured logging (JSON format)
      const logEntry = {
        timestamp,
        level,
        message: this.messageFormat(message, redactedMeta),
        correlationId,
        ...(redactedMeta && { meta: redactedMeta }),
      };

      // Use appropriate console method based on level
      const consoleMethod = this.getConsoleMethod(level);
      consoleMethod(JSON.stringify(logEntry, null, 2));
    } else {
      // Simple logging (human-readable format)
      const formattedMessage = this.messageFormat(message, redactedMeta);
      const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
      const correlationPrefix = correlationId ? ` [${correlationId}]` : '';

      const consoleMethod = this.getConsoleMethod(level);
      consoleMethod(`${prefix}${correlationPrefix} ${formattedMessage}`);
    }
  }

  private getConsoleMethod(level: LogLevel): (...args: any[]) => void {
    switch (level) {
      case 'trace':
        return console.trace;
      case 'debug':
        return console.debug;
      case 'info':
        return console.info;
      case 'warn':
        return console.warn;
      case 'error':
        return console.error;
      default:
        return console.log;
    }
  }
}

/**
 * Create a console logger with the specified configuration
 * @param config - Logger configuration
 * @returns A configured console logger instance
 */
export function createConsoleLogger(config: LoggerConfig = {}): Logger {
  return new ConsoleLogger(config);
}
