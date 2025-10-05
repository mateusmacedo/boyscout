import type { LogLevel } from '../types.js';

/**
 * Base interface for all logger implementations
 * Provides a consistent API for logging across different backends
 */
export interface Logger {
  /**
   * Log a trace level message
   * @param message - The message to log
   * @param meta - Optional metadata object
   */
  trace(message: string, meta?: object): void;

  /**
   * Log a debug level message
   * @param message - The message to log
   * @param meta - Optional metadata object
   */
  debug(message: string, meta?: object): void;

  /**
   * Log an info level message
   * @param message - The message to log
   * @param meta - Optional metadata object
   */
  info(message: string, meta?: object): void;

  /**
   * Log a warn level message
   * @param message - The message to log
   * @param meta - Optional metadata object
   */
  warn(message: string, meta?: object): void;

  /**
   * Log an error level message
   * @param message - The message to log
   * @param meta - Optional metadata object
   */
  error(message: string, meta?: object): void;

  /**
   * Create a child logger with additional context
   * @param context - Additional context to include in all logs
   * @returns A new logger instance with the additional context
   */
  child(context: object): Logger;

  /**
   * Get the current log level
   * @returns The current log level
   */
  getLevel(): LogLevel;

  /**
   * Set the log level
   * @param level - The new log level
   */
  setLevel(level: LogLevel): void;

  /**
   * Check if a log level is enabled
   * @param level - The level to check
   * @returns True if the level is enabled
   */
  isLevelEnabled(level: LogLevel): boolean;
}

/**
 * Configuration options for logger creation
 */
export interface LoggerConfig {
  /** The log level to use */
  level?: LogLevel;
  /** The service name */
  service?: string;
  /** The environment */
  env?: string;
  /** The service version */
  version?: string;
  /** Custom redactor function */
  redact?: (value: unknown) => unknown;
  /** Function to get correlation ID */
  getCorrelationId?: () => string | undefined;
  /** Enable structured logging */
  structured?: boolean;
  /** Custom message format function */
  messageFormat?: (message: string, meta?: object) => string;
}

/**
 * Logger factory interface for creating logger instances
 */
export interface LoggerFactory {
  /**
   * Create a logger instance
   * @param config - Configuration options
   * @returns A configured logger instance
   */
  createLogger(config?: LoggerConfig): Logger;
}
