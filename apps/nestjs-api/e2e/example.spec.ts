import { expect, test } from '@playwright/test';

test.describe('NestJS API Endpoints', () => {
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

  test('POST /api/user - should handle invalid data', async ({ request }) => {
    const invalidData = {
      name: 'João Silva',
      // missing required fields
    };

    const response = await request.post('/api/user', {
      data: invalidData,
    });

    // NestJS should handle this gracefully
    expect(response.status()).toBe(201);
  });
});
