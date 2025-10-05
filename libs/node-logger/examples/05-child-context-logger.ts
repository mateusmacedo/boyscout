/**
 * Exemplo 5: Logger com Child Context
 * Demonstra como usar child loggers para adicionar contexto persistente
 */

import { createLogger } from '../src/index';

// Logger principal
const mainLogger = createLogger({
  service: 'main-service',
  level: 'info',
});

// ============================================================================
// CHILD LOGGER COM CONTEXTO DE USUÁRIO
// ============================================================================

// Child logger com contexto de usuário
const userLogger = mainLogger.child({
  userId: '123',
  sessionId: 'sess-456',
  userRole: 'admin',
});

userLogger.info('User action', { action: 'login' });
userLogger.info('User action', { action: 'view_profile' });
userLogger.info('User action', { action: 'update_settings' });
userLogger.info('User action', { action: 'logout' });

// ============================================================================
// CHILD LOGGER COM CONTEXTO DE REQUISIÇÃO
// ============================================================================

// Simular diferentes requisições
function processRequest(requestId: string, method: string, url: string) {
  const requestLogger = mainLogger.child({
    requestId,
    method,
    url,
    timestamp: new Date().toISOString(),
  });

  requestLogger.info('Request started');
  requestLogger.debug('Processing request', { step: 'validation' });
  requestLogger.debug('Processing request', { step: 'business-logic' });
  requestLogger.info('Request completed', { statusCode: 200 });
}

// Simular múltiplas requisições
processRequest('req-001', 'POST', '/api/users');
processRequest('req-002', 'GET', '/api/users/123');
processRequest('req-003', 'PUT', '/api/users/123');

// ============================================================================
// CHILD LOGGER COM CONTEXTO DE MÓDULO
// ============================================================================

// Logger para módulo de autenticação
const authLogger = mainLogger.child({
  module: 'authentication',
  version: '2.1.0',
});

authLogger.info('Authentication module initialized');
authLogger.debug('Loading JWT configuration');
authLogger.info('JWT secret loaded', { length: 32 });

// Logger para módulo de banco de dados
const dbLogger = mainLogger.child({
  module: 'database',
  version: '1.5.0',
  connection: 'postgresql',
});

dbLogger.info('Database module initialized');
dbLogger.debug('Connecting to database', { host: 'localhost', port: 5432 });
dbLogger.info('Database connected successfully');

// ============================================================================
// CHILD LOGGER ANINHADO
// ============================================================================

// Child logger de segundo nível
const nestedLogger = userLogger.child({
  operation: 'user-management',
  adminId: 'admin-789',
});

nestedLogger.info('Admin action', { action: 'create_user' });
nestedLogger.info('Admin action', { action: 'update_user_permissions' });
nestedLogger.warn('Admin action', { action: 'delete_user', reason: 'inactive_account' });

// ============================================================================
// EXEMPLO PRÁTICO: SISTEMA DE E-COMMERCE
// ============================================================================

class OrderService {
  private logger = mainLogger.child({
    service: 'OrderService',
    version: '1.0.0',
  });

  async createOrder(orderData: any) {
    const orderLogger = this.logger.child({
      orderId: orderData.id,
      customerId: orderData.customerId,
    });

    orderLogger.info('Creating order');

    try {
      // Simular validação
      orderLogger.debug('Validating order data');

      // Simular processamento
      orderLogger.debug('Processing payment');
      orderLogger.debug('Reserving inventory');

      orderLogger.info('Order created successfully', {
        total: orderData.total,
        items: orderData.items.length,
      });

      return orderData;
    } catch (error) {
      orderLogger.error('Failed to create order', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}

// Usar o serviço
const orderService = new OrderService();
orderService.createOrder({
  id: 'order-123',
  customerId: 'customer-456',
  total: 99.99,
  items: [{ id: 'item-1', quantity: 2 }],
});
