import { expect, test } from '@playwright/test';

test.describe('Error Scenarios and Validation', () => {
  test('should handle 404 for non-existent endpoints', async ({ request }) => {
    const response = await request.get('/api/non-existent');

    expect(response.status()).toBe(404);
  });

  test('should handle malformed JSON in POST requests', async ({ request }) => {
    const response = await request.post('/api/user', {
      data: 'invalid json string',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Should handle gracefully
    expect([400, 422]).toContain(response.status());
  });

  test('should handle missing required fields', async ({ request }) => {
    const incompleteData = {
      name: 'João Silva',
      // Missing email, password, cardNumber
    };

    const response = await request.post('/api/user', {
      data: incompleteData,
    });

    // Should still work as the service doesn't validate required fields
    expect(response.status()).toBe(201);
  });

  test('should handle very large payloads', async ({ request }) => {
    const largeData = {
      name: 'João Silva',
      email: 'joao@example.com',
      password: 'senha123',
      cardNumber: '1234567890123456',
      extraData: 'x'.repeat(10000), // Large payload
    };

    const response = await request.post('/api/user', {
      data: largeData,
    });

    expect(response.status()).toBe(201);
  });

  test('should handle special characters in data', async ({ request }) => {
    const specialData = {
      name: 'João Silva & Associates',
      email: 'joão+test@example.com',
      password: 'senha@123#',
      cardNumber: '1234-5678-9012-3456',
    };

    const response = await request.post('/api/user', {
      data: specialData,
    });

    expect(response.status()).toBe(201);
    const data = await response.json();
    expect(data.name).toBe(specialData.name);
    expect(data.email).toBe(specialData.email);
  });

  test('should handle concurrent error requests', async ({ request }) => {
    // Test multiple concurrent error requests
    const promises = Array.from({ length: 3 }, () => request.get('/api/error'));
    const responses = await Promise.all(promises);

    responses.forEach((response) => {
      expect(response.status()).toBe(500);
    });
  });

  test('should handle rapid successive requests', async ({ request }) => {
    // Test rapid successive requests to ensure stability
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(request.get('/api'));
    }

    const responses = await Promise.all(promises);
    responses.forEach((response) => {
      expect(response.status()).toBe(200);
    });
  });
});

test.describe('API Security Tests', () => {
  test('should handle SQL injection attempts', async ({ request }) => {
    const maliciousData = {
      name: "'; DROP TABLE users; --",
      email: 'test@example.com',
      password: 'password',
      cardNumber: '1234567890123456',
    };

    const response = await request.post('/api/user', {
      data: maliciousData,
    });

    // Should handle safely (no actual DB, but should not crash)
    expect(response.status()).toBe(201);
  });

  test('should handle XSS attempts', async ({ request }) => {
    const xssData = {
      name: '<script>alert("xss")</script>',
      email: 'test@example.com',
      password: 'password',
      cardNumber: '1234567890123456',
    };

    const response = await request.post('/api/user', {
      data: xssData,
    });

    expect(response.status()).toBe(201);
    const data = await response.json();
    // Should not execute script, just return as string
    expect(data.name).toBe(xssData.name);
  });
});
