import { getCid, reqStore } from '../../src/context';
import { Log } from '../../src/log.decorator';
import { createPinoSink } from '../../src/pino-sink';
import type { LogEntry } from '../../src/types';

describe('PinoSink Integration Tests', () => {
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

  describe('Basic PinoSink Integration', () => {
    it('should integrate correctly with Log decorator using default configuration', () => {
      const pinoSink = createPinoSink({ logger: mockPinoLogger });

      class UserService {
        // @ts-expect-error - Decorator type inference issue
        @Log({
          level: 'info',
          includeArgs: true,
          includeResult: true,
          sink: pinoSink,
          getCorrelationId: getCid,
        })
        createUser(username: string, email: string) {
          return { id: 1, username, email };
        }
      }

      const userService = new UserService();
      userService.createUser('john_doe', 'john@example.com');

      expect(mockPinoLogger.info).toHaveBeenCalledTimes(1);
      const call = mockPinoLogger.info.mock.calls[0];
      expect(call[0]).toMatchObject({
        timestamp: expect.any(String),
        scope: {
          className: 'UserService',
          methodName: 'createUser',
        },
        outcome: 'success',
        args: ['john_doe', '***'],
        result: { id: 1, username: 'john_doe', email: '***' },
        durationMs: expect.any(Number),
      });
      expect(call[1]).toMatch(/^UserService\.createUser success in \d+\.\d+ms$/);
    });

    it('should handle correlation ID correctly with PinoSink', () => {
      const pinoSink = createPinoSink({ logger: mockPinoLogger });

      class UserService {
        // @ts-expect-error - Decorator type inference issue
        @Log({
          level: 'debug',
          includeArgs: true,
          includeResult: false,
          sink: pinoSink,
          getCorrelationId: getCid,
        })
        authenticateUser(_token: string) {
          return { success: true, userId: 123 };
        }
      }

      const userService = new UserService();
      const testCid = 'test-correlation-id-123';

      reqStore.run({ cid: testCid }, () => {
        userService.authenticateUser('jwt_token_abc123');
      });

      expect(mockPinoLogger.child).toHaveBeenCalledWith({ cid: testCid });
      expect(mockPinoLogger.debug).toHaveBeenCalledTimes(1);
      const call = mockPinoLogger.debug.mock.calls[0];
      expect(call[0]).toMatchObject({
        correlationId: testCid,
      });
    });

    it('should handle different log levels correctly', () => {
      const pinoSink = createPinoSink({ logger: mockPinoLogger });

      class LogLevelService {
        // @ts-expect-error - Decorator type inference issue
        @Log({
          level: 'trace',
          includeArgs: false,
          includeResult: false,
          sink: pinoSink,
        })
        traceMethod() {
          return 'trace result';
        }

        // @ts-expect-error - Decorator type inference issue
        @Log({
          level: 'warn',
          includeArgs: false,
          includeResult: false,
          sink: pinoSink,
        })
        warnMethod() {
          return 'warn result';
        }

        // @ts-expect-error - Decorator type inference issue
        @Log({
          level: 'error',
          includeArgs: false,
          includeResult: false,
          sink: pinoSink,
        })
        errorMethod() {
          throw new Error('Test error');
        }
      }

      const service = new LogLevelService();

      service.traceMethod();
      service.warnMethod();
      expect(() => service.errorMethod()).toThrow('Test error');

      expect(mockPinoLogger.trace).toHaveBeenCalledTimes(1);
      expect(mockPinoLogger.warn).toHaveBeenCalledTimes(1);
      expect(mockPinoLogger.error).toHaveBeenCalledTimes(1);
    });
  });

  describe('Custom Configuration Integration', () => {
    it('should use custom message format', () => {
      const customMessageFormat = (e: LogEntry) =>
        `[${e.scope.className}] ${e.scope.methodName} - ${e.outcome} (${e.durationMs}ms)`;

      const pinoSink = createPinoSink({
        logger: mockPinoLogger,
        messageFormat: customMessageFormat,
      });

      class CustomFormatService {
        // @ts-expect-error - Decorator type inference issue
        @Log({
          level: 'info',
          includeArgs: true,
          includeResult: true,
          sink: pinoSink,
        })
        processData(data: string) {
          return { processed: data.toUpperCase() };
        }
      }

      const service = new CustomFormatService();
      service.processData('test');

      expect(mockPinoLogger.info).toHaveBeenCalledTimes(1);
      const call = mockPinoLogger.info.mock.calls[0];
      expect(call[1]).toMatch(/^\[CustomFormatService\] processData - success \(\d+\.\d+ms\)$/);
    });

    it('should include service metadata in logs', () => {
      const pinoSink = createPinoSink({
        logger: mockPinoLogger,
        service: 'user-service',
        env: 'test',
        version: '1.0.0',
      });

      class MetadataService {
        // @ts-expect-error - Decorator type inference issue
        @Log({
          level: 'info',
          includeArgs: false,
          includeResult: false,
          sink: pinoSink,
        })
        simpleOperation() {
          return 'result';
        }
      }

      const service = new MetadataService();
      service.simpleOperation();

      expect(mockPinoLogger.info).toHaveBeenCalledTimes(1);
      const call = mockPinoLogger.info.mock.calls[0];
      expect(call[0]).toMatchObject({
        scope: {
          className: 'MetadataService',
          methodName: 'simpleOperation',
        },
        outcome: 'success',
      });
    });

    it('should handle custom logger options', () => {
      const customLogger = {
        child: jest.fn().mockReturnThis(),
        info: jest.fn(),
      };

      const pinoSink = createPinoSink({ logger: customLogger });

      class CustomLoggerService {
        // @ts-expect-error - Decorator type inference issue
        @Log({
          level: 'info',
          includeArgs: true,
          includeResult: true,
          sink: pinoSink,
        })
        processItem(item: string) {
          return { item: item.toUpperCase() };
        }
      }

      const service = new CustomLoggerService();
      service.processItem('test');

      expect(customLogger.info).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling Integration', () => {
    it('should log errors correctly with PinoSink', () => {
      const pinoSink = createPinoSink({ logger: mockPinoLogger });

      class ErrorService {
        // @ts-expect-error - Decorator type inference issue
        @Log({
          level: 'error',
          includeArgs: true,
          includeResult: false,
          sink: pinoSink,
        })
        riskyOperation(data: string) {
          throw new Error(`Operation failed: ${data}`);
        }
      }

      const service = new ErrorService();

      expect(() => service.riskyOperation('test_data')).toThrow('Operation failed: test_data');

      expect(mockPinoLogger.error).toHaveBeenCalledTimes(1);
      const call = mockPinoLogger.error.mock.calls[0];
      expect(call[0]).toMatchObject({
        outcome: 'failure',
        args: ['test_data'],
        error: {
          name: 'Error',
          message: 'Operation failed: test_data',
          stack: expect.any(String),
        },
      });
    });

    it('should handle async errors correctly', async () => {
      const pinoSink = createPinoSink({ logger: mockPinoLogger });

      class AsyncErrorService {
        // @ts-expect-error - Decorator type inference issue
        @Log({
          level: 'error',
          includeArgs: true,
          includeResult: false,
          sink: pinoSink,
        })
        async asyncRiskyOperation(data: string): Promise<never> {
          await new Promise((resolve) => setTimeout(resolve, 10));
          throw new Error(`Async operation failed: ${data}`);
        }
      }

      const service = new AsyncErrorService();

      await expect(service.asyncRiskyOperation('async_data')).rejects.toThrow(
        'Async operation failed: async_data'
      );

      expect(mockPinoLogger.error).toHaveBeenCalledTimes(1);
      const call = mockPinoLogger.error.mock.calls[0];
      expect(call[0]).toMatchObject({
        outcome: 'failure',
        args: ['async_data'],
        error: {
          name: 'Error',
          message: 'Async operation failed: async_data',
          stack: expect.any(String),
        },
      });
    });
  });

  describe('Performance and Concurrency', () => {
    it('should handle multiple concurrent operations efficiently', async () => {
      const pinoSink = createPinoSink({ logger: mockPinoLogger });

      class ConcurrentService {
        // @ts-expect-error - Decorator type inference issue
        @Log({
          level: 'info',
          includeArgs: false,
          includeResult: false,
          sink: pinoSink,
        })
        async fastOperation(id: number): Promise<number> {
          await new Promise((resolve) => setTimeout(resolve, 5));
          return id * 2;
        }
      }

      const service = new ConcurrentService();
      const startTime = Date.now();

      // Execute 10 concurrent operations
      const promises = Array.from({ length: 10 }, (_, i) => service.fastOperation(i));

      const results = await Promise.all(promises);
      const endTime = Date.now();

      // Verify results
      expect(results).toHaveLength(10);
      results.forEach((result, index) => {
        expect(result).toBe(index * 2);
      });

      // Verify logs
      expect(mockPinoLogger.info).toHaveBeenCalledTimes(10);

      // Verify performance (should be fast)
      expect(endTime - startTime).toBeLessThan(1000);
    });

    it('should maintain correlation ID isolation in concurrent operations', async () => {
      const pinoSink = createPinoSink({ logger: mockPinoLogger });

      class CorrelationService {
        // @ts-expect-error - Decorator type inference issue
        @Log({
          level: 'info',
          includeArgs: true,
          includeResult: false,
          sink: pinoSink,
          getCorrelationId: getCid,
        })
        async processWithCorrelation(data: string): Promise<string> {
          await new Promise((resolve) => setTimeout(resolve, 10));
          return `processed_${data}`;
        }
      }

      const service = new CorrelationService();
      const cid1 = 'correlation-1';
      const cid2 = 'correlation-2';

      // Execute operations with different correlation IDs
      const promise1 = reqStore.run({ cid: cid1 }, () => service.processWithCorrelation('data1'));
      const promise2 = reqStore.run({ cid: cid2 }, () => service.processWithCorrelation('data2'));

      await Promise.all([promise1, promise2]);

      expect(mockPinoLogger.info).toHaveBeenCalledTimes(2);

      // Verify that each log has the correct correlation ID
      const calls = mockPinoLogger.info.mock.calls;
      expect(calls[0][0]).toMatchObject({
        correlationId: cid1,
        args: ['data1'],
      });
      expect(calls[1][0]).toMatchObject({
        correlationId: cid2,
        args: ['data2'],
      });
    });
  });

  describe('Real-world Integration Scenarios', () => {
    it('should integrate with a complete user management system', async () => {
      const pinoSink = createPinoSink({
        logger: mockPinoLogger,
        service: 'user-management',
        env: 'production',
      });

      class UserRepository {
        private users = new Map<string, { id: string; name: string; email: string }>();

        // @ts-expect-error - Decorator type inference issue
        @Log({
          level: 'debug',
          includeArgs: true,
          includeResult: false,
          sink: pinoSink,
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
          getCorrelationId: getCid,
        })
        async create(userData: { name: string; email: string }) {
          await new Promise((resolve) => setTimeout(resolve, 10));
          const user = { id: Date.now().toString(), ...userData };
          this.users.set(user.id, user);
          return user;
        }
      }

      class UserService {
        constructor(private userRepo: UserRepository) {}

        // @ts-expect-error - Decorator type inference issue
        @Log({
          level: 'info',
          includeArgs: true,
          includeResult: true,
          sink: pinoSink,
          getCorrelationId: getCid,
        })
        async createUser(name: string, email: string) {
          const user = await this.userRepo.create({ name, email });
          return user;
        }

        // @ts-expect-error - Decorator type inference issue
        @Log({
          level: 'warn',
          includeArgs: true,
          includeResult: false,
          sink: pinoSink,
          getCorrelationId: getCid,
        })
        async getUser(id: string) {
          const user = await this.userRepo.findById(id);
          if (!user) {
            throw new Error(`User not found: ${id}`);
          }
          return user;
        }
      }

      const userRepo = new UserRepository();
      const userService = new UserService(userRepo);
      const testCid = 'user-operation-123';

      // Execute operations in context
      await reqStore.run({ cid: testCid }, async () => {
        const user = await userService.createUser('João Silva', 'joao@example.com');
        expect(user.name).toBe('João Silva');

        const foundUser = await userService.getUser(user.id);
        expect(foundUser).toEqual(user);
      });

      // Verify logs
      expect(mockPinoLogger.info).toHaveBeenCalledTimes(2); // createUser, create
      expect(mockPinoLogger.debug).toHaveBeenCalledTimes(1); // findById
      expect(mockPinoLogger.warn).toHaveBeenCalledTimes(1); // getUser

      // Verify that all logs have the correct correlation ID
      const allCalls = [
        ...mockPinoLogger.info.mock.calls,
        ...mockPinoLogger.debug.mock.calls,
        ...mockPinoLogger.warn.mock.calls,
      ];

      for (const call of allCalls) {
        expect(call[0]).toMatchObject({
          correlationId: testCid,
        });
      }
    });
  });
});
