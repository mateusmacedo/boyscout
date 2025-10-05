import {
  createConsoleLogger,
  createDevelopmentLogger,
  createLogger,
  createPinoLogger,
  createProductionLogger,
  createTestLogger,
} from '../../src/logger/logger.factory';
import { LoggerConfig } from '../../src/logger/logger.interface';

describe('Logger Factory', () => {
  let mockConsole: jest.SpyInstance;

  beforeEach(() => {
    mockConsole = jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'info').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(console, 'debug').mockImplementation();
    jest.spyOn(console, 'trace').mockImplementation();
  });

  afterEach(() => {
    mockConsole.mockRestore();
    jest.restoreAllMocks();
  });

  describe('createLogger', () => {
    it('should create a logger with default configuration', () => {
      const logger = createLogger();

      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.child).toBe('function');
    });

    it('should create a logger with custom configuration', () => {
      const config: LoggerConfig = {
        level: 'debug',
        service: 'test-service',
        env: 'test',
        version: '1.0.0',
      };

      const logger = createLogger(config);

      expect(logger).toBeDefined();
      expect(logger.getLevel()).toBe('debug');
    });
  });

  describe('createPinoLogger', () => {
    it('should create a Pino logger', () => {
      const logger = createPinoLogger();

      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.error).toBe('function');
    });

    it('should create a Pino logger with configuration', () => {
      const config: LoggerConfig = {
        level: 'warn',
        service: 'pino-service',
      };

      const logger = createPinoLogger(config);

      expect(logger).toBeDefined();
      expect(logger.getLevel()).toBe('warn');
    });
  });

  describe('createConsoleLogger', () => {
    it('should create a console logger', () => {
      const logger = createConsoleLogger();

      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.error).toBe('function');
    });

    it('should create a console logger with configuration', () => {
      const config: LoggerConfig = {
        level: 'debug',
        structured: false,
      };

      const logger = createConsoleLogger(config);

      expect(logger).toBeDefined();
      expect(logger.getLevel()).toBe('debug');
    });
  });

  describe('createDevelopmentLogger', () => {
    it('should create a development logger', () => {
      const logger = createDevelopmentLogger();

      expect(logger).toBeDefined();
      expect(logger.getLevel()).toBe('debug');
    });

    it('should create a development logger with custom config', () => {
      const config: LoggerConfig = {
        service: 'dev-service',
      };

      const logger = createDevelopmentLogger(config);

      expect(logger).toBeDefined();
      expect(logger.getLevel()).toBe('debug');
    });
  });

  describe('createProductionLogger', () => {
    it('should create a production logger', () => {
      const logger = createProductionLogger();

      expect(logger).toBeDefined();
      expect(logger.getLevel()).toBe('info');
    });

    it('should create a production logger with custom config', () => {
      const config: LoggerConfig = {
        service: 'prod-service',
        level: 'warn',
      };

      const logger = createProductionLogger(config);

      expect(logger).toBeDefined();
      expect(logger.getLevel()).toBe('warn');
    });
  });

  describe('createTestLogger', () => {
    it('should create a test logger', () => {
      const logger = createTestLogger();

      expect(logger).toBeDefined();
      expect(logger.getLevel()).toBe('error');
    });

    it('should create a test logger with custom config', () => {
      const config: LoggerConfig = {
        service: 'test-service',
        level: 'debug',
      };

      const logger = createTestLogger(config);

      expect(logger).toBeDefined();
      expect(logger.getLevel()).toBe('debug');
    });
  });

  describe('logger functionality', () => {
    it('should log messages at different levels', () => {
      const logger = createConsoleLogger({ level: 'trace' });

      logger.trace('trace message');
      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');

      expect(console.trace).toHaveBeenCalled();
      expect(console.debug).toHaveBeenCalled();
      expect(console.info).toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });

    it('should respect log levels', () => {
      const logger = createConsoleLogger({ level: 'warn' });

      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');

      expect(console.debug).not.toHaveBeenCalled();
      expect(console.info).not.toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });

    it('should create child loggers with context', () => {
      const logger = createConsoleLogger();
      const childLogger = logger.child({ userId: '123' });

      expect(childLogger).toBeDefined();
      expect(childLogger).not.toBe(logger);
    });

    it('should set and get log levels', () => {
      const logger = createConsoleLogger();

      expect(logger.getLevel()).toBe('info');

      logger.setLevel('debug');
      expect(logger.getLevel()).toBe('debug');

      logger.setLevel('error');
      expect(logger.getLevel()).toBe('error');
    });

    it('should check if levels are enabled', () => {
      const logger = createConsoleLogger({ level: 'warn' });

      expect(logger.isLevelEnabled('trace')).toBe(false);
      expect(logger.isLevelEnabled('debug')).toBe(false);
      expect(logger.isLevelEnabled('info')).toBe(false);
      expect(logger.isLevelEnabled('warn')).toBe(true);
      expect(logger.isLevelEnabled('error')).toBe(true);
    });
  });
});
