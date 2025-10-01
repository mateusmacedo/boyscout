import { expect, test } from '@playwright/test';

/**
 * Testes E2E de Tratamento de Erros
 * Testa cenários de erro e validação de dados
 */
test.describe('Error Handling and Validation', () => {
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

  test('should handle missing required fields gracefully', async ({ request }) => {
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

    for (const response of responses) {
      expect(response.status()).toBe(500);
    }
  });

  test('should handle rapid successive requests', async ({ request }) => {
    // Test rapid successive requests to ensure stability
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(request.get('/api'));
    }

    const responses = await Promise.all(promises);
    for (const response of responses) {
      expect(response.status()).toBe(200);
    }
  });
});

test.describe('Security and Input Validation', () => {
  test('should handle SQL injection attempts safely', async ({ request }) => {
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

  test('should handle XSS attempts safely', async ({ request }) => {
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

  test('should handle invalid user ID in user operations', async ({ request }) => {
    const response = await request.get('/api/users/invalid-id');

    expect(response.status()).toBe(404);
    const data = await response.json();
    expect(data).toHaveProperty('message');
    expect(data.message).toContain('not found');
  });

  test('should handle invalid date formats in analytics', async ({ request }) => {
    const response = await request.post('/api/analytics/report', {
      data: {
        startDate: 'invalid-date',
        endDate: 'invalid-date',
      },
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data).toHaveProperty('message');
    expect(data.message).toContain('Invalid date format');
  });

  test('should handle missing query parameters', async ({ request }) => {
    const response = await request.get('/api/users/search');

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data).toHaveProperty('message');
    expect(data.message).toContain('Query parameter is required');
  });
});
