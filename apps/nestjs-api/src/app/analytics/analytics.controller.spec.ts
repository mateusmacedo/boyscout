import { HttpException } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import type { AnalyticsService } from './analytics.service';

// Mock the @Log decorator before importing the controller
jest.mock('@boyscout/node-logger', () => ({
  Log: jest.fn().mockReturnValue(() => {}),
  CorrelationIdMiddleware: jest.fn(),
}));

describe('AnalyticsController', () => {
  let controller: AnalyticsController;
  let service: AnalyticsService;

  beforeEach(() => {
    // Create mock service
    service = {
      trackEvent: jest.fn(),
      getEventMetrics: jest.fn(),
      getPerformanceMetrics: jest.fn(),
      generateReport: jest.fn(),
      clearOldEvents: jest.fn(),
    } as unknown as AnalyticsService;

    // Create controller instance manually
    controller = new AnalyticsController(service);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('trackEvent', () => {
    it('should track event successfully', () => {
      const eventData = {
        event: 'user_login',
        data: { userId: '123', timestamp: '2023-01-01T00:00:00Z' },
      };

      const result = controller.trackEvent(eventData);

      expect(service.trackEvent).toHaveBeenCalledWith(eventData.event, eventData.data);
      expect(result).toEqual({ message: 'Event tracked successfully' });
    });

    it('should track event without data', () => {
      const eventData = {
        event: 'page_view',
      };

      const result = controller.trackEvent(eventData);

      expect(service.trackEvent).toHaveBeenCalledWith(eventData.event, undefined);
      expect(result).toEqual({ message: 'Event tracked successfully' });
    });
  });

  describe('getMetrics', () => {
    it('should return metrics successfully', async () => {
      const expectedMetrics = {
        totalEvents: 100,
        uniqueEvents: 5,
        metrics: { user_login: 50, page_view: 30, purchase: 20 },
      };

      jest.spyOn(service, 'getEventMetrics').mockResolvedValue(expectedMetrics);

      const result = await controller.getMetrics();

      expect(service.getEventMetrics).toHaveBeenCalledWith(undefined);
      expect(result).toEqual(expectedMetrics);
    });

    it('should return metrics for specific event', async () => {
      const eventName = 'user_login';
      const expectedMetrics = {
        event: eventName,
        count: 25,
        lastOccurrence: new Date('2023-01-01T00:00:00Z'),
      };

      jest.spyOn(service, 'getEventMetrics').mockResolvedValue(expectedMetrics);

      const result = await controller.getMetrics(eventName);

      expect(service.getEventMetrics).toHaveBeenCalledWith(eventName);
      expect(result).toEqual(expectedMetrics);
    });

    it('should throw HttpException when service throws error', async () => {
      const error = new Error('Service error');
      jest.spyOn(service, 'getEventMetrics').mockRejectedValue(error);

      await expect(controller.getMetrics()).rejects.toThrow(HttpException);
      await expect(controller.getMetrics()).rejects.toThrow('Failed to get metrics');
    });
  });

  describe('getPerformanceMetrics', () => {
    it('should return performance metrics successfully', async () => {
      const expectedMetrics = {
        eventsLastHour: 50,
        averageEventsPerMinute: 0.83,
        topEvents: [
          { event: 'user_login', count: 25 },
          { event: 'page_view', count: 15 },
        ],
        timestamp: new Date('2023-01-01T00:00:00Z'),
      };

      jest.spyOn(service, 'getPerformanceMetrics').mockResolvedValue(expectedMetrics);

      const result = await controller.getPerformanceMetrics();

      expect(service.getPerformanceMetrics).toHaveBeenCalled();
      expect(result).toEqual(expectedMetrics);
    });

    it('should throw HttpException when service throws error', async () => {
      const error = new Error('Service error');
      jest.spyOn(service, 'getPerformanceMetrics').mockRejectedValue(error);

      await expect(controller.getPerformanceMetrics()).rejects.toThrow(HttpException);
      await expect(controller.getPerformanceMetrics()).rejects.toThrow(
        'Failed to get performance metrics'
      );
    });
  });

  describe('generateReport', () => {
    it('should generate report successfully', async () => {
      const reportData = {
        startDate: '2023-01-01',
        endDate: '2023-01-31',
      };

      const expectedReport = {
        period: {
          startDate: new Date('2023-01-01'),
          endDate: new Date('2023-01-31'),
        },
        totalEvents: 1000,
        uniqueEvents: 10,
        eventsByType: { user_login: 500, purchase: 300, page_view: 200 },
        generatedAt: new Date('2023-02-01T00:00:00Z'),
      };

      jest.spyOn(service, 'generateReport').mockResolvedValue(expectedReport);

      const result = await controller.generateReport(reportData);

      expect(service.generateReport).toHaveBeenCalledWith(
        new Date('2023-01-01'),
        new Date('2023-01-31')
      );
      expect(result).toEqual(expectedReport);
    });

    it('should throw HttpException for invalid date format', async () => {
      const reportData = {
        startDate: 'invalid-date',
        endDate: '2023-01-31',
      };

      await expect(controller.generateReport(reportData)).rejects.toThrow(HttpException);
      await expect(controller.generateReport(reportData)).rejects.toThrow('Invalid date format');
    });

    it('should throw HttpException when start date is after end date', async () => {
      const reportData = {
        startDate: '2023-01-31',
        endDate: '2023-01-01',
      };

      await expect(controller.generateReport(reportData)).rejects.toThrow(HttpException);
      await expect(controller.generateReport(reportData)).rejects.toThrow(
        'Start date must be before end date'
      );
    });

    it('should throw HttpException when service throws error', async () => {
      const reportData = {
        startDate: '2023-01-01',
        endDate: '2023-01-31',
      };

      const error = new Error('Service error');
      jest.spyOn(service, 'generateReport').mockRejectedValue(error);

      await expect(controller.generateReport(reportData)).rejects.toThrow(HttpException);
      await expect(controller.generateReport(reportData)).rejects.toThrow(
        'Failed to generate report'
      );
    });
  });

  describe('cleanupOldEvents', () => {
    it('should cleanup old events with default days', async () => {
      const cleanupData = {};
      const expectedResult = {
        removedEvents: 50,
        remainingEvents: 100,
        cutoffDate: new Date(),
      };

      jest.spyOn(service, 'clearOldEvents').mockReturnValue(expectedResult);

      const result = await controller.cleanupOldEvents(cleanupData);

      expect(service.clearOldEvents).toHaveBeenCalledWith(30);
      expect(result).toEqual(expectedResult);
    });

    it('should cleanup old events with custom days', async () => {
      const cleanupData = { olderThanDays: 7 };
      const expectedResult = {
        removedEvents: 25,
        remainingEvents: 75,
        cutoffDate: new Date(),
      };

      jest.spyOn(service, 'clearOldEvents').mockReturnValue(expectedResult);

      const result = await controller.cleanupOldEvents(cleanupData);

      expect(service.clearOldEvents).toHaveBeenCalledWith(7);
      expect(result).toEqual(expectedResult);
    });
  });
});
