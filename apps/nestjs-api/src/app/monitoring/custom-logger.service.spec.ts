import { Test, type TestingModule } from '@nestjs/testing';
import { CustomLoggerService } from './custom-logger.service';

// Mock the @Log decorator before importing the service
jest.mock('@boyscout/node-logger', () => ({
  Log: jest.fn().mockReturnValue(() => {}),
  CorrelationIdMiddleware: jest.fn(),
}));

describe('CustomLoggerService', () => {
  let service: CustomLoggerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CustomLoggerService],
    }).compile();

    service = module.get<CustomLoggerService>(CustomLoggerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('logBusinessEvent', () => {
    it('should log business event successfully', () => {
      const event = 'user_registration';
      const data = { userId: '123', email: 'user@example.com' };

      const result = service.logBusinessEvent(event, data);

      expect(result).toHaveProperty('logged', true);
      expect(result).toHaveProperty('event', event);
      expect(result).toHaveProperty('timestamp');
      expect(result.timestamp).toBeInstanceOf(Date);

      // Check that log was added to buffer
      const logBuffer = (
        service as unknown as {
          logBuffer: Array<{
            level: string;
            message: string;
            timestamp: Date;
            context?: Record<string, unknown>;
          }>;
        }
      ).logBuffer;
      expect(logBuffer).toHaveLength(1);
      expect(logBuffer[0].level).toBe('info');
      expect(logBuffer[0].message).toBe(`Business Event: ${event}`);
      expect(logBuffer[0].context.event).toBe(event);
      expect(logBuffer[0].context.data).toEqual(data);
      expect(logBuffer[0].context.service).toBe('business-logger');
    });

    it('should log business event without data', () => {
      const event = 'page_view';

      const result = service.logBusinessEvent(event);

      expect(result.logged).toBe(true);
      expect(result.event).toBe(event);

      const logBuffer = (
        service as unknown as {
          logBuffer: Array<{
            level: string;
            message: string;
            timestamp: Date;
            context?: Record<string, unknown>;
          }>;
        }
      ).logBuffer;
      expect(logBuffer[0].context.data).toBeUndefined();
    });
  });

  describe('logSecurityEvent', () => {
    it('should log security event successfully', () => {
      const event = 'failed_login_attempt';
      const details = { ip: '192.168.1.1', userAgent: 'Mozilla/5.0' };

      const result = service.logSecurityEvent(event, details);

      expect(result).toHaveProperty('logged', true);
      expect(result).toHaveProperty('event', event);
      expect(result).toHaveProperty('timestamp');
      expect(result.timestamp).toBeInstanceOf(Date);

      const logBuffer = (
        service as unknown as {
          logBuffer: Array<{
            level: string;
            message: string;
            timestamp: Date;
            context?: Record<string, unknown>;
          }>;
        }
      ).logBuffer;
      expect(logBuffer[0].level).toBe('warn');
      expect(logBuffer[0].message).toBe(`Security Event: ${event}`);
      expect(logBuffer[0].context.event).toBe(event);
      expect(logBuffer[0].context.details).toEqual(details);
      expect(logBuffer[0].context.service).toBe('security-logger');
      expect(logBuffer[0].context.severity).toBe('high');
    });
  });

  describe('logSystemError', () => {
    it('should log system error successfully', () => {
      const error = new Error('Database connection failed');
      error.name = 'DatabaseError';
      error.stack = 'Error: Database connection failed\n    at connect()';
      const context = { userId: '123', operation: 'createUser' };

      const result = service.logSystemError(error, context);

      expect(result).toHaveProperty('logged', true);
      expect(result).toHaveProperty('error', 'DatabaseError');
      expect(result).toHaveProperty('timestamp');
      expect(result.timestamp).toBeInstanceOf(Date);

      const logBuffer = (
        service as unknown as {
          logBuffer: Array<{
            level: string;
            message: string;
            timestamp: Date;
            context?: Record<string, unknown>;
          }>;
        }
      ).logBuffer;
      expect(logBuffer[0].level).toBe('error');
      expect(logBuffer[0].message).toBe(`System Error: ${error.message}`);
      expect(logBuffer[0].context.error.name).toBe('DatabaseError');
      expect(logBuffer[0].context.error.message).toBe('Database connection failed');
      expect(logBuffer[0].context.error.stack).toBe(error.stack);
      expect(logBuffer[0].context.service).toBe('system-logger');
      expect(logBuffer[0].context.userId).toBe('123');
      expect(logBuffer[0].context.operation).toBe('createUser');
    });

    it('should log system error without context', () => {
      const error = new Error('Unexpected error');

      const result = service.logSystemError(error);

      expect(result.logged).toBe(true);
      expect(result.error).toBe('Error');

      const logBuffer = (
        service as unknown as {
          logBuffer: Array<{
            level: string;
            message: string;
            timestamp: Date;
            context?: Record<string, unknown>;
          }>;
        }
      ).logBuffer;
      expect(logBuffer[0].context.service).toBe('system-logger');
    });
  });

  describe('logPerformanceMetric', () => {
    it('should log performance metric successfully', () => {
      const metric = 'response_time';
      const value = 150;
      const unit = 'ms';

      const result = service.logPerformanceMetric(metric, value, unit);

      expect(result).toHaveProperty('logged', true);
      expect(result).toHaveProperty('metric', metric);
      expect(result).toHaveProperty('value', value);
      expect(result).toHaveProperty('unit', unit);
      expect(result).toHaveProperty('timestamp');
      expect(result.timestamp).toBeInstanceOf(Date);

      const logBuffer = (
        service as unknown as {
          logBuffer: Array<{
            level: string;
            message: string;
            timestamp: Date;
            context?: Record<string, unknown>;
          }>;
        }
      ).logBuffer;
      expect(logBuffer[0].level).toBe('debug');
      expect(logBuffer[0].message).toBe(`Performance Metric: ${metric}`);
      expect(logBuffer[0].context.metric).toBe(metric);
      expect(logBuffer[0].context.value).toBe(value);
      expect(logBuffer[0].context.unit).toBe(unit);
      expect(logBuffer[0].context.service).toBe('performance-logger');
    });

    it('should log performance metric with default unit', () => {
      const metric = 'cpu_usage';
      const value = 75.5;

      const result = service.logPerformanceMetric(metric, value);

      expect(result.unit).toBe('ms');

      const logBuffer = (
        service as unknown as {
          logBuffer: Array<{
            level: string;
            message: string;
            timestamp: Date;
            context?: Record<string, unknown>;
          }>;
        }
      ).logBuffer;
      expect(logBuffer[0].context.unit).toBe('ms');
    });
  });

  describe('getLogSummary', () => {
    beforeEach(() => {
      // Add some test logs
      service.logBusinessEvent('event1');
      service.logSecurityEvent('event2');
      service.logSystemError(new Error('test error'));
      service.logPerformanceMetric('metric1', 100);
    });

    it('should return log summary with correct structure', () => {
      const result = service.getLogSummary();

      expect(result).toHaveProperty('totalLogs');
      expect(result).toHaveProperty('recentLogs');
      expect(result).toHaveProperty('logsByLevel');
      expect(result).toHaveProperty('bufferSize');
      expect(result).toHaveProperty('maxBufferSize');
      expect(result).toHaveProperty('oldestLog');
      expect(result).toHaveProperty('newestLog');

      expect(result.totalLogs).toBe(4);
      expect(result.bufferSize).toBe(4);
      expect(result.maxBufferSize).toBe(1000);
      expect(result.logsByLevel).toHaveProperty('info');
      expect(result.logsByLevel).toHaveProperty('warn');
      expect(result.logsByLevel).toHaveProperty('error');
      expect(result.logsByLevel).toHaveProperty('debug');
    });

    it('should calculate recent logs correctly', () => {
      const result = service.getLogSummary();

      // All logs should be recent (created in the last hour)
      expect(result.recentLogs).toBe(4);
    });

    it('should count logs by level correctly', () => {
      const result = service.getLogSummary();

      expect(result.logsByLevel.info).toBe(1); // business event
      expect(result.logsByLevel.warn).toBe(1); // security event
      expect(result.logsByLevel.error).toBe(1); // system error
      expect(result.logsByLevel.debug).toBe(1); // performance metric
    });
  });

  describe('clearOldLogs', () => {
    beforeEach(() => {
      // Add logs with different timestamps
      service.logBusinessEvent('recent_event');
      service.logSecurityEvent('old_event');

      // Manually set timestamps for testing
      const logBuffer = (
        service as unknown as {
          logBuffer: Array<{
            level: string;
            message: string;
            timestamp: Date;
            context?: Record<string, unknown>;
          }>;
        }
      ).logBuffer;
      const now = new Date();
      logBuffer[0].timestamp = new Date(now.getTime() - 30 * 60 * 1000); // 30 minutes ago
      logBuffer[1].timestamp = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 hours ago
    });

    it('should clear logs older than specified hours', () => {
      const result = service.clearOldLogs(1); // 1 hour

      expect(result).toHaveProperty('removedLogs');
      expect(result).toHaveProperty('remainingLogs');
      expect(result).toHaveProperty('cutoffTime');
      expect(result.removedLogs).toBe(1); // Only the 2-hour-old log
      expect(result.remainingLogs).toBe(1); // The 30-minute-old log remains
    });

    it('should use default 24 hours when no parameter provided', () => {
      const result = service.clearOldLogs();

      expect(result.removedLogs).toBe(0); // Both logs are within 24 hours
      expect(result.remainingLogs).toBe(2);
    });

    it('should not remove any logs when cutoff is very old', () => {
      const result = service.clearOldLogs(48); // 48 hours

      expect(result.removedLogs).toBe(0);
      expect(result.remainingLogs).toBe(2);
    });
  });

  describe('getLogsByLevel', () => {
    it('should return logs filtered by level', () => {
      // Add logs of different levels
      service.logBusinessEvent('info_event');
      service.logSecurityEvent('warn_event');
      service.logSystemError(new Error('error_event'));
      service.logPerformanceMetric('debug_metric', 100);

      const result = service.getLogsByLevel('info', 10);

      expect(result).toHaveProperty('level', 'info');
      expect(result).toHaveProperty('count');
      expect(result).toHaveProperty('logs');
      expect(Array.isArray(result.logs)).toBe(true);
      expect(result.count).toBe(1);
      expect(result.logs[0].message).toBe('Business Event: info_event');
    });

    it('should return logs with default limit', () => {
      service.logSystemError(new Error('error_event'));

      const result = service.getLogsByLevel('error');

      expect(result.level).toBe('error');
      expect(result.count).toBe(1);
      expect(result.logs).toHaveLength(1);
    });

    it('should return empty array when no logs of specified level', () => {
      const result = service.getLogsByLevel('trace', 10);

      expect(result.level).toBe('trace');
      expect(result.count).toBe(0);
      expect(result.logs).toHaveLength(0);
    });

    it('should limit results to specified limit', () => {
      // Add multiple logs of same level
      service.logBusinessEvent('info_event1');
      service.logBusinessEvent('info_event2');
      service.logBusinessEvent('info_event3');

      const result = service.getLogsByLevel('info', 2);

      expect(result.count).toBe(2); // Limited count
      expect(result.logs).toHaveLength(2); // Limited results
    });

    it('should return logs in reverse chronological order', () => {
      service.logBusinessEvent('info_event1');
      service.logBusinessEvent('info_event2');
      service.logBusinessEvent('info_event3');

      const result = service.getLogsByLevel('info', 10);

      // Should be ordered by most recent first
      expect(result.logs[0].message).toBe('Business Event: info_event3');
      expect(result.logs[1].message).toBe('Business Event: info_event2');
      expect(result.logs[2].message).toBe('Business Event: info_event1');
    });
  });

  describe('buffer management', () => {
    it('should maintain buffer within max size', () => {
      const maxBufferSize = (service as unknown as { maxBufferSize: number }).maxBufferSize;

      // Add more logs than max buffer size
      for (let i = 0; i < maxBufferSize + 10; i++) {
        service.logBusinessEvent(`event_${i}`);
      }

      const logBuffer = (
        service as unknown as {
          logBuffer: Array<{
            level: string;
            message: string;
            timestamp: Date;
            context?: Record<string, unknown>;
          }>;
        }
      ).logBuffer;
      expect(logBuffer.length).toBe(maxBufferSize);
    });

    it('should keep most recent logs when buffer is full', () => {
      const maxBufferSize = (service as unknown as { maxBufferSize: number }).maxBufferSize;

      // Fill buffer
      for (let i = 0; i < maxBufferSize; i++) {
        service.logBusinessEvent(`event_${i}`);
      }

      // Add one more log
      service.logBusinessEvent('newest_event');

      const logBuffer = (
        service as unknown as {
          logBuffer: Array<{
            level: string;
            message: string;
            timestamp: Date;
            context?: Record<string, unknown>;
          }>;
        }
      ).logBuffer;
      expect(logBuffer.length).toBe(maxBufferSize);
      expect(logBuffer[logBuffer.length - 1].message).toBe('Business Event: newest_event');
    });
  });
});
