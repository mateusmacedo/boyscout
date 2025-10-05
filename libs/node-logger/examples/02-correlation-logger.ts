/**
 * Exemplo 2: Logger com Correlação de Requisições
 * Demonstra como usar correlação de IDs para rastrear requisições
 */

import { createLogger } from '../src/index';

// Função para obter correlation ID (em produção, use getCid() ou similar)
function getCorrelationId(): string {
  // Em produção, isso viria do contexto da requisição
  return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Logger com correlação automática
const correlatedLogger = createLogger({
  level: 'info',
  service: 'api-service',
  getCorrelationId,
});

// Simular processamento de requisição
function processRequest(method: string, url: string) {
  const correlationId = getCorrelationId();

  correlatedLogger.info('Request received', {
    method,
    url,
    correlationId,
  });

  // Simular processamento
  correlatedLogger.debug('Processing request', {
    step: 'validation',
    correlationId,
  });

  correlatedLogger.debug('Processing request', {
    step: 'business-logic',
    correlationId,
  });

  correlatedLogger.info('Request processed', {
    method,
    url,
    statusCode: 200,
    correlationId,
  });
}

// Simular múltiplas requisições
processRequest('POST', '/api/users');
processRequest('GET', '/api/users/123');
processRequest('PUT', '/api/users/123');
