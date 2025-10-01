import { Log } from '@boyscout/node-logger';
import { Injectable } from '@nestjs/common';

/**
 * Serviço de Analytics - Demonstra uso avançado do @Log decorator
 * com diferentes níveis e configurações específicas
 */
@Injectable()
export class AnalyticsService {
  private metrics: Map<string, number> = new Map();
  private events: Array<{ event: string; timestamp: Date; data: Record<string, unknown> }> = [];

  @Log({
    level: 'info',
    includeArgs: true,
    includeResult: false,
  })
  trackEvent(event: string, data: Record<string, unknown> = {}) {
    const eventRecord = {
      event,
      timestamp: new Date(),
      data,
    };

    this.events.push(eventRecord);

    // Incrementa contador do evento
    const currentCount = this.metrics.get(event) || 0;
    this.metrics.set(event, currentCount + 1);
  }

  @Log({
    level: 'debug',
    includeArgs: true,
    includeResult: true,
    sampleRate: 0.1, // Apenas 10% dos logs para debug
  })
  async getEventMetrics(eventName?: string) {
    await new Promise((resolve) => setTimeout(resolve, 50));

    if (eventName) {
      return {
        event: eventName,
        count: this.metrics.get(eventName) || 0,
        lastOccurrence: this.events.filter((e) => e.event === eventName).pop()?.timestamp,
      };
    }

    return {
      totalEvents: this.events.length,
      uniqueEvents: this.metrics.size,
      metrics: Object.fromEntries(this.metrics),
    };
  }

  @Log({
    level: 'warn',
    includeArgs: true,
    includeResult: false,
  })
  async getPerformanceMetrics() {
    await new Promise((resolve) => setTimeout(resolve, 100));

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const recentEvents = this.events.filter((e) => e.timestamp > oneHourAgo);

    return {
      eventsLastHour: recentEvents.length,
      averageEventsPerMinute: recentEvents.length / 60,
      topEvents: this.getTopEvents(5),
      timestamp: now,
    };
  }

  @Log({
    level: 'error',
    includeArgs: true,
    includeResult: true,
  })
  async generateReport(startDate: Date, endDate: Date) {
    await new Promise((resolve) => setTimeout(resolve, 200));

    const filteredEvents = this.events.filter(
      (e) => e.timestamp >= startDate && e.timestamp <= endDate
    );

    if (filteredEvents.length === 0) {
      throw new Error('No events found in the specified date range');
    }

    const report = {
      period: { startDate, endDate },
      totalEvents: filteredEvents.length,
      uniqueEvents: new Set(filteredEvents.map((e) => e.event)).size,
      eventsByType: this.groupEventsByType(filteredEvents),
      generatedAt: new Date(),
    };

    return report;
  }

  @Log({
    level: 'info',
    includeArgs: true,
    includeResult: false,
  })
  clearOldEvents(olderThanDays: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const initialCount = this.events.length;
    this.events = this.events.filter((e) => e.timestamp > cutoffDate);
    const removedCount = initialCount - this.events.length;

    return {
      removedEvents: removedCount,
      remainingEvents: this.events.length,
      cutoffTime: cutoffDate,
    };
  }

  private getTopEvents(limit: number) {
    return Array.from(this.metrics.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([event, count]) => ({ event, count }));
  }

  private groupEventsByType(
    events: Array<{ event: string; timestamp: Date; data: Record<string, unknown> }>
  ) {
    const grouped: Record<string, number> = {};
    for (const e of events) {
      grouped[e.event] = (grouped[e.event] || 0) + 1;
    }
    return grouped;
  }
}
