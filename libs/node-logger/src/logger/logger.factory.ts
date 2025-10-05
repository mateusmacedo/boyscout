import { createConsoleLogger as createConsoleLoggerImpl } from './console.logger.js';
import type { Logger, LoggerConfig, LoggerFactory } from './logger.interface.js';
import { createPinoLogger as createPinoLoggerImpl } from './pino.logger.js';

/**
 * Logger factory implementation
 * Provides methods to create different types of loggers
 */
export class LoggerFactoryImpl implements LoggerFactory {
  /**
   * Create a logger instance based on configuration
   * @param config - Logger configuration
   * @returns A configured logger instance
   */
  createLogger(config: LoggerConfig = {}): Logger {
    // Determine logger type based on configuration or environment
    const loggerType = this.determineLoggerType(config);

    switch (loggerType) {
      case 'pino':
        return createPinoLoggerImpl(config);
      case 'console':
        return createConsoleLoggerImpl(config);
      default:
        return createConsoleLoggerImpl(config);
    }
  }

  /**
   * Create a Pino logger specifically
   * @param config - Logger configuration
   * @returns A configured Pino logger instance
   */
  createPinoLogger(config: LoggerConfig = {}): Logger {
    return createPinoLoggerImpl(config);
  }

  /**
   * Create a console logger specifically
   * @param config - Logger configuration
   * @returns A configured console logger instance
   */
  createConsoleLogger(config: LoggerConfig = {}): Logger {
    return createConsoleLoggerImpl(config);
  }

  /**
   * Create a logger for development environment
   * @param config - Logger configuration
   * @returns A development-optimized logger
   */
  createDevelopmentLogger(_config: LoggerConfig = {}): Logger {
    return createConsoleLoggerImpl({
      structured: false, // Human-readable format for development
      level: 'debug',
    });
  }

  /**
   * Create a logger for production environment
   * @param config - Logger configuration
   * @returns A production-optimized logger
   */
  createProductionLogger(config: LoggerConfig = {}): Logger {
    return createPinoLoggerImpl({
      ...config,
      structured: true, // JSON format for production
      level: config.level || 'info',
    });
  }

  /**
   * Create a logger for testing
   * @param config - Logger configuration
   * @returns A test-optimized logger
   */
  createTestLogger(config: LoggerConfig = {}): Logger {
    return createConsoleLoggerImpl({
      structured: false, // Simple format for tests
      level: config.level || 'error', // Only show errors by default
    });
  }

  private determineLoggerType(_config: LoggerConfig): 'pino' | 'console' {
    // Check if Pino is available
    try {
      require('pino');
      return 'pino';
    } catch {
      return 'console';
    }
  }
}

// Create a singleton instance
const loggerFactory = new LoggerFactoryImpl();

/**
 * Create a logger instance
 * @param config - Logger configuration
 * @returns A configured logger instance
 */
export function createLogger(config: LoggerConfig = {}): Logger {
  return loggerFactory.createLogger(config);
}

/**
 * Create a Pino logger specifically
 * @param config - Logger configuration
 * @returns A configured Pino logger instance
 */
export function createPinoLogger(config: LoggerConfig = {}): Logger {
  return loggerFactory.createPinoLogger(config);
}

/**
 * Create a console logger specifically
 * @param config - Logger configuration
 * @returns A configured console logger instance
 */
export function createConsoleLogger(config: LoggerConfig = {}): Logger {
  return loggerFactory.createConsoleLogger(config);
}

/**
 * Create a logger for development environment
 * @param config - Logger configuration
 * @returns A development-optimized logger
 */
export function createDevelopmentLogger(config: LoggerConfig = {}): Logger {
  return loggerFactory.createDevelopmentLogger(config);
}

/**
 * Create a logger for production environment
 * @param config - Logger configuration
 * @returns A production-optimized logger
 */
export function createProductionLogger(config: LoggerConfig = {}): Logger {
  return loggerFactory.createProductionLogger(config);
}

/**
 * Create a logger for testing
 * @param config - Logger configuration
 * @returns A test-optimized logger
 */
export function createTestLogger(config: LoggerConfig = {}): Logger {
  return loggerFactory.createTestLogger(config);
}

// Export the factory instance
export { loggerFactory };
