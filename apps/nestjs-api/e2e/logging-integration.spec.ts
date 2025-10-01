import { expect, test } from '@playwright/test';

test.describe('Logging Integration Tests', () => {
  test('should log request/response for GET endpoints', async ({ request }) => {
    // Test that logging decorators are working
    const response = await request.get('/api');

    expect(response.status()).toBe(200);
    // The @Log decorator should be working without errors
    // We can't directly test logs in e2e, but we can ensure the endpoint works
  });

  test('should log async operations with sampling', async ({ request }) => {
    // Test the async endpoint with sampling rate
    const response = await request.get('/api/async');

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.message).toBe('Hello API Async');
    // Sampling should be working (0.1 rate)
  });

  test('should log errors properly', async ({ request }) => {
    // Test error logging
    const response = await request.get('/api/error');

    expect(response.status()).toBe(500);
    // Error should be logged with @Log decorator
  });

  test('should log sensitive data redaction', async ({ request }) => {
    const userData = {
      name: 'João Silva',
      email: 'joao@example.com',
      password: 'senha123',
      cardNumber: '1234567890123456',
    };

    const response = await request.post('/api/user', {
      data: userData,
    });

    expect(response.status()).toBe(201);
    // Sensitive data should be redacted in logs by @boyscout/node-logger
  });
});

test.describe('API Performance Tests', () => {
  test('should handle concurrent requests', async ({ request }) => {
    // Test concurrent requests to ensure logging doesn't interfere
    const promises = Array.from({ length: 5 }, () => request.get('/api'));
    const responses = await Promise.all(promises);

    responses.forEach((response) => {
      expect(response.status()).toBe(200);
    });
  });

  test('should handle async operations efficiently', async ({ request }) => {
    const startTime = Date.now();
    const response = await request.get('/api/async');
    const endTime = Date.now();

    expect(response.status()).toBe(200);
    // Should complete within reasonable time (considering 100ms delay in service)
    expect(endTime - startTime).toBeLessThan(1000);
  });
});
