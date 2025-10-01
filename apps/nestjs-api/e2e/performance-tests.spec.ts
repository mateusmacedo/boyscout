import { expect, test } from '@playwright/test';

test.describe('Performance and Concurrency Tests', () => {
  test('should handle high concurrent load on all endpoints', async ({ request }) => {
    const endpoints = [
      { method: 'GET', url: '/api' },
      { method: 'GET', url: '/api/async' },
      { method: 'GET', url: '/api/health' },
      { method: 'GET', url: '/api/health/metrics' },
      { method: 'GET', url: '/api/users/stats' },
      { method: 'GET', url: '/api/analytics/metrics' },
      { method: 'GET', url: '/api/analytics/performance' },
      { method: 'GET', url: '/api/monitoring/summary' },
    ];

    const promises = endpoints.flatMap((endpoint) =>
      Array.from({ length: 5 }, () => request[endpoint.method.toLowerCase()](endpoint.url))
    );

    const responses = await Promise.all(promises);

    for (const response of responses) {
      expect([200, 201, 400, 404, 500]).toContain(response.status());
    }
  });

  test('should handle concurrent user operations', async ({ request }) => {
    const userOperations = Array.from({ length: 10 }, (_, index) => {
      const userData = {
        name: `User ${index}`,
        email: `user${index}@example.com`,
        password: 'senha123456',
      };
      return request.post('/api/users', { data: userData });
    });

    const responses = await Promise.all(userOperations);

    for (const response of responses) {
      expect([201, 500]).toContain(response.status());
    }
  });

  test('should handle concurrent analytics tracking', async ({ request }) => {
    const events = Array.from({ length: 20 }, (_, index) => ({
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

  test('should handle concurrent monitoring events', async ({ request }) => {
    const monitoringEvents = [
      ...Array.from({ length: 5 }, (_, index) => ({
        type: 'business',
        data: { event: `business_${index}`, data: { test: true } },
      })),
      ...Array.from({ length: 5 }, (_, index) => ({
        type: 'security',
        data: { event: `security_${index}`, details: { test: true } },
      })),
      ...Array.from({ length: 5 }, (_, index) => ({
        type: 'performance',
        data: { metric: `metric_${index}`, value: Math.random() * 100 },
      })),
    ];

    const promises = monitoringEvents.map((event) => {
      const endpoint =
        event.type === 'business'
          ? 'business-event'
          : event.type === 'security'
            ? 'security-event'
            : 'performance-metric';
      return request.post(`/api/monitoring/${endpoint}`, { data: event.data });
    });

    const responses = await Promise.all(promises);

    for (const response of responses) {
      expect([201, 500]).toContain(response.status());
    }
  });

  test('should handle rapid health check requests', async ({ request }) => {
    const startTime = Date.now();
    const promises = Array.from({ length: 50 }, () => request.get('/api/health'));

    const responses = await Promise.all(promises);
    const endTime = Date.now();
    const duration = endTime - startTime;

    // All requests should succeed
    for (const response of responses) {
      expect(response.status()).toBe(200);
    }

    // Should complete within reasonable time (5 seconds for 50 requests)
    expect(duration).toBeLessThan(5000);
  });

  test('should handle mixed workload efficiently', async ({ request }) => {
    const mixedOperations = [
      // Health checks
      ...Array.from({ length: 5 }, () => request.get('/api/health')),
      ...Array.from({ length: 3 }, () => request.get('/api/health/metrics')),

      // User operations
      ...Array.from({ length: 3 }, (_, index) =>
        request.post('/api/users', {
          data: {
            name: `User ${index}`,
            email: `user${index}@example.com`,
            password: 'senha123456',
          },
        })
      ),

      // Analytics
      ...Array.from({ length: 5 }, (_, index) =>
        request.post('/api/analytics/track', {
          data: { event: `event_${index}`, data: { test: true } },
        })
      ),

      // Monitoring
      ...Array.from({ length: 3 }, (_, index) =>
        request.post('/api/monitoring/business-event', {
          data: { event: `event_${index}`, data: { test: true } },
        })
      ),
    ];

    const startTime = Date.now();
    const responses = await Promise.all(mixedOperations);
    const endTime = Date.now();
    const duration = endTime - startTime;

    // Most operations should succeed
    const successCount = responses.filter((r) => [200, 201].includes(r.status())).length;
    expect(successCount).toBeGreaterThan(responses.length * 0.8); // At least 80% success rate

    // Should complete within reasonable time
    expect(duration).toBeLessThan(10000); // 10 seconds
  });
});

test.describe('Load Testing with Time Constraints', () => {
  test('should handle 100 requests within 10 seconds', async ({ request }) => {
    const startTime = Date.now();
    const promises = Array.from({ length: 100 }, () => request.get('/api/health'));

    const responses = await Promise.all(promises);
    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(duration).toBeLessThan(10000); // 10 seconds
    expect(responses.length).toBe(100);

    // All should be successful
    for (const response of responses) {
      expect(response.status()).toBe(200);
    }
  });

  test('should handle burst requests without degradation', async ({ request }) => {
    // First, make some baseline requests
    const baselinePromises = Array.from({ length: 10 }, () => request.get('/api/health'));
    const baselineResponses = await Promise.all(baselinePromises);
    const baselineSuccessRate =
      baselineResponses.filter((r) => r.status() === 200).length / baselineResponses.length;

    // Then make burst requests
    const burstPromises = Array.from({ length: 30 }, () => request.get('/api/health'));
    const burstResponses = await Promise.all(burstPromises);
    const burstSuccessRate =
      burstResponses.filter((r) => r.status() === 200).length / burstResponses.length;

    // Success rate should not degrade significantly
    expect(burstSuccessRate).toBeGreaterThanOrEqual(baselineSuccessRate * 0.9);
  });

  test('should handle sustained load over time', async ({ request }) => {
    const batches = 5;
    const requestsPerBatch = 20;
    const batchDelay = 1000; // 1 second between batches

    for (let batch = 0; batch < batches; batch++) {
      const promises = Array.from({ length: requestsPerBatch }, () => request.get('/api/health'));

      const responses = await Promise.all(promises);

      // Each batch should have high success rate
      const successCount = responses.filter((r) => r.status() === 200).length;
      expect(successCount).toBeGreaterThanOrEqual(requestsPerBatch * 0.9);

      if (batch < batches - 1) {
        await new Promise((resolve) => setTimeout(resolve, batchDelay));
      }
    }
  });
});

test.describe('Memory and Resource Testing', () => {
  test('should handle large payload requests', async ({ request }) => {
    const largeData = {
      name: 'Large Data Test',
      email: 'large@example.com',
      password: 'senha123456',
      largeField: 'x'.repeat(10000), // 10KB string
    };

    const response = await request.post('/api/users', { data: largeData });

    expect([201, 400, 500]).toContain(response.status());
  });

  test('should handle multiple large analytics events', async ({ request }) => {
    const largeEvents = Array.from({ length: 10 }, (_, index) => ({
      event: `large_event_${index}`,
      data: {
        largeField: 'x'.repeat(5000), // 5KB string
        timestamp: new Date().toISOString(),
        index,
      },
    }));

    const promises = largeEvents.map((eventData) =>
      request.post('/api/analytics/track', { data: eventData })
    );

    const responses = await Promise.all(promises);

    // Most should succeed
    const successCount = responses.filter((r) => r.status() === 201).length;
    expect(successCount).toBeGreaterThan(responses.length * 0.8);
  });

  test('should handle concurrent large monitoring events', async ({ request }) => {
    const largeEvents = Array.from({ length: 5 }, (_, index) => ({
      event: `large_monitoring_event_${index}`,
      data: {
        largeField: 'x'.repeat(8000), // 8KB string
        timestamp: new Date().toISOString(),
        index,
      },
    }));

    const promises = largeEvents.map((eventData) =>
      request.post('/api/monitoring/business-event', { data: eventData })
    );

    const responses = await Promise.all(promises);

    // Most should succeed
    const successCount = responses.filter((r) => r.status() === 201).length;
    expect(successCount).toBeGreaterThan(responses.length * 0.8);
  });
});
