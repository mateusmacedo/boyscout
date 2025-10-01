import { expect, test } from '@playwright/test';

/**
 * Testes E2E Core - Endpoints básicos da API
 * Testa funcionalidades fundamentais e logging básico
 */
test.describe('Core API Endpoints', () => {
  test('GET /api - should return hello message', async ({ request }) => {
    const response = await request.get('/api');

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toEqual({ message: 'Hello API' });
  });

  test('GET /api/async - should return async message with timestamp', async ({ request }) => {
    const response = await request.get('/api/async');

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('message', 'Hello API Async');
    expect(data).toHaveProperty('timestamp');
    expect(new Date(data.timestamp)).toBeInstanceOf(Date);
  });

  test('GET /api/error - should return 500 error', async ({ request }) => {
    const response = await request.get('/api/error');

    expect(response.status()).toBe(500);
    const data = await response.json();
    expect(data).toHaveProperty('message', 'Internal server error');
    expect(data).toHaveProperty('statusCode', 500);
  });

  test('POST /api/user - should process user data and return user info', async ({ request }) => {
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
    const data = await response.json();
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('name', userData.name);
    expect(data).toHaveProperty('email', userData.email);
    expect(data).not.toHaveProperty('password');
    expect(data).not.toHaveProperty('cardNumber');
  });

  test('POST /api/complex - should process complex data', async ({ request }) => {
    const complexData = {
      items: ['item1', 'item2', 'item3'],
      metadata: { version: '1.0', timestamp: new Date().toISOString() },
      sensitive: { password: 'secret123', token: 'abc123' },
    };

    const response = await request.post('/api/complex', {
      data: complexData,
    });

    expect(response.status()).toBe(201);
    const data = await response.json();
    expect(data).toHaveProperty('processed', true);
    expect(data).toHaveProperty('timestamp');
    expect(data).toHaveProperty('dataSize');
  });

  test('POST /api/validate - should validate input data', async ({ request }) => {
    const validData = {
      name: 'Valid User',
      email: 'valid@example.com',
      password: 'validpassword123',
    };

    const response = await request.post('/api/validate', {
      data: validData,
    });

    expect(response.status()).toBe(201);
    const data = await response.json();
    expect(data).toHaveProperty('valid', true);
  });

  test('POST /api/validate - should reject invalid input', async ({ request }) => {
    const invalidData = {
      name: 'Invalid User',
      email: 'invalid@example.com',
      password: '123', // Too short
    };

    const response = await request.post('/api/validate', {
      data: invalidData,
    });

    expect(response.status()).toBe(500);
  });
});

test.describe('Core API Performance', () => {
  test('should handle concurrent requests efficiently', async ({ request }) => {
    const promises = Array.from({ length: 10 }, () => request.get('/api'));
    const responses = await Promise.all(promises);

    for (const response of responses) {
      expect(response.status()).toBe(200);
    }
  });

  test('should handle async operations within reasonable time', async ({ request }) => {
    const startTime = Date.now();
    const response = await request.get('/api/async');
    const endTime = Date.now();

    expect(response.status()).toBe(200);
    expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
  });
});
