import { expect, test } from '@playwright/test';

test.describe('Analytics Endpoints E2E Tests', () => {
  test('POST /api/analytics/track - should track business event', async ({ request }) => {
    const eventData = {
      event: 'user_login',
      data: {
        userId: '123',
        timestamp: new Date().toISOString(),
        source: 'web',
      },
    };

    const response = await request.post('/api/analytics/track', {
      data: eventData,
    });

    expect(response.status()).toBe(201);
    const data = await response.json();
    expect(data).toHaveProperty('message', 'Event tracked successfully');
  });

  test('POST /api/analytics/track - should track multiple events', async ({ request }) => {
    const events = [
      { event: 'page_view', data: { page: '/home' } },
      { event: 'button_click', data: { button: 'signup' } },
      { event: 'form_submit', data: { form: 'contact' } },
    ];

    for (const eventData of events) {
      const response = await request.post('/api/analytics/track', {
        data: eventData,
      });

      expect(response.status()).toBe(201);
    }
  });

  test('GET /api/analytics/metrics - should return general metrics', async ({ request }) => {
    const response = await request.get('/api/analytics/metrics');

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('totalEvents');
    expect(data).toHaveProperty('uniqueEvents');
    expect(data).toHaveProperty('metrics');
    expect(typeof data.totalEvents).toBe('number');
    expect(typeof data.uniqueEvents).toBe('number');
  });

  test('GET /api/analytics/metrics?event=user_login - should return specific event metrics', async ({
    request,
  }) => {
    // First track some events
    await request.post('/api/analytics/track', {
      data: { event: 'user_login', data: { userId: '123' } },
    });

    const response = await request.get('/api/analytics/metrics?event=user_login');

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('event', 'user_login');
    expect(data).toHaveProperty('count');
    expect(data).toHaveProperty('lastOccurrence');
    expect(typeof data.count).toBe('number');
  });

  test('GET /api/analytics/performance - should return performance metrics', async ({
    request,
  }) => {
    const response = await request.get('/api/analytics/performance');

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('eventsLastHour');
    expect(data).toHaveProperty('averageEventsPerMinute');
    expect(data).toHaveProperty('topEvents');
    expect(data).toHaveProperty('timestamp');
    expect(typeof data.eventsLastHour).toBe('number');
    expect(typeof data.averageEventsPerMinute).toBe('number');
    expect(Array.isArray(data.topEvents)).toBe(true);
  });

  test('POST /api/analytics/report - should generate report for date range', async ({
    request,
  }) => {
    // First track some events
    await request.post('/api/analytics/track', {
      data: { event: 'test_event', data: { test: true } },
    });

    const startDate = new Date();
    startDate.setHours(startDate.getHours() - 1);
    const endDate = new Date();

    const reportData = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };

    const response = await request.post('/api/analytics/report', {
      data: reportData,
    });

    expect(response.status()).toBe(201);
    const data = await response.json();
    expect(data).toHaveProperty('period');
    expect(data).toHaveProperty('totalEvents');
    expect(data).toHaveProperty('uniqueEvents');
    expect(data).toHaveProperty('eventsByType');
    expect(data).toHaveProperty('generatedAt');
    expect(data.period).toHaveProperty('startDate');
    expect(data.period).toHaveProperty('endDate');
  });

  test('POST /api/analytics/report - should return 400 for invalid date format', async ({
    request,
  }) => {
    const reportData = {
      startDate: 'invalid-date',
      endDate: 'invalid-date',
    };

    const response = await request.post('/api/analytics/report', {
      data: reportData,
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data).toHaveProperty('message');
    expect(data.message).toContain('Invalid date format');
  });

  test('POST /api/analytics/report - should return 400 for start date after end date', async ({
    request,
  }) => {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() + 3600000); // 1 hour later

    const reportData = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };

    const response = await request.post('/api/analytics/report', {
      data: reportData,
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data).toHaveProperty('message');
    expect(data.message).toContain('Start date must be before end date');
  });

  test('POST /api/analytics/cleanup - should cleanup old events', async ({ request }) => {
    const cleanupData = {
      olderThanDays: 1,
    };

    const response = await request.post('/api/analytics/cleanup', {
      data: cleanupData,
    });

    expect(response.status()).toBe(201);
    const data = await response.json();
    expect(data).toHaveProperty('removedEvents');
    expect(data).toHaveProperty('remainingEvents');
    expect(data).toHaveProperty('cutoffTime');
    expect(typeof data.removedEvents).toBe('number');
    expect(typeof data.remainingEvents).toBe('number');
  });

  test('POST /api/analytics/cleanup - should use default cleanup period', async ({ request }) => {
    const response = await request.post('/api/analytics/cleanup', {
      data: {},
    });

    expect(response.status()).toBe(201);
    const data = await response.json();
    expect(data).toHaveProperty('removedEvents');
    expect(data).toHaveProperty('remainingEvents');
    expect(data).toHaveProperty('cutoffTime');
  });
});

test.describe('Analytics Endpoints Performance Tests', () => {
  test('should handle high volume event tracking', async ({ request }) => {
    const events = Array.from({ length: 10 }, (_, index) => ({
      event: `event_${index}`,
      data: { index, timestamp: new Date().toISOString() },
    }));

    const promises = events.map((eventData) =>
      request.post('/api/analytics/track', { data: eventData })
    );

    const responses = await Promise.all(promises);

    for (const response of responses) {
      expect(response.status()).toBe(201);
    }
  });

  test('should handle concurrent metrics requests', async ({ request }) => {
    const promises = Array.from({ length: 5 }, () => request.get('/api/analytics/metrics'));

    const responses = await Promise.all(promises);

    for (const response of responses) {
      expect(response.status()).toBe(200);
    }
  });

  test('should handle concurrent performance requests', async ({ request }) => {
    const promises = Array.from({ length: 3 }, () => request.get('/api/analytics/performance'));

    const responses = await Promise.all(promises);

    for (const response of responses) {
      expect(response.status()).toBe(200);
    }
  });
});
