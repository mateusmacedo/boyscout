/**
 * Fixtures de Dados para Testes E2E
 *
 * Fornece factories e helpers para gerar dados de teste únicos e consistentes,
 * seguindo boas práticas de isolamento de testes.
 */

/**
 * Gera um timestamp único para garantir unicidade entre testes paralelos
 */
export const uniqueId = () => `${Date.now()}-${Math.random().toString(36).substring(7)}`;

/**
 * Gera um email único para testes
 */
export const uniqueEmail = (prefix = 'test') => `${prefix}-${uniqueId()}@example.com`;

/**
 * Factory de dados de usuário
 */
export const userDataFactory = {
  /**
   * Gera dados completos de usuário com valores únicos
   */
  create: (
    overrides: Partial<{
      name: string;
      email: string;
      password: string;
      cardNumber: string;
    }> = {}
  ) => ({
    name: overrides.name ?? `Test User ${uniqueId()}`,
    email: overrides.email ?? uniqueEmail('user'),
    password: overrides.password ?? 'senha123456',
    cardNumber: overrides.cardNumber ?? '1234567890123456',
  }),

  /**
   * Gera múltiplos usuários únicos
   */
  createBatch: (count: number) => {
    return Array.from({ length: count }, (_, index) => ({
      name: `Batch User ${index}-${uniqueId()}`,
      email: uniqueEmail(`batch${index}`),
      password: 'senha123456',
    }));
  },

  /**
   * Dados de usuário com caracteres especiais
   */
  withSpecialChars: () => ({
    name: `João Silva & Associates ${uniqueId()}`,
    email: uniqueEmail('joão+test'),
    password: 'senha@123#',
    cardNumber: '1234-5678-9012-3456',
  }),
};

/**
 * Factory de dados de analytics
 */
export const analyticsDataFactory = {
  /**
   * Gera evento de analytics único
   */
  createEvent: (eventName: string, data?: Record<string, unknown>) => ({
    event: eventName,
    data: {
      ...data,
      timestamp: new Date().toISOString(),
      testId: uniqueId(),
    },
  }),

  /**
   * Gera múltiplos eventos
   */
  createBatch: (eventNames: string[]) => {
    return eventNames.map((name) => analyticsDataFactory.createEvent(name));
  },
};

/**
 * Factory de dados de monitoring
 */
export const monitoringDataFactory = {
  /**
   * Gera evento de negócio único
   */
  createBusinessEvent: (event: string, data?: Record<string, unknown>) => ({
    event,
    data: {
      ...data,
      timestamp: new Date().toISOString(),
      testId: uniqueId(),
    },
  }),

  /**
   * Gera evento de segurança único
   */
  createSecurityEvent: (event: string, details?: Record<string, unknown>) => ({
    event,
    details: {
      ...details,
      ip: '192.168.1.1',
      userAgent: 'Mozilla/5.0 (Test)',
      timestamp: new Date().toISOString(),
      testId: uniqueId(),
    },
  }),

  /**
   * Gera métrica de performance
   */
  createPerformanceMetric: (metric: string, value?: number, unit?: string) => ({
    metric,
    value: value ?? Math.random() * 100,
    unit: unit ?? 'ms',
  }),
};

/**
 * Factory de dados de relatórios
 */
export const reportDataFactory = {
  /**
   * Gera dados para relatório de período
   */
  createDateRange: (hoursAgo = 1) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setHours(startDate.getHours() - hoursAgo);

    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };
  },

  /**
   * Gera dados de relatório com datas inválidas
   */
  createInvalidDateRange: () => ({
    startDate: 'invalid-date',
    endDate: 'invalid-date',
  }),

  /**
   * Gera relatório com startDate após endDate
   */
  createReversedDateRange: () => {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setHours(endDate.getHours() - 1); // endDate antes de startDate

    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };
  },
};

/**
 * Dados maliciosos para testes de segurança
 */
export const securityTestData = {
  /**
   * Tentativa de SQL injection
   */
  sqlInjection: {
    name: "'; DROP TABLE users; --",
    email: uniqueEmail('sql'),
    password: 'password',
    cardNumber: '1234567890123456',
  },

  /**
   * Tentativa de XSS
   */
  xss: {
    name: '<script>alert("xss")</script>',
    email: uniqueEmail('xss'),
    password: 'password',
    cardNumber: '1234567890123456',
  },

  /**
   * Payload extremamente grande
   */
  largePayload: (size = 10000) => ({
    name: 'Large User',
    email: uniqueEmail('large'),
    password: 'password',
    cardNumber: '1234567890123456',
    extraData: 'x'.repeat(size),
  }),
};

/**
 * Constantes úteis para testes
 */
export const testConstants = {
  /**
   * Timeouts padrão
   */
  timeouts: {
    default: 5000,
    long: 30000,
    veryLong: 60000,
  },

  /**
   * Códigos HTTP esperados
   */
  httpCodes: {
    ok: 200,
    created: 201,
    badRequest: 400,
    notFound: 404,
    internalServerError: 500,
  },

  /**
   * Limites de performance
   */
  performance: {
    maxResponseTime: 1000, // ms
    maxConcurrentRequests: 100,
    burstSize: 30,
  },
};
