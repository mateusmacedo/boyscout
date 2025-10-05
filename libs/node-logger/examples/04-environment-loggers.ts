/**
 * Exemplo 4: Loggers Específicos por Ambiente
 * Demonstra como usar loggers otimizados para diferentes ambientes
 */

import { createDevelopmentLogger, createProductionLogger, createTestLogger } from '../src/index';

// ============================================================================
// DESENVOLVIMENTO - Formato legível e colorido
// ============================================================================

const devLogger = createDevelopmentLogger({
  service: 'my-app-dev',
});

devLogger.debug('Debug information', { step: 'validation' });
devLogger.info('Development server started', { port: 3000 });
devLogger.warn('Deprecated function used', { function: 'oldFunction' });

// ============================================================================
// PRODUÇÃO - Formato JSON estruturado
// ============================================================================

const prodLogger = createProductionLogger({
  service: 'my-app-prod',
  level: 'info',
});

prodLogger.info('Application started', {
  version: '1.0.0',
  environment: 'production',
  timestamp: new Date().toISOString(),
});

prodLogger.info('Database connected', {
  host: 'db.example.com',
  port: 5432,
  database: 'myapp',
});

// ============================================================================
// TESTES - Apenas erros e informações críticas
// ============================================================================

const testLogger = createTestLogger({
  service: 'my-app-test',
});

testLogger.info('Test suite started', {
  suite: 'UserService',
  testCount: 15,
});

testLogger.error('Test failed', {
  test: 'should create user',
  error: 'ValidationError: Email is required',
  stack: 'Error: ValidationError...',
});

testLogger.info('Test suite completed', {
  suite: 'UserService',
  passed: 14,
  failed: 1,
  duration: '2.5s',
});

// ============================================================================
// EXEMPLO DE USO CONDICIONAL POR AMBIENTE
// ============================================================================

function createLoggerForEnvironment(env: string) {
  switch (env) {
    case 'development':
      return createDevelopmentLogger({ service: 'my-app' });
    case 'production':
      return createProductionLogger({ service: 'my-app', level: 'info' });
    case 'test':
      return createTestLogger({ service: 'my-app' });
    default:
      return createDevelopmentLogger({ service: 'my-app' });
  }
}

// Simular diferentes ambientes
const environments = ['development', 'production', 'test'];

environments.forEach((env) => {
  const logger = createLoggerForEnvironment(env);
  logger.info(`Logger initialized for ${env}`, { environment: env });
});
