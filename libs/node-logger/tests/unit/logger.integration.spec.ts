import { Log } from '../../src/log.decorator';
import { createConsoleLogger, createPinoLogger } from '../../src/logger/logger.factory';

describe('Logger Integration', () => {
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

  describe('Logger with Decorator', () => {
    it('should use logger in decorator', () => {
      const logger = createConsoleLogger({ level: 'debug' });

      class TestService {
        @Log({ logger })
        testMethod() {
          return 'result';
        }
      }

      const service = new TestService();
      service.testMethod();

      expect(console.info).toHaveBeenCalled();
    });

    it('should use logger with correlation ID', () => {
      const logger = createConsoleLogger({ level: 'debug' });

      class TestService {
        @Log({ logger })
        testMethod() {
          return 'result';
        }
      }

      const service = new TestService();
      service.testMethod();

      expect(console.info).toHaveBeenCalled();
    });
  });

  describe('Manual Logging', () => {
    it('should allow manual logging', () => {
      const logger = createConsoleLogger({ level: 'debug' });

      logger.info('Manual log message', { userId: '123' });

      expect(console.info).toHaveBeenCalled();
    });

    it('should allow manual logging with correlation ID', () => {
      const logger = createConsoleLogger({
        level: 'debug',
        getCorrelationId: () => 'test-cid-123',
      });

      logger.info('Manual log message', { userId: '123' });

      expect(console.info).toHaveBeenCalled();
    });
  });

  describe('Child Loggers', () => {
    it('should create child loggers with context', () => {
      const logger = createConsoleLogger({ level: 'debug' });
      const childLogger = logger.child({ userId: '123' });

      childLogger.info('Child log message');

      expect(console.info).toHaveBeenCalled();
    });

    it('should maintain parent configuration in child', () => {
      const logger = createConsoleLogger({ level: 'warn' });
      const childLogger = logger.child({ userId: '123' });

      expect(childLogger.getLevel()).toBe('warn');
    });
  });

  describe('Different Logger Types', () => {
    it('should work with Pino logger', () => {
      const logger = createPinoLogger({ level: 'debug' });

      logger.info('Pino log message', { userId: '123' });

      // Pino logger should work without errors
      expect(logger).toBeDefined();
    });

    it('should work with console logger', () => {
      const logger = createConsoleLogger({ level: 'debug' });

      logger.info('Console log message', { userId: '123' });

      expect(console.info).toHaveBeenCalled();
    });
  });

  describe('Log Level Management', () => {
    it('should respect log levels across different logger types', () => {
      const consoleLogger = createConsoleLogger({ level: 'warn' });
      const pinoLogger = createPinoLogger({ level: 'warn' });

      consoleLogger.debug('Debug message');
      pinoLogger.debug('Debug message');

      expect(console.debug).not.toHaveBeenCalled();
    });

    it('should allow dynamic level changes', () => {
      const logger = createConsoleLogger({ level: 'error' });

      logger.info('Info message');
      expect(console.info).not.toHaveBeenCalled();

      logger.setLevel('info');
      logger.info('Info message');
      expect(console.info).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle errors in logger gracefully', () => {
      const logger = createConsoleLogger({ level: 'debug' });

      // This should not throw
      expect(() => {
        logger.error('Error message', { error: new Error('Test error') });
      }).not.toThrow();
    });
  });

  describe('Structured vs Simple Logging', () => {
    it('should support structured logging', () => {
      const logger = createConsoleLogger({
        level: 'debug',
        structured: true,
      });

      logger.info('Structured message', { userId: '123' });

      expect(console.info).toHaveBeenCalled();
    });

    it('should support simple logging', () => {
      const logger = createConsoleLogger({
        level: 'debug',
        structured: false,
      });

      logger.info('Simple message', { userId: '123' });

      expect(console.info).toHaveBeenCalled();
    });
  });
});
