/**
 * Helpers para Testes E2E
 *
 * Fornece funções utilitárias para operações comuns nos testes,
 * promovendo reutilização de código e consistência.
 */

import { type APIRequestContext, expect } from '@playwright/test';
import { testConstants } from '../fixtures/test-data';

/**
 * Interface para dados de usuário criado
 */
export interface CreatedUser {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
}

/**
 * Helper para operações com usuários
 */
export const userHelpers = {
  /**
   * Cria um usuário e retorna os dados criados
   */
  async create(
    request: APIRequestContext,
    userData: { name: string; email: string; password: string; cardNumber?: string }
  ): Promise<CreatedUser> {
    const response = await request.post('/api/users', { data: userData });
    expect(response.status()).toBe(testConstants.httpCodes.created);
    return response.json();
  },

  /**
   * Deleta um usuário pelo ID
   */
  async delete(request: APIRequestContext, userId: string): Promise<void> {
    const response = await request.delete(`/api/users/${userId}`);
    // Aceita 200 (sucesso) ou 404 (já deletado)
    expect([testConstants.httpCodes.ok, testConstants.httpCodes.notFound]).toContain(
      response.status()
    );
  },

  /**
   * Cria múltiplos usuários e retorna seus IDs
   */
  async createBatch(
    request: APIRequestContext,
    usersData: Array<{ name: string; email: string; password: string }>
  ): Promise<CreatedUser[]> {
    const users: CreatedUser[] = [];
    for (const userData of usersData) {
      const user = await userHelpers.create(request, userData);
      users.push(user);
    }
    return users;
  },

  /**
   * Deleta múltiplos usuários pelos IDs
   */
  async deleteBatch(request: APIRequestContext, userIds: string[]): Promise<void> {
    for (const userId of userIds) {
      await userHelpers.delete(request, userId);
    }
  },
};

/**
 * Helper para operações com analytics
 */
export const analyticsHelpers = {
  /**
   * Rastreia um evento de analytics
   */
  async trackEvent(
    request: APIRequestContext,
    eventData: { event: string; data?: Record<string, unknown> }
  ): Promise<void> {
    const response = await request.post('/api/analytics/track', { data: eventData });
    expect(response.status()).toBe(testConstants.httpCodes.created);
  },

  /**
   * Rastreia múltiplos eventos
   */
  async trackBatch(
    request: APIRequestContext,
    events: Array<{ event: string; data?: Record<string, unknown> }>
  ): Promise<void> {
    for (const eventData of events) {
      await analyticsHelpers.trackEvent(request, eventData);
    }
  },

  /**
   * Obtém métricas gerais
   */
  async getMetrics(request: APIRequestContext): Promise<unknown> {
    const response = await request.get('/api/analytics/metrics');
    expect(response.status()).toBe(testConstants.httpCodes.ok);
    return response.json();
  },

  /**
   * Gera um relatório
   */
  async generateReport(
    request: APIRequestContext,
    dateRange: { startDate: string; endDate: string }
  ): Promise<unknown> {
    const response = await request.post('/api/analytics/report', { data: dateRange });
    expect(response.status()).toBe(testConstants.httpCodes.created);
    return response.json();
  },
};

/**
 * Helper para operações com monitoring
 */
export const monitoringHelpers = {
  /**
   * Loga um evento de negócio
   */
  async logBusinessEvent(
    request: APIRequestContext,
    eventData: { event: string; data: Record<string, unknown> }
  ): Promise<void> {
    const response = await request.post('/api/monitoring/business-event', { data: eventData });
    expect(response.status()).toBe(testConstants.httpCodes.created);
  },

  /**
   * Loga um evento de segurança
   */
  async logSecurityEvent(
    request: APIRequestContext,
    eventData: { event: string; details: Record<string, unknown> }
  ): Promise<void> {
    const response = await request.post('/api/monitoring/security-event', { data: eventData });
    expect(response.status()).toBe(testConstants.httpCodes.created);
  },

  /**
   * Loga uma métrica de performance
   */
  async logPerformanceMetric(
    request: APIRequestContext,
    metricData: { metric: string; value: number; unit?: string }
  ): Promise<void> {
    const response = await request.post('/api/monitoring/performance-metric', { data: metricData });
    expect(response.status()).toBe(testConstants.httpCodes.created);
  },

  /**
   * Obtém resumo de logs
   */
  async getSummary(request: APIRequestContext): Promise<unknown> {
    const response = await request.get('/api/monitoring/summary');
    expect(response.status()).toBe(testConstants.httpCodes.ok);
    return response.json();
  },
};

/**
 * Helper para operações de health check
 */
export const healthHelpers = {
  /**
   * Executa health check básico
   */
  async check(request: APIRequestContext): Promise<unknown> {
    const response = await request.get('/api/health');
    expect(response.status()).toBe(testConstants.httpCodes.ok);
    return response.json();
  },

  /**
   * Obtém métricas de health detalhadas
   */
  async getMetrics(request: APIRequestContext): Promise<unknown> {
    const response = await request.get('/api/health/metrics');
    expect(response.status()).toBe(testConstants.httpCodes.ok);
    return response.json();
  },
};

/**
 * Helper para cleanup e manutenção
 */
export const cleanupHelpers = {
  /**
   * Limpa eventos antigos de analytics
   */
  async cleanupAnalytics(request: APIRequestContext, olderThanDays = 1): Promise<void> {
    const response = await request.post('/api/analytics/cleanup', {
      data: { olderThanDays },
    });
    expect(response.status()).toBe(testConstants.httpCodes.created);
  },

  /**
   * Limpa logs antigos de monitoring
   */
  async cleanupMonitoring(request: APIRequestContext, olderThanHours = 1): Promise<void> {
    const response = await request.post('/api/monitoring/cleanup', {
      data: { olderThanHours },
    });
    expect(response.status()).toBe(testConstants.httpCodes.created);
  },
};

/**
 * Helper para assertions comuns
 */
export const assertionHelpers = {
  /**
   * Verifica se o objeto contém propriedades esperadas
   */
  expectProperties(obj: unknown, properties: string[]): void {
    for (const prop of properties) {
      expect(obj).toHaveProperty(prop);
    }
  },

  /**
   * Verifica se dados sensíveis não estão expostos
   */
  expectNoSensitiveData(
    obj: unknown,
    sensitiveFields: string[] = ['password', 'cardNumber', 'token']
  ): void {
    for (const field of sensitiveFields) {
      expect(obj).not.toHaveProperty(field);
    }
  },

  /**
   * Verifica resposta de erro com mensagem
   */
  async expectErrorWithMessage(
    response: Awaited<ReturnType<APIRequestContext['get']>>,
    expectedStatus: number,
    messageContains: string
  ): Promise<void> {
    expect(response.status()).toBe(expectedStatus);
    const data = await response.json();
    expect(data).toHaveProperty('message');
    expect(data.message).toContain(messageContains);
  },
};

/**
 * Helper para operações assíncronas em lote
 */
export const batchHelpers = {
  /**
   * Executa múltiplas requests concorrentemente
   */
  executeInParallel<T>(operations: Array<() => Promise<T>>): Promise<T[]> {
    return Promise.all(operations.map((op) => op()));
  },

  /**
   * Executa requests em sequência com delay
   */
  async executeWithDelay<T>(operations: Array<() => Promise<T>>, delayMs = 100): Promise<T[]> {
    const results: T[] = [];
    for (const op of operations) {
      const result = await op();
      results.push(result);
      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
    return results;
  },
};

/**
 * Helper para medição de performance
 */
export const performanceHelpers = {
  /**
   * Mede o tempo de execução de uma operação
   */
  async measureTime<T>(operation: () => Promise<T>): Promise<{ result: T; duration: number }> {
    const startTime = Date.now();
    const result = await operation();
    const duration = Date.now() - startTime;
    return { result, duration };
  },

  /**
   * Verifica se operação está dentro do limite de tempo
   */
  async assertTimeLimit<T>(operation: () => Promise<T>, maxDurationMs: number): Promise<T> {
    const { result, duration } = await performanceHelpers.measureTime(operation);
    expect(duration).toBeLessThan(maxDurationMs);
    return result;
  },
};
