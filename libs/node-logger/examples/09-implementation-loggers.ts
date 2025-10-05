/**
 * Exemplo 9: Diferentes Implementações de Logger
 * Demonstra como usar diferentes implementações (Pino, Console, etc.)
 */

import { createConsoleLogger, createLogger, createPinoLogger } from '../src/index';

// ============================================================================
// PINO LOGGER (PRODUÇÃO)
// ============================================================================

const pinoLogger = createPinoLogger({
  service: 'pino-service',
  level: 'info',
  structured: true,
});

console.log('=== PINO LOGGER (Produção) ===');
pinoLogger.info('Pino logger message', {
  data: 'value',
  timestamp: new Date().toISOString(),
  service: 'pino-service',
});

pinoLogger.error('Pino error message', {
  error: 'Database connection failed',
  code: 'DB_CONN_ERR',
  retryCount: 3,
});

pinoLogger.warn('Pino warning message', {
  deprecated: 'old-api',
  replacement: 'new-api',
  version: '2.0.0',
});

// ============================================================================
// CONSOLE LOGGER (DESENVOLVIMENTO)
// ============================================================================

const consoleLogger = createConsoleLogger({
  service: 'console-service',
  level: 'debug',
  structured: false, // Formato legível
  colors: true,
});

console.log('\n=== CONSOLE LOGGER (Desenvolvimento) ===');
consoleLogger.info('Console logger message', {
  data: 'value',
  step: 'initialization',
});

consoleLogger.debug('Console debug message', {
  variable: 'test',
  value: 123,
});

consoleLogger.error('Console error message', {
  error: 'Validation failed',
  field: 'email',
});

// ============================================================================
// CONSOLE LOGGER ESTRUTURADO
// ============================================================================

const structuredConsoleLogger = createConsoleLogger({
  service: 'structured-console-service',
  level: 'info',
  structured: true, // Formato JSON
  colors: false,
});

console.log('\n=== CONSOLE LOGGER ESTRUTURADO ===');
structuredConsoleLogger.info('Structured console message', {
  data: 'value',
  metadata: { version: '1.0.0' },
});

structuredConsoleLogger.warn('Structured warning', {
  issue: 'deprecated-feature',
  recommendation: 'use-new-api',
});

// ============================================================================
// LOGGER PADRÃO COM DIFERENTES CONFIGURAÇÕES
// ============================================================================

// Logger para desenvolvimento
const devLogger = createLogger({
  service: 'dev-app',
  level: 'debug',
  env: 'development',
  structured: false,
});

console.log('\n=== LOGGER PADRÃO (Desenvolvimento) ===');
devLogger.debug('Development debug', {
  component: 'UserService',
  action: 'createUser',
});

devLogger.info('Development info', {
  message: 'User created successfully',
  userId: '123',
});

// Logger para produção
const prodLogger = createLogger({
  service: 'prod-app',
  level: 'info',
  env: 'production',
  structured: true,
});

console.log('\n=== LOGGER PADRÃO (Produção) ===');
prodLogger.info('Production info', {
  message: 'Application started',
  version: '1.0.0',
  environment: 'production',
});

prodLogger.error('Production error', {
  error: 'Service unavailable',
  service: 'database',
  retryAfter: '30s',
});

// ============================================================================
// COMPARAÇÃO DE PERFORMANCE
// ============================================================================

function performanceTest(logger: any, name: string, iterations: number = 1000) {
  console.log(`\n=== TESTE DE PERFORMANCE: ${name} ===`);

  const start = Date.now();

  for (let i = 0; i < iterations; i++) {
    logger.info(`Performance test message ${i}`, {
      iteration: i,
      timestamp: new Date().toISOString(),
    });
  }

  const end = Date.now();
  const duration = end - start;

  console.log(`Executado ${iterations} logs em ${duration}ms`);
  console.log(`Média: ${(duration / iterations).toFixed(2)}ms por log`);
}

// Testar performance (com menos iterações para não sobrecarregar)
performanceTest(pinoLogger, 'Pino Logger', 100);
performanceTest(consoleLogger, 'Console Logger', 100);
performanceTest(devLogger, 'Dev Logger', 100);

// ============================================================================
// EXEMPLO DE USO EM DIFERENTES CENÁRIOS
// ============================================================================

class ApplicationService {
  private logger: any;

  constructor(implementation: 'pino' | 'console' | 'default' = 'default') {
    switch (implementation) {
      case 'pino':
        this.logger = createPinoLogger({
          service: 'ApplicationService',
          level: 'info',
        });
        break;
      case 'console':
        this.logger = createConsoleLogger({
          service: 'ApplicationService',
          level: 'debug',
          structured: false,
        });
        break;
      default:
        this.logger = createLogger({
          service: 'ApplicationService',
          level: 'info',
        });
    }
  }

  async processRequest(requestData: any) {
    this.logger.info('Processing request', {
      requestId: requestData.id,
      method: requestData.method,
    });

    try {
      // Simular processamento
      this.logger.debug('Validating request data');
      this.logger.debug('Executing business logic');

      this.logger.info('Request processed successfully', {
        requestId: requestData.id,
        duration: '150ms',
      });

      return { success: true, requestId: requestData.id };
    } catch (error) {
      this.logger.error('Request processing failed', {
        requestId: requestData.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}

// Testar diferentes implementações
console.log('\n=== TESTANDO DIFERENTES IMPLEMENTAÇÕES ===');

const pinoService = new ApplicationService('pino');
const consoleService = new ApplicationService('console');
const defaultService = new ApplicationService('default');

// Simular processamento com cada implementação
const requestData = { id: 'req-123', method: 'POST' };

pinoService.processRequest(requestData);
consoleService.processRequest(requestData);
defaultService.processRequest(requestData);

export {
  pinoLogger,
  consoleLogger,
  structuredConsoleLogger,
  devLogger,
  prodLogger,
  ApplicationService,
};
