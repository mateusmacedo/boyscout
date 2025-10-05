/**
 * Exemplo 11: Integração com NestJS
 * Demonstra como integrar o logger com NestJS
 */

import { createLogger } from '../src/index';

// ============================================================================
// MÓDULO DE LOGGER PARA NESTJS
// ============================================================================

class LoggerModule {
  static forRoot() {
    return {
      providers: [
        {
          provide: 'LOGGER',
          useFactory: () =>
            createLogger({
              service: 'nestjs-app',
              level: 'info',
              env: process.env.NODE_ENV || 'development',
            }),
        },
      ],
      exports: ['LOGGER'],
    };
  }

  static forFeature(serviceName: string) {
    return {
      providers: [
        {
          provide: `${serviceName}_LOGGER`,
          useFactory: (mainLogger: any) => mainLogger.child({ service: serviceName }),
          inject: ['LOGGER'],
        },
      ],
      exports: [`${serviceName}_LOGGER`],
    };
  }
}

// ============================================================================
// SERVICE NESTJS COM LOGGER
// ============================================================================

class NestJSService {
  constructor(private logger: any) {}

  async processData(data: any) {
    this.logger.info('Processing data', { dataId: data.id });

    try {
      // Simular processamento
      this.logger.debug('Validating data structure');
      this.logger.debug('Executing business logic');

      this.logger.info('Data processed successfully', {
        dataId: data.id,
        result: 'success',
      });

      return { success: true, dataId: data.id };
    } catch (error) {
      this.logger.error('Data processing failed', {
        dataId: data.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}

// ============================================================================
// CONTROLLER NESTJS COM LOGGER
// ============================================================================

class NestJSController {
  constructor(private logger: any) {}

  async handleRequest(requestData: any) {
    this.logger.info('Request received', {
      method: requestData.method,
      url: requestData.url,
    });

    try {
      // Simular processamento da requisição
      this.logger.debug('Processing request');

      const result = {
        success: true,
        requestId: requestData.id,
      };

      this.logger.info('Request processed successfully', {
        requestId: requestData.id,
        statusCode: 200,
      });

      return result;
    } catch (error) {
      this.logger.error('Request processing failed', {
        requestId: requestData.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}

// ============================================================================
// INTERCEPTOR DE LOGGING PARA NESTJS
// ============================================================================

class LoggingInterceptor {
  constructor(private logger: any) {}

  intercept(context: any, next: any) {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    const requestLogger = this.logger.child({
      method: request.method,
      url: request.url,
      userAgent: request.get('User-Agent'),
      ip: request.ip,
    });

    requestLogger.info('Request started');

    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        requestLogger.info('Request completed', {
          statusCode: response.statusCode,
          duration: `${duration}ms`,
        });
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        requestLogger.error('Request failed', {
          error: error.message,
          statusCode: error.status || 500,
          duration: `${duration}ms`,
        });
        throw error;
      })
    );
  }
}

// ============================================================================
// GUARD DE AUTENTICAÇÃO COM LOGGING
// ============================================================================

class AuthGuard {
  constructor(private logger: any) {}

  canActivate(context: any): boolean {
    const request = context.switchToHttp().getRequest();
    const authLogger = this.logger.child({
      guard: 'AuthGuard',
      url: request.url,
      method: request.method,
    });

    const token = request.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      authLogger.warn('Unauthorized request - no token', {
        ip: request.ip,
        userAgent: request.get('User-Agent'),
      });
      return false;
    }

    try {
      // Simular validação do token
      authLogger.debug('Validating token');

      // Simular token válido
      request.user = { id: '123', role: 'user' };

      authLogger.info('User authenticated', {
        userId: request.user.id,
        role: request.user.role,
      });

      return true;
    } catch (error) {
      authLogger.error('Token validation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }
}

// ============================================================================
// EXCEPTION FILTER COM LOGGING
// ============================================================================

class LoggingExceptionFilter {
  constructor(private logger: any) {}

  catch(exception: any, host: any) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();

    const errorLogger = this.logger.child({
      filter: 'LoggingExceptionFilter',
      url: request.url,
      method: request.method,
      statusCode: exception.status || 500,
    });

    errorLogger.error('Unhandled exception', {
      error: exception.message,
      stack: exception.stack,
      requestId: request.id,
    });

    response.status(exception.status || 500).json({
      error: 'Internal server error',
      requestId: request.id,
      timestamp: new Date().toISOString(),
    });
  }
}

// ============================================================================
// MIDDLEWARE DE LOGGING PARA NESTJS
// ============================================================================

class LoggingMiddleware {
  constructor(private logger: any) {}

  use(req: any, res: any, next: any) {
    const requestLogger = this.logger.child({
      middleware: 'LoggingMiddleware',
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
    });

    requestLogger.info('Request received');

    const startTime = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      requestLogger.info('Request completed', {
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        contentLength: res.get('Content-Length') || 0,
      });
    });

    res.on('error', (error: Error) => {
      requestLogger.error('Response error', {
        error: error.message,
        stack: error.stack,
      });
    });

    next();
  }
}

// ============================================================================
// EXEMPLO DE USO COMPLETO
// ============================================================================

async function demonstrateNestJSIntegration() {
  console.log('=== INTEGRAÇÃO COM NESTJS ===\n');

  // Criar logger principal
  const mainLogger = createLogger({
    service: 'nestjs-app',
    level: 'info',
  });

  // Simular configuração do módulo
  const loggerModule = LoggerModule.forRoot();
  console.log('Logger module configured:', loggerModule);

  // Simular service com logger
  const service = new NestJSService(mainLogger);
  await service.processData({ id: 'data-123', type: 'user' });

  // Simular controller com logger
  const controller = new NestJSController(mainLogger);
  await controller.handleRequest({
    id: 'req-456',
    method: 'POST',
    url: '/api/users',
  });

  // Simular interceptor
  const interceptor = new LoggingInterceptor(mainLogger);
  console.log('Logging interceptor created');

  // Simular guard
  const authGuard = new AuthGuard(mainLogger);
  console.log('Auth guard created');

  // Simular exception filter
  const exceptionFilter = new LoggingExceptionFilter(mainLogger);
  console.log('Exception filter created');

  // Simular middleware
  const middleware = new LoggingMiddleware(mainLogger);
  console.log('Logging middleware created');

  console.log('\n=== INTEGRAÇÃO CONCLUÍDA ===');
}

// Executar demonstração
demonstrateNestJSIntegration();

export {
  LoggerModule,
  NestJSService,
  NestJSController,
  LoggingInterceptor,
  AuthGuard,
  LoggingExceptionFilter,
  LoggingMiddleware,
};
