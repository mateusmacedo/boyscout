/**
 * User Endpoints E2E Tests
 *
 * Testa operações CRUD, busca e estatísticas de usuários
 * com isolamento completo e cleanup automático.
 */

import { expect, test } from '@playwright/test';
import { securityTestData, testConstants, userDataFactory } from './fixtures/test-data';
import { assertionHelpers, performanceHelpers, userHelpers } from './helpers/test-helpers';

test.describe('User Endpoints - CRUD Operations', () => {
  // Array para rastrear usuários criados e garantir cleanup
  const createdUserIds: string[] = [];

  // Hook de cleanup: executa após cada teste
  test.afterEach(async ({ request }) => {
    // Limpa todos os usuários criados durante o teste
    if (createdUserIds.length > 0) {
      await userHelpers.deleteBatch(request, createdUserIds);
      createdUserIds.length = 0; // Limpa o array
    }
  });

  test('POST /api/users - should create a new user', async ({ request }) => {
    // Arrange: Gera dados únicos
    const userData = userDataFactory.create();

    // Act: Cria o usuário
    const createdUser = await userHelpers.create(request, userData);
    createdUserIds.push(createdUser.id);

    // Assert: Verifica resposta
    assertionHelpers.expectProperties(createdUser, ['id', 'name', 'email', 'createdAt']);
    expect(createdUser.name).toBe(userData.name);
    expect(createdUser.email).toBe(userData.email);
    assertionHelpers.expectNoSensitiveData(createdUser);
  });

  test('POST /api/users - should handle special characters', async ({ request }) => {
    // Arrange: Dados com caracteres especiais
    const userData = userDataFactory.withSpecialChars();

    // Act: Cria o usuário
    const createdUser = await userHelpers.create(request, userData);
    createdUserIds.push(createdUser.id);

    // Assert: Verifica que caracteres especiais foram preservados
    expect(createdUser.name).toContain('João Silva');
    expect(createdUser.email).toContain('joão');
  });

  test('GET /api/users - should return list of users', async ({ request }) => {
    // Arrange: Cria alguns usuários
    const users = userDataFactory.createBatch(3);
    const created = await userHelpers.createBatch(request, users);
    createdUserIds.push(...created.map((u) => u.id));

    // Act: Busca todos os usuários
    const response = await request.get('/api/users');

    // Assert: Verifica resposta
    expect(response.status()).toBe(testConstants.httpCodes.ok);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThanOrEqual(3);
  });

  test('GET /api/users/:id - should return specific user', async ({ request }) => {
    // Arrange: Cria um usuário
    const userData = userDataFactory.create();
    const createdUser = await userHelpers.create(request, userData);
    createdUserIds.push(createdUser.id);

    // Act: Busca o usuário específico
    const response = await request.get(`/api/users/${createdUser.id}`);

    // Assert: Verifica resposta
    expect(response.status()).toBe(testConstants.httpCodes.ok);
    const data = await response.json();
    expect(data.id).toBe(createdUser.id);
    expect(data.name).toBe(userData.name);
    expect(data.email).toBe(userData.email);
  });

  test('GET /api/users/:id - should return 404 for non-existent user', async ({ request }) => {
    // Act: Busca usuário inexistente
    const response = await request.get('/api/users/non-existent-id');

    // Assert: Verifica erro 404
    await assertionHelpers.expectErrorWithMessage(
      response,
      testConstants.httpCodes.notFound,
      'not found'
    );
  });

  test('PUT /api/users/:id - should update user', async ({ request }) => {
    // Arrange: Cria um usuário
    const userData = userDataFactory.create({ name: 'Original Name' });
    const createdUser = await userHelpers.create(request, userData);
    createdUserIds.push(createdUser.id);

    // Act: Atualiza o usuário
    const updateData = {
      name: 'Updated Name',
      email: userData.email, // Mantém o mesmo email
    };
    const response = await request.put(`/api/users/${createdUser.id}`, {
      data: updateData,
    });

    // Assert: Verifica atualização
    expect(response.status()).toBe(testConstants.httpCodes.ok);
    const updatedUser = await response.json();
    expect(updatedUser.id).toBe(createdUser.id);
    expect(updatedUser.name).toBe(updateData.name);
  });

  test('PUT /api/users/:id - should return 404 for non-existent user', async ({ request }) => {
    // Act: Tenta atualizar usuário inexistente
    const updateData = { name: 'Updated Name' };
    const response = await request.put('/api/users/non-existent-id', {
      data: updateData,
    });

    // Assert: Verifica erro 404
    expect(response.status()).toBe(testConstants.httpCodes.notFound);
  });

  test('DELETE /api/users/:id - should delete user', async ({ request }) => {
    // Arrange: Cria um usuário
    const userData = userDataFactory.create();
    const createdUser = await userHelpers.create(request, userData);

    // Act: Deleta o usuário
    const response = await request.delete(`/api/users/${createdUser.id}`);

    // Assert: Verifica deleção
    expect(response.status()).toBe(testConstants.httpCodes.ok);
    const data = await response.json();
    expect(data.message).toBe('User deleted successfully');

    // Verifica que usuário não existe mais
    const getResponse = await request.get(`/api/users/${createdUser.id}`);
    expect(getResponse.status()).toBe(testConstants.httpCodes.notFound);
  });

  test('DELETE /api/users/:id - should return 404 for non-existent user', async ({ request }) => {
    // Act: Tenta deletar usuário inexistente
    const response = await request.delete('/api/users/non-existent-id');

    // Assert: Verifica erro 404
    expect(response.status()).toBe(testConstants.httpCodes.notFound);
  });
});

test.describe('User Endpoints - Search and Statistics', () => {
  const createdUserIds: string[] = [];

  test.afterEach(async ({ request }) => {
    if (createdUserIds.length > 0) {
      await userHelpers.deleteBatch(request, createdUserIds);
      createdUserIds.length = 0;
    }
  });

  test('GET /api/users/search?q=query - should search users', async ({ request }) => {
    // Arrange: Cria usuários com nomes específicos
    const searchTerm = `SearchTest-${Date.now()}`;
    const users = [
      userDataFactory.create({ name: `${searchTerm} Alpha` }),
      userDataFactory.create({ name: `${searchTerm} Beta` }),
      userDataFactory.create({ name: 'Other User' }),
    ];
    const created = await userHelpers.createBatch(request, users);
    createdUserIds.push(...created.map((u) => u.id));

    // Act: Busca usuários com o termo
    const response = await request.get(`/api/users/search?q=${searchTerm}`);

    // Assert: Verifica resultados
    expect(response.status()).toBe(testConstants.httpCodes.ok);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThanOrEqual(2);
    expect(data.every((user: { name: string }) => user.name.includes(searchTerm))).toBe(true);
  });

  test('GET /api/users/search - should return 400 for missing query parameter', async ({
    request,
  }) => {
    // Act: Busca sem parâmetro
    const response = await request.get('/api/users/search');

    // Assert: Verifica erro de validação
    await assertionHelpers.expectErrorWithMessage(
      response,
      testConstants.httpCodes.badRequest,
      'Query parameter is required'
    );
  });

  test('GET /api/users/stats - should return user statistics', async ({ request }) => {
    // Arrange: Cria alguns usuários
    const users = userDataFactory.createBatch(5);
    const created = await userHelpers.createBatch(request, users);
    createdUserIds.push(...created.map((u) => u.id));

    // Act: Busca estatísticas
    const response = await request.get('/api/users/stats');

    // Assert: Verifica resposta
    expect(response.status()).toBe(testConstants.httpCodes.ok);
    const data = await response.json();
    assertionHelpers.expectProperties(data, ['total', 'recent']);
    expect(typeof data.total).toBe('number');
    expect(typeof data.recent).toBe('number');
    expect(data.total).toBeGreaterThanOrEqual(5);
  });
});

test.describe('User Endpoints - Security Tests', () => {
  const createdUserIds: string[] = [];

  test.afterEach(async ({ request }) => {
    if (createdUserIds.length > 0) {
      await userHelpers.deleteBatch(request, createdUserIds);
      createdUserIds.length = 0;
    }
  });

  test('POST /api/users - should handle SQL injection attempts safely', async ({ request }) => {
    // Arrange: Dados com tentativa de SQL injection
    const maliciousData = {
      ...securityTestData.sqlInjection,
      password: 'senha123456',
    };

    // Act: Cria usuário com dados maliciosos
    const createdUser = await userHelpers.create(request, maliciousData);
    createdUserIds.push(createdUser.id);

    // Assert: Verifica que string foi tratada como texto literal
    expect(createdUser.name).toBe(maliciousData.name);
  });

  test('POST /api/users - should handle XSS attempts safely', async ({ request }) => {
    // Arrange: Dados com tentativa de XSS
    const xssData = {
      ...securityTestData.xss,
      password: 'senha123456',
    };

    // Act: Cria usuário com dados XSS
    const createdUser = await userHelpers.create(request, xssData);
    createdUserIds.push(createdUser.id);

    // Assert: Verifica que script não foi executado
    expect(createdUser.name).toBe(xssData.name);
  });
});

test.describe('User Endpoints - Performance Tests', () => {
  const createdUserIds: string[] = [];

  test.afterEach(async ({ request }) => {
    if (createdUserIds.length > 0) {
      await userHelpers.deleteBatch(request, createdUserIds);
      createdUserIds.length = 0;
    }
  });

  test('should handle concurrent user creation', async ({ request }) => {
    // Arrange: Prepara múltiplas operações de criação
    const users = userDataFactory.createBatch(5);
    const operations = users.map((userData) => async () => {
      const response = await request.post('/api/users', { data: userData });
      expect(response.status()).toBe(testConstants.httpCodes.created);
      return response.json();
    });

    // Act: Executa criações em paralelo
    const created = await Promise.all(operations.map((op) => op()));
    createdUserIds.push(...created.map((u: { id: string }) => u.id));

    // Assert: Verifica que todos foram criados
    expect(created).toHaveLength(5);
    created.forEach((user) => {
      assertionHelpers.expectProperties(user, ['id', 'name', 'email']);
    });
  });

  test('should handle concurrent user searches efficiently', async ({ request }) => {
    // Arrange: Cria usuários para busca
    const searchTerm = `PerfTest-${Date.now()}`;
    const users = userDataFactory.createBatch(3).map((u) => ({
      ...u,
      name: `${searchTerm} ${u.name}`,
    }));
    const created = await userHelpers.createBatch(request, users);
    createdUserIds.push(...created.map((u) => u.id));

    // Act: Executa múltiplas buscas concorrentes
    const searches = Array.from({ length: 5 }, () =>
      request.get(`/api/users/search?q=${searchTerm}`)
    );

    // Assert: Verifica performance e resultados
    const result = await performanceHelpers.measureTime(async () => {
      return Promise.all(searches);
    });

    expect(result.duration).toBeLessThan(testConstants.performance.maxResponseTime * 5);
    result.result.forEach((response) => {
      expect(response.status()).toBe(testConstants.httpCodes.ok);
    });
  });

  test('should complete CRUD operations within time limits', async ({ request }) => {
    // Act & Assert: Testa tempo de cada operação
    const userData = userDataFactory.create();

    // Create
    const createdUser = await performanceHelpers.assertTimeLimit(
      async () => userHelpers.create(request, userData),
      testConstants.performance.maxResponseTime
    );
    createdUserIds.push(createdUser.id);

    // Read
    await performanceHelpers.assertTimeLimit(
      async () => request.get(`/api/users/${createdUser.id}`),
      testConstants.performance.maxResponseTime
    );

    // Update
    await performanceHelpers.assertTimeLimit(
      async () =>
        request.put(`/api/users/${createdUser.id}`, {
          data: { name: 'Updated Name' },
        }),
      testConstants.performance.maxResponseTime
    );

    // Delete
    await performanceHelpers.assertTimeLimit(
      async () => request.delete(`/api/users/${createdUser.id}`),
      testConstants.performance.maxResponseTime
    );

    // Remove do array pois já foi deletado
    createdUserIds.length = 0;
  });
});
