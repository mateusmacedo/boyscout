import { HttpException } from '@nestjs/common';
import { CustomLoggerController } from './custom-logger.controller';
import type { CustomLoggerService } from './custom-logger.service';

// Mock the @Log decorator before importing the controller
jest.mock('@boyscout/node-logger', () => ({
  Log: jest.fn().mockReturnValue(() => {}),
  CorrelationIdMiddleware: jest.fn(),
}));

describe('CustomLoggerController', () => {
  let controller: CustomLoggerController;
  let service: CustomLoggerService;

  beforeEach(() => {
    // Create mock service
    service = {
      logBusinessEvent: jest.fn(),
      logSecurityEvent: jest.fn(),
      logSystemError: jest.fn(),
      logPerformanceMetric: jest.fn(),
      getLogSummary: jest.fn(),
      getLogsByLevel: jest.fn(),
      clearOldLogs: jest.fn(),
    } as unknown as CustomLoggerService;

    // Create controller instance manually
    controller = new CustomLoggerController(service);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('logBusinessEvent', () => {
    it('should log business event successfully', () => {
      const eventData = {
        event: 'user_registration',
        data: { userId: '123', email: 'user@example.com' },
      };

      const expectedResult = {
        logged: true,
        event: 'user_registration',
        timestamp: new Date('2023-01-01T00:00:00Z'),
      };

      jest.spyOn(service, 'logBusinessEvent').mockReturnValue(expectedResult);

      const result = controller.logBusinessEvent(eventData);

      expect(service.logBusinessEvent).toHaveBeenCalledWith(eventData.event, eventData.data);
      expect(result).toEqual(expectedResult);
    });

    it('should throw HttpException when service throws error', () => {
      const eventData = {
        event: 'user_registration',
        data: { userId: '123' },
      };

      const error = new Error('Service error');
      jest.spyOn(service, 'logBusinessEvent').mockImplementation(() => {
        throw error;
      });

      expect(() => controller.logBusinessEvent(eventData)).toThrow(HttpException);
      expect(() => controller.logBusinessEvent(eventData)).toThrow('Failed to log business event');
    });
  });

  describe('logSecurityEvent', () => {
    it('should log security event successfully', () => {
      const eventData = {
        event: 'failed_login_attempt',
        details: { ip: '192.168.1.1', userAgent: 'Mozilla/5.0' },
      };

      const expectedResult = {
        logged: true,
        event: 'failed_login_attempt',
        timestamp: new Date('2023-01-01T00:00:00Z'),
      };

      jest.spyOn(service, 'logSecurityEvent').mockReturnValue(expectedResult);

      const result = controller.logSecurityEvent(eventData);

      expect(service.logSecurityEvent).toHaveBeenCalledWith(eventData.event, eventData.details);
      expect(result).toEqual(expectedResult);
    });

    it('should throw HttpException when service throws error', () => {
      const eventData = {
        event: 'failed_login_attempt',
        details: { ip: '192.168.1.1' },
      };

      const error = new Error('Service error');
      jest.spyOn(service, 'logSecurityEvent').mockImplementation(() => {
        throw error;
      });

      expect(() => controller.logSecurityEvent(eventData)).toThrow(HttpException);
      expect(() => controller.logSecurityEvent(eventData)).toThrow('Failed to log security event');
    });
  });

  describe('logSystemError', () => {
    it('should log system error successfully', () => {
      const errorData = {
        error: {
          name: 'ValidationError',
          message: 'Invalid input provided',
          stack: 'Error: Invalid input provided\n    at validateInput',
        },
        context: { userId: '123', operation: 'createUser' },
      };

      const expectedResult = {
        logged: true,
        error: 'ValidationError',
        timestamp: new Date('2023-01-01T00:00:00Z'),
      };

      jest.spyOn(service, 'logSystemError').mockReturnValue(expectedResult);

      const result = controller.logSystemError(errorData);

      expect(service.logSystemError).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'ValidationError',
          message: 'Invalid input provided',
          stack: expect.stringContaining('Error: Invalid input provided'),
        }),
        errorData.context
      );
      expect(result).toEqual(expectedResult);
    });

    it('should log system error without stack trace', () => {
      const errorData = {
        error: {
          name: 'TypeError',
          message: 'Cannot read property of undefined',
        },
        context: { operation: 'processData' },
      };

      const expectedResult = {
        logged: true,
        error: 'TypeError',
        timestamp: new Date('2023-01-01T00:00:00Z'),
      };

      jest.spyOn(service, 'logSystemError').mockReturnValue(expectedResult);

      const result = controller.logSystemError(errorData);

      expect(service.logSystemError).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'TypeError',
          message: 'Cannot read property of undefined',
        }),
        errorData.context
      );
      expect(result).toEqual(expectedResult);
    });

    it('should throw HttpException when service throws error', () => {
      const errorData = {
        error: {
          name: 'Error',
          message: 'Test error',
        },
      };

      const error = new Error('Service error');
      jest.spyOn(service, 'logSystemError').mockImplementation(() => {
        throw error;
      });

      expect(() => controller.logSystemError(errorData)).toThrow(HttpException);
      expect(() => controller.logSystemError(errorData)).toThrow('Failed to log system error');
    });
  });

  describe('logPerformanceMetric', () => {
    it('should log performance metric successfully', () => {
      const metricData = {
        metric: 'response_time',
        value: 150,
        unit: 'ms',
      };

      const expectedResult = {
        logged: true,
        metric: 'response_time',
        value: 150,
        unit: 'ms',
        timestamp: new Date('2023-01-01T00:00:00Z'),
      };

      jest.spyOn(service, 'logPerformanceMetric').mockReturnValue(expectedResult);

      const result = controller.logPerformanceMetric(metricData);

      expect(service.logPerformanceMetric).toHaveBeenCalledWith(
        metricData.metric,
        metricData.value,
        metricData.unit
      );
      expect(result).toEqual(expectedResult);
    });

    it('should log performance metric with default unit', () => {
      const metricData = {
        metric: 'cpu_usage',
        value: 75.5,
      };

      const expectedResult = {
        logged: true,
        metric: 'cpu_usage',
        value: 75.5,
        unit: 'ms',
        timestamp: new Date('2023-01-01T00:00:00Z'),
      };

      jest.spyOn(service, 'logPerformanceMetric').mockReturnValue(expectedResult);

      const result = controller.logPerformanceMetric(metricData);

      expect(service.logPerformanceMetric).toHaveBeenCalledWith(
        metricData.metric,
        metricData.value,
        undefined
      );
      expect(result).toEqual(expectedResult);
    });

    it('should throw HttpException when service throws error', () => {
      const metricData = {
        metric: 'response_time',
        value: 150,
      };

      const error = new Error('Service error');
      jest.spyOn(service, 'logPerformanceMetric').mockImplementation(() => {
        throw error;
      });

      expect(() => controller.logPerformanceMetric(metricData)).toThrow(HttpException);
      expect(() => controller.logPerformanceMetric(metricData)).toThrow(
        'Failed to log performance metric'
      );
    });
  });

  describe('getLogSummary', () => {
    it('should return log summary successfully', () => {
      const expectedSummary = {
        totalLogs: 100,
        recentLogs: 25,
        logsByLevel: { info: 50, warn: 30, error: 20 },
        bufferSize: 100,
        maxBufferSize: 1000,
        oldestLog: new Date('2023-01-01T00:00:00Z'),
        newestLog: new Date('2023-01-01T12:00:00Z'),
      };

      jest.spyOn(service, 'getLogSummary').mockReturnValue(expectedSummary);

      const result = controller.getLogSummary();

      expect(service.getLogSummary).toHaveBeenCalled();
      expect(result).toEqual(expectedSummary);
    });

    it('should throw HttpException when service throws error', () => {
      const error = new Error('Service error');
      jest.spyOn(service, 'getLogSummary').mockImplementation(() => {
        throw error;
      });

      expect(() => controller.getLogSummary()).toThrow(HttpException);
      expect(() => controller.getLogSummary()).toThrow('Failed to get log summary');
    });
  });

  describe('getLogsByLevel', () => {
    it('should return logs by level successfully', () => {
      const query = { level: 'error', limit: '50' };
      const expectedLogs = {
        level: 'error',
        count: 10,
        logs: [
          {
            message: 'System Error: Database connection failed',
            timestamp: new Date('2023-01-01T00:00:00Z'),
            context: { error: { name: 'DatabaseError', message: 'Connection failed' } },
          },
        ],
      };

      jest.spyOn(service, 'getLogsByLevel').mockReturnValue(expectedLogs);

      const result = controller.getLogsByLevel(query.level, query.limit);

      expect(service.getLogsByLevel).toHaveBeenCalledWith('error', 50);
      expect(result).toEqual(expectedLogs);
    });

    it('should use default limit when not provided', () => {
      const query = { level: 'info' };
      const expectedLogs = {
        level: 'info',
        count: 25,
        logs: [],
      };

      jest.spyOn(service, 'getLogsByLevel').mockReturnValue(expectedLogs);

      const result = controller.getLogsByLevel(query.level);

      expect(service.getLogsByLevel).toHaveBeenCalledWith('info', 100);
      expect(result).toEqual(expectedLogs);
    });

    it('should throw HttpException when level is missing', () => {
      expect(() => controller.getLogsByLevel('')).toThrow(HttpException);
      expect(() => controller.getLogsByLevel('')).toThrow('Level parameter is required');
    });

    it('should throw HttpException when service throws error', () => {
      const error = new Error('Service error');
      jest.spyOn(service, 'getLogsByLevel').mockImplementation(() => {
        throw error;
      });

      expect(() => controller.getLogsByLevel('error')).toThrow(HttpException);
      expect(() => controller.getLogsByLevel('error')).toThrow('Failed to get logs');
    });
  });

  describe('clearOldLogs', () => {
    it('should clear old logs with default hours', () => {
      const cleanupData = {};
      const expectedResult = {
        removedLogs: 50,
        remainingLogs: 100,
        cutoffTime: new Date(),
      };

      jest.spyOn(service, 'clearOldLogs').mockReturnValue(expectedResult);

      const result = controller.clearOldLogs(cleanupData);

      expect(service.clearOldLogs).toHaveBeenCalledWith(24);
      expect(result).toEqual(expectedResult);
    });

    it('should clear old logs with custom hours', () => {
      const cleanupData = { olderThanHours: 12 };
      const expectedResult = {
        removedLogs: 25,
        remainingLogs: 75,
        cutoffTime: new Date(),
      };

      jest.spyOn(service, 'clearOldLogs').mockReturnValue(expectedResult);

      const result = controller.clearOldLogs(cleanupData);

      expect(service.clearOldLogs).toHaveBeenCalledWith(12);
      expect(result).toEqual(expectedResult);
    });

    it('should throw HttpException when service throws error', () => {
      const cleanupData = { olderThanHours: 24 };
      const error = new Error('Service error');
      jest.spyOn(service, 'clearOldLogs').mockImplementation(() => {
        throw error;
      });

      expect(() => controller.clearOldLogs(cleanupData)).toThrow(HttpException);
      expect(() => controller.clearOldLogs(cleanupData)).toThrow('Failed to clear old logs');
    });
  });
});
