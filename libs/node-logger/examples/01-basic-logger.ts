/**
 * Exemplo 1: Logger Básico
 * Demonstra como criar e usar um logger básico
 */

import { createLogger } from '../src/index';

// Criar um logger básico
const logger = createLogger({
  level: 'debug',
  service: 'my-service',
  env: 'development',
});

// Uso manual do logger
logger.info('User created', { userId: '123', email: 'user@example.com' });
logger.error('Database connection failed', { error: 'Connection timeout' });
logger.debug('Debug information', { step: 'validation' });
logger.warn('Deprecated API used', { endpoint: '/api/v1/users' });

// Exemplo de uso em uma função
function processUser(userId: string) {
  logger.info('Processing user', { userId });

  try {
    // Simular processamento
    logger.debug('User validation completed', { userId });
    logger.info('User processed successfully', { userId });
  } catch (error) {
    logger.error('Failed to process user', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

// Executar exemplo
processUser('123');
