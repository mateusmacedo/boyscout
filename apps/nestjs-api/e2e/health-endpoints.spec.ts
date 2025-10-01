import { expect, test } from '@playwright/test';

test.describe('Health Endpoints E2E Tests', () => {
  test('GET /api/health - should return health status', async ({ request }) => {
    const response = await request.get('/api/health');

    expect(response.status()).toBe(200);
    const data = await response.json();

    // Basic health check structure
    expect(data).toHaveProperty('status', 'healthy');
    expect(data).toHaveProperty('timestamp');
    expect(data).toHaveProperty('uptime');
    expect(data).toHaveProperty('memory');
    expect(data).toHaveProperty('requests');
    expect(data).toHaveProperty('environment');

    // Uptime structure
    expect(data.uptime).toHaveProperty('milliseconds');
    expect(data.uptime).toHaveProperty('seconds');
    expect(data.uptime).toHaveProperty('minutes');
    expect(data.uptime).toHaveProperty('hours');
    expect(typeof data.uptime.milliseconds).toBe('number');
    expect(typeof data.uptime.seconds).toBe('number');
    expect(typeof data.uptime.minutes).toBe('number');
    expect(typeof data.uptime.hours).toBe('number');

    // Memory structure
    expect(data.memory).toHaveProperty('rss');
    expect(data.memory).toHaveProperty('heapTotal');
    expect(data.memory).toHaveProperty('heapUsed');
    expect(data.memory).toHaveProperty('external');
    expect(typeof data.memory.rss).toBe('number');
    expect(typeof data.memory.heapTotal).toBe('number');
    expect(typeof data.memory.heapUsed).toBe('number');
    expect(typeof data.memory.external).toBe('number');

    // Requests structure
    expect(data.requests).toHaveProperty('total');
    expect(data.requests).toHaveProperty('errors');
    expect(data.requests).toHaveProperty('successRate');
    expect(typeof data.requests.total).toBe('number');
    expect(typeof data.requests.errors).toBe('number');
    expect(typeof data.requests.successRate).toBe('string');

    // Environment structure
    expect(data.environment).toHaveProperty('nodeVersion');
    expect(data.environment).toHaveProperty('platform');
    expect(data.environment).toHaveProperty('arch');
    expect(data.environment).toHaveProperty('nodeEnv');
    expect(typeof data.environment.nodeVersion).toBe('string');
    expect(typeof data.environment.platform).toBe('string');
    expect(typeof data.environment.arch).toBe('string');
    expect(typeof data.environment.nodeEnv).toBe('string');
  });

  test('GET /api/health - should increment request counter', async ({ request }) => {
    // Get initial health status
    const initialResponse = await request.get('/api/health');
    const initialData = await initialResponse.json();
    const initialTotal = initialData.requests.total;

    // Make another request
    const response = await request.get('/api/health');
    const data = await response.json();

    expect(response.status()).toBe(200);
    expect(data.requests.total).toBe(initialTotal + 1);
  });

  test('GET /api/health/metrics - should return detailed metrics', async ({ request }) => {
    const response = await request.get('/api/health/metrics');

    expect(response.status()).toBe(200);
    const data = await response.json();

    // Detailed metrics structure
    expect(data).toHaveProperty('timestamp');
    expect(data).toHaveProperty('uptime');
    expect(data).toHaveProperty('memory');
    expect(data).toHaveProperty('cpu');
    expect(data).toHaveProperty('requests');
    expect(data).toHaveProperty('process');

    // Memory details
    expect(data.memory).toHaveProperty('rss');
    expect(data.memory).toHaveProperty('heapTotal');
    expect(data.memory).toHaveProperty('heapUsed');
    expect(data.memory).toHaveProperty('external');
    expect(data.memory).toHaveProperty('arrayBuffers');
    expect(typeof data.memory.rss).toBe('number');
    expect(typeof data.memory.heapTotal).toBe('number');
    expect(typeof data.memory.heapUsed).toBe('number');
    expect(typeof data.memory.external).toBe('number');
    expect(typeof data.memory.arrayBuffers).toBe('number');

    // CPU details
    expect(data.cpu).toHaveProperty('user');
    expect(data.cpu).toHaveProperty('system');
    expect(typeof data.cpu.user).toBe('number');
    expect(typeof data.cpu.system).toBe('number');

    // Requests details
    expect(data.requests).toHaveProperty('total');
    expect(data.requests).toHaveProperty('errors');
    expect(data.requests).toHaveProperty('successRate');
    expect(typeof data.requests.total).toBe('number');
    expect(typeof data.requests.errors).toBe('number');
    expect(typeof data.requests.successRate).toBe('number');

    // Process details
    expect(data.process).toHaveProperty('pid');
    expect(data.process).toHaveProperty('ppid');
    expect(data.process).toHaveProperty('title');
    expect(data.process).toHaveProperty('argv');
    expect(data.process).toHaveProperty('execPath');
    expect(typeof data.process.pid).toBe('number');
    expect(typeof data.process.ppid).toBe('number');
    expect(typeof data.process.title).toBe('string');
    expect(Array.isArray(data.process.argv)).toBe(true);
    expect(typeof data.process.execPath).toBe('string');
  });

  test('GET /api/health/reset - should reset counters', async ({ request }) => {
    // Make some requests to increment counters
    await request.get('/api/health');
    await request.get('/api/health');

    // Reset counters
    const response = await request.get('/api/health/reset');

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('message', 'Counters reset successfully');
    expect(data).toHaveProperty('timestamp');
    expect(typeof data.timestamp).toBe('string');
  });

  test('GET /api/health/reset - should reset request counters to zero', async ({ request }) => {
    // Make some requests
    await request.get('/api/health');
    await request.get('/api/health');

    // Reset counters
    await request.get('/api/health/reset');

    // Check that counters are reset
    const response = await request.get('/api/health');
    const data = await response.json();

    expect(response.status()).toBe(200);
    expect(data.requests.total).toBe(1); // Only this request should be counted
    expect(data.requests.errors).toBe(0);
  });
});

test.describe('Health Endpoints Performance Tests', () => {
  test('should handle concurrent health checks', async ({ request }) => {
    const promises = Array.from({ length: 10 }, () => request.get('/api/health'));

    const responses = await Promise.all(promises);

    for (const response of responses) {
      expect(response.status()).toBe(200);
    }
  });

  test('should handle concurrent metrics requests', async ({ request }) => {
    const promises = Array.from({ length: 5 }, () => request.get('/api/health/metrics'));

    const responses = await Promise.all(promises);

    for (const response of responses) {
      expect(response.status()).toBe(200);
    }
  });

  test('should handle rapid reset operations', async ({ request }) => {
    const promises = Array.from({ length: 3 }, () => request.get('/api/health/reset'));

    const responses = await Promise.all(promises);

    for (const response of responses) {
      expect(response.status()).toBe(200);
    }
  });
});

test.describe('Health Endpoints Error Handling', () => {
  test('should handle health check failures gracefully', async ({ request }) => {
    // This test ensures that even if there are internal errors,
    // the health endpoint should still respond appropriately
    const response = await request.get('/api/health');

    // Should either return 200 (healthy) or 500 (unhealthy)
    expect([200, 500]).toContain(response.status());
  });

  test('should handle metrics failures gracefully', async ({ request }) => {
    const response = await request.get('/api/health/metrics');

    // Should either return 200 (success) or 500 (error)
    expect([200, 500]).toContain(response.status());
  });
});
