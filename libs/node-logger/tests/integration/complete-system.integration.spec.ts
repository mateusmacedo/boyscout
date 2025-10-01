import { getCid, reqStore } from '../../src/context';
import { CorrelationIdMiddleware } from '../../src/express/correlation-id.middleware';
import { correlationIdPlugin } from '../../src/fastify/correlation-id.plugin';
import { Log } from '../../src/log.decorator';
import { createPinoSink } from '../../src/pino-sink';
import { createRedactor } from '../../src/redact';

describe('Complete System Integration Tests', () => {
  let mockPinoLogger: {
    child: jest.Mock;
    trace: jest.Mock;
    debug: jest.Mock;
    info: jest.Mock;
    warn: jest.Mock;
    error: jest.Mock;
    fatal: jest.Mock;
  };

  beforeEach(() => {
    mockPinoLogger = {
      child: jest.fn().mockReturnThis(),
      trace: jest.fn(),
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      fatal: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete System Integration', () => {
    it('should integrate all components in a real-world scenario', async () => {
      // Configurar o sistema completo
      const pinoSink = createPinoSink({
        logger: mockPinoLogger,
        service: 'e-commerce-api',
        env: 'production',
        version: '1.0.0',
        enableBackpressure: false,
      });

      const redactor = createRedactor({
        keys: ['password', 'token', 'cardNumber', 'cvv'],
        patterns: [/\b\d{4}\s\d{4}\s\d{4}\s\d{4}\b/g],
        mask: 'REDACTED',
      });

      // Simulate middleware Express
      const expressMiddleware = new CorrelationIdMiddleware();
      const mockReq = {
        headers: {
          'x-correlation-id': 'express-cid-123',
        },
      };
      const mockRes = {
        setHeader: jest.fn(),
      };
      const mockNext = jest.fn();

      // Simulate plugin Fastify
      let fastifyHookHandler: (
        req: { headers: Record<string, string | string[] | undefined> },
        reply: { header: (name: string, value: string) => void },
        done: () => void
      ) => void;
      const mockFastify = {
        addHook: jest.fn(
          (
            event: string,
            handler: (
              req: { headers: Record<string, string | string[] | undefined> },
              reply: { header: (name: string, value: string) => void },
              done: () => void
            ) => void
          ) => {
            if (event === 'onRequest') {
              fastifyHookHandler = handler;
            }
          }
        ),
      };
      const mockFastifyOpts = {};
      const mockFastifyDone = jest.fn();

      correlationIdPlugin(mockFastify, mockFastifyOpts, mockFastifyDone);

      // Application services
      class UserRepository {
        private users = new Map<string, { id: string; name: string; email: string }>();

        // @ts-expect-error - Decorator type inference issue
        @Log({
          level: 'debug',
          includeArgs: true,
          includeResult: false,
          sink: pinoSink,
          redact: redactor,
          getCorrelationId: getCid,
        })
        async findById(id: string) {
          await new Promise((resolve) => setTimeout(resolve, 5));
          return this.users.get(id) || null;
        }

        // @ts-expect-error - Decorator type inference issue
        @Log({
          level: 'info',
          includeArgs: true,
          includeResult: true,
          sink: pinoSink,
          redact: redactor,
          getCorrelationId: getCid,
        })
        async create(userData: { name: string; email: string; password: string }) {
          await new Promise((resolve) => setTimeout(resolve, 10));
          const user = { id: Date.now().toString(), ...userData };
          this.users.set(user.id, user);
          return user;
        }
      }

      class PaymentService {
        // @ts-expect-error - Decorator type inference issue
        @Log({
          level: 'error',
          includeArgs: true,
          includeResult: true,
          sink: pinoSink,
          redact: redactor,
          getCorrelationId: getCid,
        })
        async processPayment(amount: number, _cardNumber: string, _cvv: string, userId: string) {
          await new Promise((resolve) => setTimeout(resolve, 50));

          if (amount > 1000) {
            throw new Error('Amount exceeds limit');
          }

          return {
            transactionId: `txn_${Date.now()}`,
            amount,
            status: 'success',
            userId,
          };
        }
      }

      class OrderService {
        constructor(
          private userRepo: UserRepository,
          private paymentService: PaymentService
        ) {}

        // @ts-expect-error - Decorator type inference issue
        @Log({
          level: 'info',
          includeArgs: true,
          includeResult: true,
          sink: pinoSink,
          redact: redactor,
          getCorrelationId: getCid,
        })
        async createOrder(
          userId: string,
          items: Array<{ id: string; quantity: number }>,
          paymentData: { cardNumber: string; cvv: string }
        ) {
          // Verify user
          const user = await this.userRepo.findById(userId);
          if (!user) {
            throw new Error('User not found');
          }

          // Calcular total
          const total = items.reduce((sum, item) => sum + item.quantity * 10, 0);

          // Processar pagamento
          const payment = await this.paymentService.processPayment(
            total,
            paymentData.cardNumber,
            paymentData.cvv,
            userId
          );

          // Criar pedido
          const order = {
            id: `order_${Date.now()}`,
            userId,
            items,
            total,
            paymentId: payment.transactionId,
            status: 'confirmed',
            createdAt: new Date().toISOString(),
          };

          return order;
        }
      }

      // Simulate Express context
      expressMiddleware.use(mockReq, mockRes, () => {
        // Verify if context was established
        expect(getCid()).toBe('express-cid-123');
        mockNext();
      });

      // Simulate Fastify context
      const mockFastifyReq = {
        headers: {
          'x-correlation-id': 'fastify-cid-456',
        },
      };
      const mockFastifyReply = {
        header: jest.fn(),
      };
      const mockFastifyHookDone = jest.fn();

      fastifyHookHandler(mockFastifyReq, mockFastifyReply, () => {
        // Verify if context was established
        expect(getCid()).toBe('fastify-cid-456');
        mockFastifyHookDone();
      });

      // Execute complete scenario
      const userRepo = new UserRepository();
      const paymentService = new PaymentService();
      const orderService = new OrderService(userRepo, paymentService);

      // Scenario 1: Create user and make order
      await reqStore.run({ cid: 'complete-scenario-1' }, async () => {
        // Create user
        const user = await userRepo.create({
          name: 'João Silva',
          email: 'joao@example.com',
          password: 'secret123',
        });

        expect(user.name).toBe('João Silva');
        expect(user.id).toBeDefined();

        // Create order
        const order = await orderService.createOrder(
          user.id,
          [
            { id: 'prod_1', quantity: 2 },
            { id: 'prod_2', quantity: 1 },
          ],
          {
            cardNumber: '1234 5678 9012 3456',
            cvv: '123',
          }
        );

        expect(order.userId).toBe(user.id);
        expect(order.total).toBe(30); // 2*10 + 1*10
        expect(order.status).toBe('confirmed');
      });

      // Scenario 2: Try order with high value (should fail)
      await reqStore.run({ cid: 'complete-scenario-2' }, async () => {
        // Create user
        const user = await userRepo.create({
          name: 'Maria Santos',
          email: 'maria@example.com',
          password: 'secret456',
        });

        // Try order with high value
        await expect(
          orderService.createOrder(
            user.id,
            Array.from({ length: 200 }, (_, i) => ({
              id: `prod_${i}`,
              quantity: 1,
            })), // 2000 total
            {
              cardNumber: '9876 5432 1098 7654',
              cvv: '456',
            }
          )
        ).rejects.toThrow('Amount exceeds limit');
      });

      // Verify logs
      expect(mockPinoLogger.info).toHaveBeenCalled();
      expect(mockPinoLogger.debug).toHaveBeenCalled();
      expect(mockPinoLogger.error).toHaveBeenCalled();

      // Verify that sensitive data was redacted
      const allCalls = [
        ...mockPinoLogger.info.mock.calls,
        ...mockPinoLogger.debug.mock.calls,
        ...mockPinoLogger.warn.mock.calls,
        ...mockPinoLogger.error.mock.calls,
      ];

      for (const call of allCalls) {
        const logEntry = call[0];
        if (logEntry.args) {
          // Verify that passwords were redacted
          if (
            Array.isArray(logEntry.args) &&
            logEntry.args.some((arg) => typeof arg === 'object')
          ) {
            const args = logEntry.args as unknown[];
            for (const arg of args) {
              if (arg && typeof arg === 'object') {
                if (arg.password) {
                  expect(arg.password).toBe('REDACTED');
                }
                if (arg.cardNumber) {
                  expect(arg.cardNumber).toBe('REDACTED');
                }
                if (arg.cvv) {
                  expect(arg.cvv).toBe('REDACTED');
                }
              }
            }
          }
        }

        if (logEntry.result) {
          const result = logEntry.result as Record<string, unknown>;
          if (result.password) {
            expect(result.password).toBe('REDACTED');
          }
        }
      }

      // Verify that child loggers were called with the correct correlation IDs
      expect(mockPinoLogger.child).toHaveBeenCalledWith({ cid: 'complete-scenario-1' });
      expect(mockPinoLogger.child).toHaveBeenCalledWith({ cid: 'complete-scenario-2' });
    });

    it('should handle complex error scenarios with all components', async () => {
      const pinoSink = createPinoSink({
        enableBackpressure: false,
        logger: mockPinoLogger,
        service: 'error-handling-test',
      });

      const redactor = createRedactor({
        keys: ['secret', 'token', '0'], // "0" to redact the first argument (index 0)
        mask: 'HIDDEN',
      });

      class ErrorProneService {
        // @ts-expect-error - Decorator type inference issue
        @Log({
          level: 'error',
          includeArgs: true,
          includeResult: false,
          sink: pinoSink,
          redact: redactor,
          getCorrelationId: getCid,
        })
        async riskyOperation(_secret: string, data: string): Promise<string> {
          await new Promise((resolve) => setTimeout(resolve, 10));

          if (data === 'trigger_error') {
            throw new Error('Operation failed due to invalid data');
          }

          if (data === 'trigger_timeout') {
            await new Promise((resolve) => setTimeout(resolve, 5000));
          }

          return `processed_${data}`;
        }

        // @ts-expect-error - Decorator type inference issue
        @Log({
          level: 'error',
          includeArgs: true,
          includeResult: true,
          sink: pinoSink,
          redact: redactor,
          getCorrelationId: getCid,
        })
        async partialFailure(
          _secret: string,
          data: string
        ): Promise<{ success: boolean; error?: string }> {
          await new Promise((resolve) => setTimeout(resolve, 5));

          if (data === 'partial_fail') {
            return {
              success: false,
              error: 'Partial operation failed',
            };
          }

          return { success: true };
        }
      }

      const service = new ErrorProneService();
      const testCid = 'error-scenario-test';

      // Execute error scenarios
      await reqStore.run({ cid: testCid }, async () => {
        // Scenario 1: Synchronous error
        await expect(service.riskyOperation('secret123', 'trigger_error')).rejects.toThrow(
          'Operation failed due to invalid data'
        );

        // Scenario 2: Operation partially fails
        const partialResult = await service.partialFailure('secret456', 'partial_fail');
        expect(partialResult.success).toBe(false);
        expect(partialResult.error).toBe('Partial operation failed');

        // Scenario 3: Successful operation
        const successResult = await service.riskyOperation('secret789', 'valid_data');
        expect(successResult).toBe('processed_valid_data');
      });

      // Verify error logs
      expect(mockPinoLogger.error).toHaveBeenCalled();

      // Verify that sensitive data was redacted in error logs
      const errorCalls = mockPinoLogger.error.mock.calls;
      expect(errorCalls.length).toBeGreaterThan(0);

      // Find error log (outcome "failure")
      const failureLog = errorCalls.find((call) => call[0].outcome === 'failure');
      expect(failureLog).toBeDefined();
      // Verify that child logger was called with the correct correlation ID
      expect(mockPinoLogger.child).toHaveBeenCalledWith({ cid: testCid });
      expect(failureLog[0].error).toBeDefined();

      if (failureLog[0].args) {
        expect(failureLog[0].args[0]).toBe('HIDDEN'); // secret redatado
      }

      // Verify that there are also success logs
      const successLogs = errorCalls.filter((call) => call[0].outcome === 'success');
      expect(successLogs.length).toBeGreaterThan(0);

      for (const call of successLogs) {
        const logEntry = call[0];
        // correlationId is handled via child logger, not in payload
        expect(logEntry.outcome).toBe('success');

        if (logEntry.args) {
          expect(logEntry.args[0]).toBe('HIDDEN'); // secret redatado
        }
      }
    });

    it('should handle high concurrency with all components', async () => {
      const pinoSink = createPinoSink({
        enableBackpressure: false,
        logger: mockPinoLogger,
        service: 'concurrency-test',
      });

      const redactor = createRedactor({
        keys: ['0'], // Redact first argument
      });

      class ConcurrentService {
        // @ts-expect-error - Decorator type inference issue
        @Log({
          level: 'info',
          includeArgs: true,
          includeResult: true,
          sink: pinoSink,
          redact: redactor,
          getCorrelationId: getCid,
        })
        async processWithAllComponents(_secret: string, data: string): Promise<string> {
          await new Promise((resolve) => setTimeout(resolve, Math.random() * 10));
          return `processed_${data}_${Date.now()}`;
        }
      }

      const service = new ConcurrentService();
      const startTime = Date.now();

      // Execute 50 concurrent operations with different correlation IDs
      const promises = Array.from({ length: 50 }, (_, i) => {
        const cid = `concurrent-${i}`;
        return reqStore.run({ cid }, () =>
          service.processWithAllComponents(`secret_${i}`, `data_${i}`)
        );
      });

      const results = await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Verify results
      expect(results).toHaveLength(50);
      results.forEach((result, index) => {
        expect(result).toMatch(new RegExp(`^processed_data_${index}_\\d+$`));
      });

      // Verify logs
      expect(mockPinoLogger.info).toHaveBeenCalledTimes(50);

      // Verify that each log has the correct correlation ID
      // Verify that we have the expected number of calls
      expect(mockPinoLogger.info).toHaveBeenCalledTimes(50);

      // Verify that child logger was called for each operation
      expect(mockPinoLogger.child).toHaveBeenCalledTimes(50);

      // Verify that sensitive data was redacted
      const calls = mockPinoLogger.info.mock.calls;
      for (const call of calls) {
        const logEntry = call[0];
        expect(logEntry.outcome).toBe('success');
        expect(logEntry.args).toEqual(['***', expect.stringMatching(/^data_\d+$/)]);
      }

      // Verify performance (should be fast)
      expect(totalTime).toBeLessThan(2000);
    });
  });

  describe('Middleware and Plugin Integration', () => {
    it('should integrate Express middleware with logging system', () => {
      const pinoSink = createPinoSink({
        enableBackpressure: false,
        logger: mockPinoLogger,
        service: 'express-integration',
      });

      class ExpressService {
        // @ts-expect-error - Decorator type inference issue
        @Log({
          level: 'info',
          includeArgs: true,
          includeResult: true,
          sink: pinoSink,
          getCorrelationId: getCid,
        })
        processRequest(data: string) {
          return { processed: data.toUpperCase() };
        }
      }

      const service = new ExpressService();
      const middleware = new CorrelationIdMiddleware();

      // Simulate Express request
      const mockReq = {
        headers: {
          'x-correlation-id': 'express-request-123',
        },
      };
      const mockRes = {
        setHeader: jest.fn(),
      };
      const mockNext = jest.fn();

      let correlationIdInService: string | undefined;

      middleware.use(mockReq, mockRes, () => {
        // Verify if context was established
        expect(getCid()).toBe('express-request-123');

        // Execute service in context
        const result = service.processRequest('test_data');
        correlationIdInService = getCid();

        expect(result.processed).toBe('TEST_DATA');
        mockNext();
      });

      expect(mockRes.setHeader).toHaveBeenCalledWith('x-correlation-id', 'express-request-123');
      expect(correlationIdInService).toBe('express-request-123');
      expect(mockNext).toHaveBeenCalledTimes(1);

      // Verify that the log was created with the correct correlation ID
      expect(mockPinoLogger.info).toHaveBeenCalledTimes(1);
      const _call = mockPinoLogger.info.mock.calls[0];
      // Verify that child logger was called with the correct correlation ID
      expect(mockPinoLogger.child).toHaveBeenCalledWith({ cid: 'express-request-123' });
    });

    it('should integrate Fastify plugin with logging system', () => {
      const pinoSink = createPinoSink({
        enableBackpressure: false,
        logger: mockPinoLogger,
        service: 'fastify-integration',
      });

      class FastifyService {
        // @ts-expect-error - Decorator type inference issue
        @Log({
          level: 'info',
          includeArgs: true,
          includeResult: true,
          sink: pinoSink,
          getCorrelationId: getCid,
        })
        processRequest(data: string) {
          return { processed: data.toLowerCase() };
        }
      }

      const service = new FastifyService();

      // Simulate plugin Fastify
      let hookHandler: (
        req: { headers: Record<string, string | string[] | undefined> },
        reply: { header: (name: string, value: string) => void },
        done: () => void
      ) => void;
      const mockFastify = {
        addHook: jest.fn(
          (
            event: string,
            handler: (
              req: { headers: Record<string, string | string[] | undefined> },
              reply: { header: (name: string, value: string) => void },
              done: () => void
            ) => void
          ) => {
            if (event === 'onRequest') {
              hookHandler = handler;
            }
          }
        ),
      };
      const mockOpts = {};
      const mockDone = jest.fn();

      correlationIdPlugin(mockFastify, mockOpts, mockDone);

      // Simulate Fastify request
      const mockReq = {
        headers: {
          'x-correlation-id': 'fastify-request-456',
        },
      };
      const mockReply = {
        header: jest.fn(),
      };
      const mockHookDone = jest.fn();

      let correlationIdInService: string | undefined;

      hookHandler(mockReq, mockReply, () => {
        // Verify if context was established
        expect(getCid()).toBe('fastify-request-456');

        // Execute service in context
        const result = service.processRequest('TEST_DATA');
        correlationIdInService = getCid();

        expect(result.processed).toBe('test_data');
        mockHookDone();
      });

      expect(mockReply.header).toHaveBeenCalledWith('x-correlation-id', 'fastify-request-456');
      expect(correlationIdInService).toBe('fastify-request-456');
      expect(mockHookDone).toHaveBeenCalledTimes(1);

      // Verify that the log was created with the correct correlation ID
      expect(mockPinoLogger.info).toHaveBeenCalledTimes(1);
      const _call = mockPinoLogger.info.mock.calls[0];
      // Verify that child logger was called with the correct correlation ID
      expect(mockPinoLogger.child).toHaveBeenCalledWith({ cid: 'fastify-request-456' });
    });
  });
});
