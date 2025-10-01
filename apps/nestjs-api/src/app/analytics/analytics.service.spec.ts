import { Test, type TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';

// Mock the @Log decorator before importing the service
jest.mock('@boyscout/node-logger', () => ({
  Log: jest.fn().mockReturnValue(() => {}),
  CorrelationIdMiddleware: jest.fn(),
}));

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AnalyticsService],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('trackEvent', () => {
    it('should track event with data', () => {
      const event = 'user_login';
      const data = { userId: '123', timestamp: '2023-01-01T00:00:00Z' };

      service.trackEvent(event, data);

      const events = (
        service as unknown as {
          events: Array<{ event: string; timestamp: Date; data: Record<string, unknown> }>;
        }
      ).events;
      expect(events).toHaveLength(1);
      expect(events[0].event).toBe(event);
      expect(events[0].data).toEqual(data);
      expect(events[0].timestamp).toBeInstanceOf(Date);
    });

    it('should track event without data', () => {
      const event = 'page_view';

      service.trackEvent(event);

      const events = (
        service as unknown as {
          events: Array<{ event: string; timestamp: Date; data: Record<string, unknown> }>;
        }
      ).events;
      expect(events).toHaveLength(1);
      expect(events[0].event).toBe(event);
      expect(events[0].data).toEqual({});
    });

    it('should increment event counter', () => {
      const event = 'user_login';

      service.trackEvent(event);
      service.trackEvent(event);

      const metrics = (service as unknown as { metrics: Map<string, number> }).metrics;
      expect(metrics.get(event)).toBe(2);
    });

    it('should track multiple different events', () => {
      service.trackEvent('user_login');
      service.trackEvent('page_view');
      service.trackEvent('user_login');

      const metrics = (service as unknown as { metrics: Map<string, number> }).metrics;
      expect(metrics.get('user_login')).toBe(2);
      expect(metrics.get('page_view')).toBe(1);
    });
  });

  describe('getEventMetrics', () => {
    beforeEach(() => {
      // Add some test events
      service.trackEvent('user_login', { userId: '1' });
      service.trackEvent('user_login', { userId: '2' });
      service.trackEvent('page_view', { page: 'home' });
    });

    it('should return metrics for specific event', async () => {
      const result = await service.getEventMetrics('user_login');

      expect(result).toHaveProperty('event', 'user_login');
      expect(result).toHaveProperty('count', 2);
      expect(result).toHaveProperty('lastOccurrence');
      expect(result.lastOccurrence).toBeInstanceOf(Date);
    });

    it('should return zero count for non-existent event', async () => {
      const result = await service.getEventMetrics('non_existent');

      expect(result).toHaveProperty('event', 'non_existent');
      expect(result).toHaveProperty('count', 0);
      expect(result.lastOccurrence).toBeUndefined();
    });

    it('should return overall metrics when no event specified', async () => {
      const result = await service.getEventMetrics();

      expect(result).toHaveProperty('totalEvents', 3);
      expect(result).toHaveProperty('uniqueEvents', 2);
      expect(result).toHaveProperty('metrics');
      expect(result.metrics).toHaveProperty('user_login', 2);
      expect(result.metrics).toHaveProperty('page_view', 1);
    });
  });

  describe('getPerformanceMetrics', () => {
    beforeEach(() => {
      // Add events with different timestamps
      const now = new Date();
      const _oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

      // Mock timestamps
      service.trackEvent('recent_event');
      service.trackEvent('recent_event');
      service.trackEvent('old_event');

      // Manually set timestamps for testing
      const events = (
        service as unknown as {
          events: Array<{ event: string; timestamp: Date; data: Record<string, unknown> }>;
        }
      ).events;
      events[0].timestamp = new Date(now.getTime() - 30 * 60 * 1000); // 30 minutes ago
      events[1].timestamp = new Date(now.getTime() - 45 * 60 * 1000); // 45 minutes ago
      events[2].timestamp = twoHoursAgo; // 2 hours ago
    });

    it('should return performance metrics', async () => {
      const result = await service.getPerformanceMetrics();

      expect(result).toHaveProperty('eventsLastHour');
      expect(result).toHaveProperty('averageEventsPerMinute');
      expect(result).toHaveProperty('topEvents');
      expect(result).toHaveProperty('timestamp');
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should calculate events in last hour correctly', async () => {
      const result = await service.getPerformanceMetrics();

      // Should only count events from last hour (2 recent events)
      expect(result.eventsLastHour).toBe(2);
    });

    it('should calculate average events per minute', async () => {
      const result = await service.getPerformanceMetrics();

      expect(result.averageEventsPerMinute).toBe(2 / 60);
    });

    it('should return top events', async () => {
      const result = await service.getPerformanceMetrics();

      expect(Array.isArray(result.topEvents)).toBe(true);
      expect(result.topEvents.length).toBeLessThanOrEqual(5);
    });
  });

  describe('generateReport', () => {
    beforeEach(() => {
      // Add test events with different timestamps
      const now = new Date();
      const startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
      const _endDate = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000); // 1 day ago

      service.trackEvent('event1');
      service.trackEvent('event2');
      service.trackEvent('event1');

      // Manually set timestamps within the range
      const events = (
        service as unknown as {
          events: Array<{ event: string; timestamp: Date; data: Record<string, unknown> }>;
        }
      ).events;
      events[0].timestamp = new Date(startDate.getTime() + 24 * 60 * 60 * 1000); // 6 days ago
      events[1].timestamp = new Date(startDate.getTime() + 2 * 24 * 60 * 60 * 1000); // 5 days ago
      events[2].timestamp = new Date(startDate.getTime() + 3 * 24 * 60 * 60 * 1000); // 4 days ago
    });

    it('should generate report for date range', async () => {
      const now = new Date();
      const startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const endDate = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);

      const result = await service.generateReport(startDate, endDate);

      expect(result).toHaveProperty('period');
      expect(result).toHaveProperty('totalEvents');
      expect(result).toHaveProperty('uniqueEvents');
      expect(result).toHaveProperty('eventsByType');
      expect(result).toHaveProperty('generatedAt');

      expect(result.period.startDate).toEqual(startDate);
      expect(result.period.endDate).toEqual(endDate);
      expect(result.totalEvents).toBe(3);
      expect(result.uniqueEvents).toBe(2);
      expect(result.eventsByType).toHaveProperty('event1', 2);
      expect(result.eventsByType).toHaveProperty('event2', 1);
    });

    it('should throw error when no events in date range', async () => {
      const now = new Date();
      const startDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Future date
      const endDate = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000); // Future date

      await expect(service.generateReport(startDate, endDate)).rejects.toThrow(
        'No events found in the specified date range'
      );
    });
  });

  describe('clearOldEvents', () => {
    beforeEach(() => {
      // Add events with different ages
      const now = new Date();

      service.trackEvent('recent_event');
      service.trackEvent('old_event');

      // Manually set timestamps
      const events = (
        service as unknown as {
          events: Array<{ event: string; timestamp: Date; data: Record<string, unknown> }>;
        }
      ).events;
      events[0].timestamp = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000); // 5 days ago
      events[1].timestamp = new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000); // 40 days ago
    });

    it('should clear events older than specified days', () => {
      const result = service.clearOldEvents(30);

      expect(result).toHaveProperty('removedEvents');
      expect(result).toHaveProperty('remainingEvents');
      expect(result).toHaveProperty('cutoffTime');
      expect(result.removedEvents).toBe(1); // Only the 40-day-old event
      expect(result.remainingEvents).toBe(1); // The 5-day-old event remains
    });

    it('should use default 30 days when no parameter provided', () => {
      const result = service.clearOldEvents();

      expect(result.removedEvents).toBe(1);
      expect(result.remainingEvents).toBe(1);
    });

    it('should not remove any events when cutoff is very old', () => {
      const result = service.clearOldEvents(60);

      expect(result.removedEvents).toBe(0);
      expect(result.remainingEvents).toBe(2);
    });
  });

  describe('private methods', () => {
    it('should get top events correctly', () => {
      // Add multiple events with different counts
      service.trackEvent('event1');
      service.trackEvent('event1');
      service.trackEvent('event1');
      service.trackEvent('event2');
      service.trackEvent('event2');
      service.trackEvent('event3');

      const topEvents = (
        service as unknown as {
          getTopEvents: (limit: number) => Array<{ event: string; count: number }>;
        }
      ).getTopEvents(2);

      expect(topEvents).toHaveLength(2);
      expect(topEvents[0]).toEqual({ event: 'event1', count: 3 });
      expect(topEvents[1]).toEqual({ event: 'event2', count: 2 });
    });

    it('should group events by type correctly', () => {
      const events = [
        { event: 'type1', timestamp: new Date(), data: {} },
        { event: 'type1', timestamp: new Date(), data: {} },
        { event: 'type2', timestamp: new Date(), data: {} },
      ];

      const grouped = (
        service as unknown as {
          groupEventsByType: (
            events: Array<{ event: string; timestamp: Date; data: Record<string, unknown> }>
          ) => Record<string, number>;
        }
      ).groupEventsByType(events);

      expect(grouped).toHaveProperty('type1', 2);
      expect(grouped).toHaveProperty('type2', 1);
    });
  });
});
