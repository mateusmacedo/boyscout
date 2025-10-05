import { Logger, LoggerConfig } from '../../src/logger/logger.interface';

describe('Logger Interface', () => {
  describe('Logger interface', () => {
    it('should define required methods', () => {
      // This test ensures the interface is properly defined
      const mockLogger: Logger = {
        trace: jest.fn(),
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        child: jest.fn().mockReturnThis(),
        getLevel: jest.fn().mockReturnValue('info'),
        setLevel: jest.fn(),
        isLevelEnabled: jest.fn().mockReturnValue(true),
      };

      expect(typeof mockLogger.trace).toBe('function');
      expect(typeof mockLogger.debug).toBe('function');
      expect(typeof mockLogger.info).toBe('function');
      expect(typeof mockLogger.warn).toBe('function');
      expect(typeof mockLogger.error).toBe('function');
      expect(typeof mockLogger.child).toBe('function');
      expect(typeof mockLogger.getLevel).toBe('function');
      expect(typeof mockLogger.setLevel).toBe('function');
      expect(typeof mockLogger.isLevelEnabled).toBe('function');
    });
  });

  describe('LoggerConfig interface', () => {
    it('should define optional configuration properties', () => {
      const config: LoggerConfig = {
        level: 'debug',
        service: 'test-service',
        env: 'test',
        version: '1.0.0',
        redact: jest.fn(),
        getCorrelationId: jest.fn(),
        structured: true,
        messageFormat: jest.fn(),
      };

      expect(config.level).toBe('debug');
      expect(config.service).toBe('test-service');
      expect(config.env).toBe('test');
      expect(config.version).toBe('1.0.0');
      expect(typeof config.redact).toBe('function');
      expect(typeof config.getCorrelationId).toBe('function');
      expect(config.structured).toBe(true);
      expect(typeof config.messageFormat).toBe('function');
    });
  });
});
