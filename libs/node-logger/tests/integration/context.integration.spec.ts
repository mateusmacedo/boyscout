import { ensureCid, getCid, reqStore } from '../../src/context';
import { Log } from '../../src/log.decorator';
import { createPinoSink } from '../../src/pino-sink';
import { createRedactor } from '../../src/redact';

describe('Context Integration Tests', () => {
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

  describe('Context with Log Decorator Integration', () => {
    it('should maintain context across multiple decorated methods', async () => {
      const pinoSink = createPinoSink({ logger: mockPinoLogger });

      class ContextService {
        // @ts-expect-error - Decorator type inference issue
        @Log({
          level: 'info',
          includeArgs: true,
          includeResult: true,
          sink: pinoSink,
          getCorrelationId: getCid,
        })
        async method1(data: string): Promise<string> {
          await new Promise((resolve) => setTimeout(resolve, 10));
          return `processed_${data}`;
        }

        // @ts-expect-error - Decorator type inference issue
        @Log({
          level: 'debug',
          includeArgs: true,
          includeResult: false,
          sink: pinoSink,
          getCorrelationId: getCid,
        })
        async method2(data: string): Promise<string> {
          await new Promise((resolve) => setTimeout(resolve, 5));
          return `transformed_${data}`;
        }

        // @ts-expect-error - Decorator type inference issue
        @Log({
          level: 'warn',
          includeArgs: false,
          includeResult: true,
          sink: pinoSink,
          getCorrelationId: getCid,
        })
        async method3(): Promise<{ status: string }> {
          await new Promise((resolve) => setTimeout(resolve, 15));
          return { status: 'completed' };
        }
      }

      const service = new ContextService();
      const testCid = 'context-chain-test';

      // Execute method chain in the same context
      await reqStore.run({ cid: testCid }, async () => {
        const result1 = await service.method1('data1');
        expect(result1).toBe('processed_data1');

        const result2 = await service.method2('data2');
        expect(result2).toBe('transformed_data2');

        const result3 = await service.method3();
        expect(result3.status).toBe('completed');
      });

      // Verify that all logs have the same correlation ID
      expect(mockPinoLogger.info).toHaveBeenCalledTimes(1);
      expect(mockPinoLogger.debug).toHaveBeenCalledTimes(1);
      expect(mockPinoLogger.warn).toHaveBeenCalledTimes(1);

      const allCalls = [
        ...mockPinoLogger.info.mock.calls,
        ...mockPinoLogger.debug.mock.calls,
        ...mockPinoLogger.warn.mock.calls,
      ];

      for (const call of allCalls) {
        expect(call[0].correlationId).toBe(testCid);
      }
    });

    it('should handle context isolation between different operations', async () => {
      const pinoSink = createPinoSink({ logger: mockPinoLogger });

      class IsolatedService {
        // @ts-expect-error - Decorator type inference issue
        @Log({
          level: 'info',
          includeArgs: true,
          includeResult: false,
          sink: pinoSink,
          getCorrelationId: getCid,
        })
        async processData(data: string): Promise<string> {
          await new Promise((resolve) => setTimeout(resolve, 10));
          return `processed_${data}`;
        }
      }

      const service = new IsolatedService();
      const cid1 = 'operation-1';
      const cid2 = 'operation-2';

      // Execute operations in different contexts
      const promise1 = reqStore.run({ cid: cid1 }, () => service.processData('data1'));
      const promise2 = reqStore.run({ cid: cid2 }, () => service.processData('data2'));

      await Promise.all([promise1, promise2]);

      // Verify that each log has its own correlation ID
      expect(mockPinoLogger.info).toHaveBeenCalledTimes(2);

      const calls = mockPinoLogger.info.mock.calls;
      expect(calls[0][0].correlationId).toBe(cid1);
      expect(calls[1][0].correlationId).toBe(cid2);
      expect(calls[0][0].correlationId).not.toBe(calls[1][0].correlationId);
    });

    it('should handle context with error scenarios', async () => {
      const pinoSink = createPinoSink({ logger: mockPinoLogger });

      class ErrorService {
        // @ts-expect-error - Decorator type inference issue
        @Log({
          level: 'error',
          includeArgs: true,
          includeResult: false,
          sink: pinoSink,
          getCorrelationId: getCid,
        })
        async riskyOperation(data: string): Promise<string> {
          await new Promise((resolve) => setTimeout(resolve, 10));
          throw new Error(`Operation failed: ${data}`);
        }

        // @ts-expect-error - Decorator type inference issue
        @Log({
          level: 'info',
          includeArgs: true,
          includeResult: true,
          sink: pinoSink,
          getCorrelationId: getCid,
        })
        async safeOperation(data: string): Promise<string> {
          await new Promise((resolve) => setTimeout(resolve, 5));
          return `safe_${data}`;
        }
      }

      const service = new ErrorService();
      const testCid = 'error-context-test';

      // Execute operations in the same context
      await reqStore.run({ cid: testCid }, async () => {
        // Operation that fails
        await expect(service.riskyOperation('error_data')).rejects.toThrow(
          'Operation failed: error_data'
        );

        // Operation that works
        const result = await service.safeOperation('safe_data');
        expect(result).toBe('safe_safe_data');
      });

      // Verify logs
      expect(mockPinoLogger.error).toHaveBeenCalledTimes(1);
      expect(mockPinoLogger.info).toHaveBeenCalledTimes(1);

      // Verify that both logs have the same correlation ID
      const errorCall = mockPinoLogger.error.mock.calls[0];
      const infoCall = mockPinoLogger.info.mock.calls[0];

      expect(errorCall[0].correlationId).toBe(testCid);
      expect(infoCall[0].correlationId).toBe(testCid);
      expect(errorCall[0].outcome).toBe('failure');
      expect(infoCall[0].outcome).toBe('success');
    });
  });

  describe('Context with Redaction Integration', () => {
    it('should maintain context while redacting sensitive data', async () => {
      const pinoSink = createPinoSink({ logger: mockPinoLogger });
      const redactor = createRedactor({
        keys: ['password', 'token', '0', '1'], // "0" to redact first argument, "1" for second
        mask: 'REDACTED',
      });

      class SecureService {
        // @ts-expect-error - Decorator type inference issue
        @Log({
          level: 'info',
          includeArgs: true,
          includeResult: true,
          sink: pinoSink,
          redact: redactor,
          getCorrelationId: getCid,
        })
        async authenticateUser(
          _username: string,
          _password: string
        ): Promise<{ token: string; userId: string }> {
          await new Promise((resolve) => setTimeout(resolve, 10));
          return {
            token: `jwt_${Date.now()}`,
            userId: `user_${Date.now()}`,
          };
        }

        // @ts-expect-error - Decorator type inference issue
        @Log({
          level: 'debug',
          includeArgs: true,
          includeResult: false,
          sink: pinoSink,
          redact: redactor,
          getCorrelationId: getCid,
        })
        async validateToken(token: string): Promise<boolean> {
          await new Promise((resolve) => setTimeout(resolve, 5));
          return token.startsWith('jwt_');
        }
      }

      const service = new SecureService();
      const testCid = 'secure-context-test';

      // Execute operations in context
      await reqStore.run({ cid: testCid }, async () => {
        const auth = await service.authenticateUser('john_doe', 'secret123');
        expect(auth.token).toMatch(/^jwt_\d+$/);
        expect(auth.userId).toMatch(/^user_\d+$/);

        const isValid = await service.validateToken(auth.token);
        expect(isValid).toBe(true);
      });

      // Verify logs
      expect(mockPinoLogger.info).toHaveBeenCalledTimes(1);
      expect(mockPinoLogger.debug).toHaveBeenCalledTimes(1);

      // Verify that sensitive data was redacted
      const infoCall = mockPinoLogger.info.mock.calls[0];
      const debugCall = mockPinoLogger.debug.mock.calls[0];

      expect(infoCall[0].correlationId).toBe(testCid);
      expect(debugCall[0].correlationId).toBe(testCid);

      // Verify redaction in arguments
      expect(infoCall[0].args).toEqual(['REDACTED', 'REDACTED']);
      expect(debugCall[0].args).toEqual(['REDACTED']);

      // Verify redaction in result
      expect(infoCall[0].result).toEqual({
        token: 'REDACTED',
        userId: expect.stringMatching(/^user_\d+$/),
      });
    });
  });

  describe('Context with Complex Scenarios', () => {
    it('should handle nested context operations', async () => {
      const pinoSink = createPinoSink({ logger: mockPinoLogger });

      class NestedService {
        // @ts-expect-error - Decorator type inference issue
        @Log({
          level: 'info',
          includeArgs: true,
          includeResult: true,
          sink: pinoSink,
          getCorrelationId: getCid,
        })
        async outerOperation(data: string): Promise<string> {
          await new Promise((resolve) => setTimeout(resolve, 10));

          // Call internal operation in the same context
          const innerResult = await this.innerOperation(data);

          return `outer_${innerResult}`;
        }

        // @ts-expect-error - Decorator type inference issue
        @Log({
          level: 'debug',
          includeArgs: true,
          includeResult: false,
          sink: pinoSink,
          getCorrelationId: getCid,
        })
        async innerOperation(data: string): Promise<string> {
          await new Promise((resolve) => setTimeout(resolve, 5));
          return `inner_${data}`;
        }
      }

      const service = new NestedService();
      const testCid = 'nested-context-test';

      // Execute external operation in context
      await reqStore.run({ cid: testCid }, async () => {
        const result = await service.outerOperation('test_data');
        expect(result).toBe('outer_inner_test_data');
      });

      // Verify logs
      expect(mockPinoLogger.info).toHaveBeenCalledTimes(1);
      expect(mockPinoLogger.debug).toHaveBeenCalledTimes(1);

      // Verify that both logs have the same correlation ID
      const infoCall = mockPinoLogger.info.mock.calls[0];
      const debugCall = mockPinoLogger.debug.mock.calls[0];

      expect(infoCall[0].correlationId).toBe(testCid);
      expect(debugCall[0].correlationId).toBe(testCid);
    });

    it('should handle context with concurrent operations', async () => {
      const pinoSink = createPinoSink({ logger: mockPinoLogger });

      class ConcurrentService {
        // @ts-expect-error - Decorator type inference issue
        @Log({
          level: 'info',
          includeArgs: true,
          includeResult: true,
          sink: pinoSink,
          getCorrelationId: getCid,
        })
        async processItem(item: string): Promise<string> {
          await new Promise((resolve) => setTimeout(resolve, Math.random() * 20));
          return `processed_${item}`;
        }
      }

      const service = new ConcurrentService();
      const startTime = Date.now();

      // Execute multiple concurrent operations with different contexts
      const promises = Array.from({ length: 10 }, (_, i) => {
        const cid = `concurrent-${i}`;
        return reqStore.run({ cid }, () => service.processItem(`item_${i}`));
      });

      const results = await Promise.all(promises);
      const endTime = Date.now();

      // Verify results
      expect(results).toHaveLength(10);
      results.forEach((result, index) => {
        expect(result).toBe(`processed_item_${index}`);
      });

      // Verify logs
      expect(mockPinoLogger.info).toHaveBeenCalledTimes(10);

      // Verify that each log has its own correlation ID
      const calls = mockPinoLogger.info.mock.calls;
      const correlationIds = calls.map((call) => call[0].correlationId);
      const uniqueCorrelationIds = new Set(correlationIds);

      expect(uniqueCorrelationIds.size).toBe(10);

      // Verify performance
      expect(endTime - startTime).toBeLessThan(1000);
    });

    it('should handle context with ensureCid function', () => {
      // Test ensureCid with different scenarios
      expect(ensureCid('valid-cid')).toBe('valid-cid');
      expect(ensureCid('')).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
      expect(ensureCid(undefined)).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
      expect(ensureCid(['cid1', 'cid2'])).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );

      // Test ensureCid with context
      const testCid = 'ensure-cid-test';
      reqStore.run({ cid: testCid }, () => {
        expect(getCid()).toBe(testCid);
        expect(ensureCid('override-cid')).toBe('override-cid');
      });
    });
  });

  describe('Context Performance and Edge Cases', () => {
    it('should handle rapid context switches efficiently', async () => {
      const pinoSink = createPinoSink({ logger: mockPinoLogger });

      class RapidService {
        // @ts-expect-error - Decorator type inference issue
        @Log({
          level: 'debug',
          includeArgs: false,
          includeResult: false,
          sink: pinoSink,
          getCorrelationId: getCid,
        })
        fastOperation(): number {
          return Math.random();
        }
      }

      const service = new RapidService();
      const startTime = Date.now();

      // Execute 100 operations with different contexts quickly
      const promises = Array.from({ length: 100 }, (_, i) => {
        const cid = `rapid-${i}`;
        return reqStore.run({ cid }, () => service.fastOperation());
      });

      const results = await Promise.all(promises);
      const endTime = Date.now();

      // Verify results
      expect(results).toHaveLength(100);
      for (const result of results) {
        expect(typeof result).toBe('number');
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThan(1);
      }

      // Verify logs
      expect(mockPinoLogger.debug).toHaveBeenCalledTimes(100);

      // Verify performance (should be very fast)
      expect(endTime - startTime).toBeLessThan(500);
    });

    it('should handle context with undefined correlation ID', async () => {
      const pinoSink = createPinoSink({ logger: mockPinoLogger });

      class UndefinedService {
        // @ts-expect-error - Decorator type inference issue
        @Log({
          level: 'info',
          includeArgs: true,
          includeResult: true,
          sink: pinoSink,
          getCorrelationId: getCid,
        })
        async processData(data: string): Promise<string> {
          await new Promise((resolve) => setTimeout(resolve, 5));
          return `processed_${data}`;
        }
      }

      const service = new UndefinedService();

      // Execute without context (correlation ID will be undefined)
      const result = await service.processData('test');
      expect(result).toBe('processed_test');

      // Verify log
      expect(mockPinoLogger.info).toHaveBeenCalledTimes(1);
      const call = mockPinoLogger.info.mock.calls[0];
      expect(call[0].correlationId).toBeUndefined();
      expect(call[0].outcome).toBe('success');
    });

    it('should handle context with empty correlation ID', async () => {
      const pinoSink = createPinoSink({ logger: mockPinoLogger });

      class EmptyService {
        // @ts-expect-error - Decorator type inference issue
        @Log({
          level: 'info',
          includeArgs: true,
          includeResult: true,
          sink: pinoSink,
          getCorrelationId: getCid,
        })
        async processData(data: string): Promise<string> {
          await new Promise((resolve) => setTimeout(resolve, 5));
          return `processed_${data}`;
        }
      }

      const service = new EmptyService();

      // Execute with empty correlation ID
      await reqStore.run({ cid: '' }, async () => {
        const result = await service.processData('test');
        expect(result).toBe('processed_test');
      });

      // Verify log
      expect(mockPinoLogger.info).toHaveBeenCalledTimes(1);
      const call = mockPinoLogger.info.mock.calls[0];
      expect(call[0].correlationId).toBe('');
      expect(call[0].outcome).toBe('success');
    });
  });
});
