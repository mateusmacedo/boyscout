/**
 * Exemplo 6: Logger em Middlewares
 * Demonstra como usar logger em middlewares de aplicação web
 */

import express from 'express';
import { createLogger } from '../src/index';

const app = express();
const middlewareLogger = createLogger({
  service: 'middleware',
  level: 'info',
});

// ============================================================================
// MIDDLEWARE DE LOGGING DE REQUISIÇÕES
// ============================================================================

// Middleware para logging de requisições
app.use((req, res, next) => {
  const startTime = Date.now();
  const requestLogger = middlewareLogger.child({
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    requestId: `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  });

  // Log da requisição recebida
  requestLogger.info('Request received');

  // Adicionar logger ao request para uso posterior
  (req as any).logger = requestLogger;

  // Log da resposta quando finalizada
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    requestLogger.info('Request completed', {
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('Content-Length') || 0,
    });
  });

  // Log de erro se houver
  res.on('error', (error) => {
    requestLogger.error('Request error', {
      error: error.message,
      stack: error.stack,
    });
  });

  next();
});

// ============================================================================
// MIDDLEWARE DE AUTENTICAÇÃO COM LOGGING
// ============================================================================

app.use('/api', (req, res, next) => {
  const authLogger = (req as any).logger.child({ middleware: 'auth' });

  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    authLogger.warn('Unauthorized request', {
      url: req.url,
      ip: req.ip,
    });
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Simular validação do token
  authLogger.debug('Validating token');

  // Simular usuário autenticado
  (req as any).user = { id: '123', role: 'user' };
  authLogger.info('User authenticated', {
    userId: '123',
    role: 'user',
  });

  next();
});

// ============================================================================
// MIDDLEWARE DE RATE LIMITING COM LOGGING
// ============================================================================

const requestCounts = new Map<string, { count: number; resetTime: number }>();

app.use('/api', (req, res, next) => {
  const rateLimitLogger = (req as any).logger.child({ middleware: 'rate-limit' });
  const clientId = req.ip || 'unknown';
  const now = Date.now();
  const windowMs = 60000; // 1 minuto
  const maxRequests = 100;

  const clientData = requestCounts.get(clientId);

  if (!clientData || now > clientData.resetTime) {
    requestCounts.set(clientId, { count: 1, resetTime: now + windowMs });
    rateLimitLogger.debug('New rate limit window', { clientId });
  } else {
    clientData.count++;

    if (clientData.count > maxRequests) {
      rateLimitLogger.warn('Rate limit exceeded', {
        clientId,
        count: clientData.count,
        limit: maxRequests,
      });
      return res.status(429).json({ error: 'Too many requests' });
    }

    rateLimitLogger.debug('Request within rate limit', {
      clientId,
      count: clientData.count,
      limit: maxRequests,
    });
  }

  next();
});

// ============================================================================
// ROTAS COM LOGGING ESPECÍFICO
// ============================================================================

app.get('/api/users', (req, res) => {
  const routeLogger = (req as any).logger.child({ route: 'GET /api/users' });

  routeLogger.info('Fetching users');

  // Simular busca de usuários
  const users = [
    { id: '1', name: 'João Silva' },
    { id: '2', name: 'Maria Santos' },
  ];

  routeLogger.info('Users fetched successfully', { count: users.length });
  res.json(users);
});

app.post('/api/users', (req, res) => {
  const routeLogger = (req as any).logger.child({ route: 'POST /api/users' });

  routeLogger.info('Creating user', { userData: req.body });

  try {
    // Simular criação de usuário
    const newUser = { id: '3', ...req.body };

    routeLogger.info('User created successfully', { userId: newUser.id });
    res.status(201).json(newUser);
  } catch (error) {
    routeLogger.error('Failed to create user', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================================
// MIDDLEWARE DE ERROR HANDLING COM LOGGING
// ============================================================================

app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const errorLogger = (req as any).logger.child({ middleware: 'error-handler' });

  errorLogger.error('Unhandled error', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
  });

  res.status(500).json({
    error: 'Internal server error',
    requestId: (req as any).logger?.context?.requestId,
  });
});

// ============================================================================
// EXEMPLO DE USO
// ============================================================================

// Simular algumas requisições para demonstrar o logging
const port = 3000;
app.listen(port, () => {
  middlewareLogger.info('Server started', { port });

  // Simular requisições (em um ambiente real, isso seria feito por clientes)
  console.log(`\nServidor rodando na porta ${port}`);
  console.log('Teste as rotas:');
  console.log('- GET http://localhost:3000/api/users');
  console.log('- POST http://localhost:3000/api/users');
  console.log('\nOs logs serão exibidos no console conforme as requisições forem feitas.');
});

export { app };
