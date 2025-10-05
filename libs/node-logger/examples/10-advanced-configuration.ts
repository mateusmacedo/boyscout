/**
 * Exemplo 10: Configuração Avançada de Logger
 * Demonstra configurações avançadas e personalizadas
 */

import { createLogger, createRedactor } from '../src/index';

// ============================================================================
// LOGGER COM CONFIGURAÇÃO AVANÇADA
// ============================================================================

const advancedLogger = createLogger({
  level: 'debug',
  service: 'advanced-service',
  env: 'production',
  version: '1.0.0',
  redact: createRedactor({
    keys: ['password', 'token', 'secret', 'apiKey', 'authorization', 'creditCard'],
    patterns: [
      /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/gi, // CPF
      /\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/gi, // CNPJ
      /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/gi, // Email
      /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/gi, // Credit Card
    ],
    keepLengths: false,
  }),
  getCorrelationId: () => `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  structured: true,
  messageFormat: (message, meta) => {
    return `[${new Date().toISOString()}] ${message} ${JSON.stringify(meta)}`;
  },
});

console.log('=== LOGGER COM CONFIGURAÇÃO AVANÇADA ===');
advancedLogger.info('Advanced logging', {
  userId: '123',
  password: 'secret123', // Será redatado
  email: 'user@example.com', // Será redatado
  cpf: '123.456.789-00', // Será redatado
  creditCard: '1234-5678-9012-3456', // Será redatado
});

// ============================================================================
// LOGGER COM CONTEXTO PERSONALIZADO
// ============================================================================

const contextualLogger = createLogger({
  service: 'contextual-service',
  level: 'info',
  getCorrelationId: () => `ctx-${Date.now()}`,
  context: {
    application: 'my-app',
    region: 'us-east-1',
    instance: 'app-001',
  },
});

console.log('\n=== LOGGER COM CONTEXTO PERSONALIZADO ===');
contextualLogger.info('Contextual message', {
  action: 'user-login',
  userId: '456',
});

// ============================================================================
// LOGGER COM FILTROS PERSONALIZADOS
// ============================================================================

const filteredLogger = createLogger({
  service: 'filtered-service',
  level: 'info',
  filter: (level, message, meta) => {
    // Filtrar logs de debug em produção
    if (level === 'debug' && process.env.NODE_ENV === 'production') {
      return false;
    }

    // Filtrar logs com dados sensíveis
    if (message.includes('password') || message.includes('token')) {
      return false;
    }

    return true;
  },
});

console.log('\n=== LOGGER COM FILTROS PERSONALIZADOS ===');
filteredLogger.debug('This debug message will be filtered in production');
filteredLogger.info('This info message will be logged');
filteredLogger.warn('This warning will be logged');

// ============================================================================
// LOGGER COM TRANSPORTES PERSONALIZADOS
// ============================================================================

const transportLogger = createLogger({
  service: 'transport-service',
  level: 'info',
  transports: [
    {
      type: 'console',
      level: 'info',
      format: 'json',
    },
    {
      type: 'file',
      level: 'error',
      filename: '/tmp/errors.log',
      format: 'json',
    },
  ],
});

console.log('\n=== LOGGER COM TRANSPORTES PERSONALIZADOS ===');
transportLogger.info('This will go to console');
transportLogger.error('This will go to both console and file');

// ============================================================================
// LOGGER COM MÉTRICAS E MONITORAMENTO
// ============================================================================

const metricsLogger = createLogger({
  service: 'metrics-service',
  level: 'info',
  metrics: {
    enabled: true,
    interval: 60000, // 1 minuto
    tags: ['service', 'level', 'environment'],
  },
});

console.log('\n=== LOGGER COM MÉTRICAS ===');
metricsLogger.info('Metrics enabled message', {
  operation: 'user-creation',
  duration: 150,
});

// ============================================================================
// LOGGER COM SAMPLING
// ============================================================================

const samplingLogger = createLogger({
  service: 'sampling-service',
  level: 'info',
  sampling: {
    enabled: true,
    rate: 0.1, // 10% dos logs
    strategy: 'random',
  },
});

console.log('\n=== LOGGER COM SAMPLING ===');
for (let i = 0; i < 20; i++) {
  samplingLogger.info(`Sampling test message ${i}`, { iteration: i });
}

// ============================================================================
// LOGGER COM BUFFERING
// ============================================================================

const bufferedLogger = createLogger({
  service: 'buffered-service',
  level: 'info',
  buffering: {
    enabled: true,
    size: 100,
    flushInterval: 5000, // 5 segundos
  },
});

console.log('\n=== LOGGER COM BUFFERING ===');
for (let i = 0; i < 5; i++) {
  bufferedLogger.info(`Buffered message ${i}`, { iteration: i });
}

// ============================================================================
// LOGGER COM ROTATION DE ARQUIVOS
// ============================================================================

const rotationLogger = createLogger({
  service: 'rotation-service',
  level: 'info',
  fileRotation: {
    enabled: true,
    maxSize: '10MB',
    maxFiles: 5,
    compress: true,
  },
});

console.log('\n=== LOGGER COM ROTATION DE ARQUIVOS ===');
rotationLogger.info('File rotation enabled', {
  maxSize: '10MB',
  maxFiles: 5,
});

// ============================================================================
// LOGGER COM CORRELAÇÃO DISTRIBUÍDA
// ============================================================================

const distributedLogger = createLogger({
  service: 'distributed-service',
  level: 'info',
  distributedTracing: {
    enabled: true,
    serviceName: 'my-service',
    version: '1.0.0',
    environment: 'production',
  },
});

console.log('\n=== LOGGER COM CORRELAÇÃO DISTRIBUÍDA ===');
distributedLogger.info('Distributed tracing enabled', {
  traceId: 'trace-123-456',
  spanId: 'span-789-012',
});

// ============================================================================
// EXEMPLO DE USO EM MICROSERVIÇOS
// ============================================================================

class MicroserviceLogger {
  private logger: any;

  constructor(serviceName: string, version: string) {
    this.logger = createLogger({
      service: serviceName,
      version,
      level: 'info',
      redact: createRedactor({
        keys: ['password', 'token', 'secret'],
        patterns: [/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/gi],
      }),
      getCorrelationId: () => `ms-${serviceName}-${Date.now()}`,
      context: {
        microservice: serviceName,
        version,
        environment: process.env.NODE_ENV || 'development',
      },
    });
  }

  async processRequest(requestId: string, data: any) {
    const requestLogger = this.logger.child({ requestId });

    requestLogger.info('Processing microservice request', {
      service: this.logger.context.service,
      dataSize: JSON.stringify(data).length,
    });

    try {
      // Simular processamento
      requestLogger.debug('Validating request data');
      requestLogger.debug('Executing business logic');

      requestLogger.info('Request processed successfully', {
        requestId,
        duration: '200ms',
      });

      return { success: true, requestId };
    } catch (error) {
      requestLogger.error('Request processing failed', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}

// Testar microservice logger
console.log('\n=== MICROSERVICE LOGGER ===');
const userServiceLogger = new MicroserviceLogger('user-service', '1.2.0');
const orderServiceLogger = new MicroserviceLogger('order-service', '2.1.0');

userServiceLogger.processRequest('req-001', { userId: '123', action: 'create' });
orderServiceLogger.processRequest('req-002', { orderId: '456', action: 'process' });

export {
  advancedLogger,
  contextualLogger,
  filteredLogger,
  transportLogger,
  metricsLogger,
  samplingLogger,
  bufferedLogger,
  rotationLogger,
  distributedLogger,
  MicroserviceLogger,
};
