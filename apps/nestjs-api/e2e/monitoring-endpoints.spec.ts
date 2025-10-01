import { expect, test } from '@playwright/test';

test.describe('Monitoring Endpoints E2E Tests', () => {
  test('POST /api/monitoring/business-event - should log business event', async ({ request }) => {
    const eventData = {
      event: 'user_registration',
      data: {
        userId: '123',
        plan: 'premium',
        source: 'website',
      },
    };

    const response = await request.post('/api/monitoring/business-event', {
      data: eventData,
    });

    expect(response.status()).toBe(201);
    const data = await response.json();
    expect(data).toHaveProperty('logged', true);
    expect(data).toHaveProperty('event', eventData.event);
    expect(data).toHaveProperty('timestamp');
    expect(typeof data.timestamp).toBe('string');
  });

  test('POST /api/monitoring/security-event - should log security event', async ({ request }) => {
    const eventData = {
      event: 'failed_login_attempt',
      details: {
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        timestamp: new Date().toISOString(),
      },
    };

    const response = await request.post('/api/monitoring/security-event', {
      data: eventData,
    });

    expect(response.status()).toBe(201);
    const data = await response.json();
    expect(data).toHaveProperty('logged', true);
    expect(data).toHaveProperty('event', eventData.event);
    expect(data).toHaveProperty('timestamp');
    expect(typeof data.timestamp).toBe('string');
  });

  test('POST /api/monitoring/system-error - should log system error', async ({ request }) => {
    const errorData = {
      error: {
        name: 'DatabaseConnectionError',
        message: 'Failed to connect to database',
        stack: 'Error: Failed to connect to database\n    at Database.connect()',
      },
      context: {
        service: 'user-service',
        operation: 'createUser',
        timestamp: new Date().toISOString(),
      },
    };

    const response = await request.post('/api/monitoring/system-error', {
      data: errorData,
    });

    expect(response.status()).toBe(201);
    const data = await response.json();
    expect(data).toHaveProperty('logged', true);
    expect(data).toHaveProperty('error', errorData.error.name);
    expect(data).toHaveProperty('timestamp');
    expect(typeof data.timestamp).toBe('string');
  });

  test('POST /api/monitoring/performance-metric - should log performance metric', async ({
    request,
  }) => {
    const metricData = {
      metric: 'response_time',
      value: 150.5,
      unit: 'ms',
    };

    const response = await request.post('/api/monitoring/performance-metric', {
      data: metricData,
    });

    expect(response.status()).toBe(201);
    const data = await response.json();
    expect(data).toHaveProperty('logged', true);
    expect(data).toHaveProperty('metric', metricData.metric);
    expect(data).toHaveProperty('value', metricData.value);
    expect(data).toHaveProperty('unit', metricData.unit);
    expect(data).toHaveProperty('timestamp');
    expect(typeof data.timestamp).toBe('string');
  });

  test('POST /api/monitoring/performance-metric - should use default unit', async ({ request }) => {
    const metricData = {
      metric: 'cpu_usage',
      value: 75.2,
    };

    const response = await request.post('/api/monitoring/performance-metric', {
      data: metricData,
    });

    expect(response.status()).toBe(201);
    const data = await response.json();
    expect(data).toHaveProperty('unit', 'ms'); // Default unit
  });

  test('GET /api/monitoring/summary - should return log summary', async ({ request }) => {
    // First log some events
    await request.post('/api/monitoring/business-event', {
      data: { event: 'test_event', data: { test: true } },
    });

    const response = await request.get('/api/monitoring/summary');

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('totalLogs');
    expect(data).toHaveProperty('recentLogs');
    expect(data).toHaveProperty('logsByLevel');
    expect(data).toHaveProperty('bufferSize');
    expect(data).toHaveProperty('maxBufferSize');
    expect(data).toHaveProperty('oldestLog');
    expect(data).toHaveProperty('newestLog');
    expect(typeof data.totalLogs).toBe('number');
    expect(typeof data.recentLogs).toBe('number');
    expect(typeof data.logsByLevel).toBe('object');
    expect(typeof data.bufferSize).toBe('number');
    expect(typeof data.maxBufferSize).toBe('number');
  });

  test('GET /api/monitoring/logs - should return logs by level', async ({ request }) => {
    // First log some events
    await request.post('/api/monitoring/business-event', {
      data: { event: 'test_event', data: { test: true } },
    });

    const response = await request.get('/api/monitoring/logs?level=info');

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('level', 'info');
    expect(data).toHaveProperty('count');
    expect(data).toHaveProperty('logs');
    expect(typeof data.count).toBe('number');
    expect(Array.isArray(data.logs)).toBe(true);
  });

  test('GET /api/monitoring/logs - should return logs with limit', async ({ request }) => {
    // First log some events
    await request.post('/api/monitoring/business-event', {
      data: { event: 'test_event', data: { test: true } },
    });

    const response = await request.get('/api/monitoring/logs?level=info&limit=5');

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('level', 'info');
    expect(data).toHaveProperty('count');
    expect(data).toHaveProperty('logs');
    expect(Array.isArray(data.logs)).toBe(true);
    expect(data.logs.length).toBeLessThanOrEqual(5);
  });

  test('GET /api/monitoring/logs - should return 400 for missing level parameter', async ({
    request,
  }) => {
    const response = await request.get('/api/monitoring/logs');

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data).toHaveProperty('message');
    expect(data.message).toContain('Level parameter is required');
  });

  test('POST /api/monitoring/cleanup - should cleanup old logs', async ({ request }) => {
    const cleanupData = {
      olderThanHours: 1,
    };

    const response = await request.post('/api/monitoring/cleanup', {
      data: cleanupData,
    });

    expect(response.status()).toBe(201);
    const data = await response.json();
    expect(data).toHaveProperty('removedLogs');
    expect(data).toHaveProperty('remainingLogs');
    expect(data).toHaveProperty('cutoffTime');
    expect(typeof data.removedLogs).toBe('number');
    expect(typeof data.remainingLogs).toBe('number');
    expect(typeof data.cutoffTime).toBe('string');
  });

  test('POST /api/monitoring/cleanup - should use default cleanup period', async ({ request }) => {
    const response = await request.post('/api/monitoring/cleanup', {
      data: {},
    });

    expect(response.status()).toBe(201);
    const data = await response.json();
    expect(data).toHaveProperty('removedLogs');
    expect(data).toHaveProperty('remainingLogs');
    expect(data).toHaveProperty('cutoffTime');
  });
});

test.describe('Monitoring Endpoints Performance Tests', () => {
  test('should handle high volume event logging', async ({ request }) => {
    const events = Array.from({ length: 20 }, (_, index) => ({
      event: `event_${index}`,
      data: { index, timestamp: new Date().toISOString() },
    }));

    const promises = events.map((eventData) =>
      request.post('/api/monitoring/business-event', { data: eventData })
    );

    const responses = await Promise.all(promises);

    for (const response of responses) {
      expect(response.status()).toBe(201);
    }
  });

  test('should handle concurrent performance metrics', async ({ request }) => {
    const metrics = Array.from({ length: 10 }, (_, index) => ({
      metric: `metric_${index}`,
      value: Math.random() * 100,
      unit: 'ms',
    }));

    const promises = metrics.map((metricData) =>
      request.post('/api/monitoring/performance-metric', { data: metricData })
    );

    const responses = await Promise.all(promises);

    for (const response of responses) {
      expect(response.status()).toBe(201);
    }
  });

  test('should handle concurrent summary requests', async ({ request }) => {
    const promises = Array.from({ length: 5 }, () => request.get('/api/monitoring/summary'));

    const responses = await Promise.all(promises);

    for (const response of responses) {
      expect(response.status()).toBe(200);
    }
  });

  test('should handle concurrent log queries', async ({ request }) => {
    const promises = Array.from({ length: 3 }, () =>
      request.get('/api/monitoring/logs?level=info')
    );

    const responses = await Promise.all(promises);

    for (const response of responses) {
      expect(response.status()).toBe(200);
    }
  });
});

test.describe('Monitoring Endpoints Error Handling', () => {
  test('should handle invalid business event data', async ({ request }) => {
    const response = await request.post('/api/monitoring/business-event', {
      data: {
        /* missing required fields */
      },
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data).toHaveProperty('message');
    expect(data.message).toContain('Event and data are required');
  });

  test('should handle invalid security event data', async ({ request }) => {
    const response = await request.post('/api/monitoring/security-event', {
      data: {
        /* missing required fields */
      },
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data).toHaveProperty('message');
    expect(data.message).toContain('Event and details are required');
  });

  test('should handle invalid system error data', async ({ request }) => {
    const response = await request.post('/api/monitoring/system-error', {
      data: {
        /* missing required fields */
      },
    });

    expect(response.status()).toBe(500);
    const data = await response.json();
    expect(data).toHaveProperty('message');
    expect(data.message).toContain('Failed to log system error');
  });

  test('should handle invalid performance metric data', async ({ request }) => {
    const response = await request.post('/api/monitoring/performance-metric', {
      data: {
        /* missing required fields */
      },
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data).toHaveProperty('message');
    expect(data.message).toContain('Metric and value are required');
  });
});
