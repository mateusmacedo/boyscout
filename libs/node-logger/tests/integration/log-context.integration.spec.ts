import { getCid, reqStore } from '../../src/context';
import { Log } from '../../src/log.decorator';
import type { LogEntry } from '../../src/types';

describe('Log Decorator + Context Integration', () => {
  let capturedLogs: LogEntry[] = [];
  let logSink: (entry: LogEntry) => void;

  beforeEach(() => {
    capturedLogs = [];
    logSink = (entry: LogEntry) => {
      capturedLogs.push(entry);
    };
  });

  describe('Correlation ID Integration', () => {
    it('should include correlation ID when available in context', () => {
      class UserService {
        // @ts-expect-error - Decorator type inference issue
        @Log({
          sink: logSink,
          getCorrelationId: getCid,
        })
        createUser(username: string) {
          return { id: 1, username };
        }
      }

      const userService = new UserService();
      const testCid = 'test-correlation-id-123';

      // Simulate context with correlation ID
      reqStore.run({ cid: testCid }, () => {
        userService.createUser('john_doe');
      });

      expect(capturedLogs).toHaveLength(1);
      const logEntry = capturedLogs[0];
      expect(logEntry).toBeDefined();

      expect(logEntry?.correlationId).toBe(testCid);
      expect(logEntry.outcome).toBe('success');
      expect(logEntry.scope).toEqual({
        className: 'UserService',
        methodName: 'createUser',
      });
    });

    it('should handle missing correlation ID gracefully', () => {
      class UserService {
        // @ts-expect-error - Decorator type inference issue
        @Log({
          sink: logSink,
          getCorrelationId: getCid,
        })
        createUser(username: string) {
          return { id: 1, username };
        }
      }

      const userService = new UserService();

      // Execute outside reqStore context
      userService.createUser('john_doe');

      expect(capturedLogs).toHaveLength(1);
      const logEntry = capturedLogs[0];

      expect(logEntry.correlationId).toBeUndefined();
      expect(logEntry.outcome).toBe('success');
    });

    it('should maintain correlation ID across async operations', async () => {
      class UserService {
        // @ts-expect-error - Decorator type inference issue
        @Log({
          sink: logSink,
          getCorrelationId: getCid,
        })
        async createUserAsync(username: string): Promise<{ id: number; username: string }> {
          await new Promise((resolve) => setTimeout(resolve, 10));
          return { id: 1, username };
        }
      }

      const userService = new UserService();
      const testCid = 'async-correlation-id-456';

      // Simulate context with correlation ID for async operation
      await reqStore.run({ cid: testCid }, async () => {
        await userService.createUserAsync('jane_doe');
      });

      expect(capturedLogs).toHaveLength(1);
      const logEntry = capturedLogs[0];
      expect(logEntry).toBeDefined();

      expect(logEntry?.correlationId).toBe(testCid);
      expect(logEntry.outcome).toBe('success');
      expect(logEntry.scope).toEqual({
        className: 'UserService',
        methodName: 'createUserAsync',
      });
    });

    it('should handle correlation ID in error scenarios', () => {
      class UserService {
        // @ts-expect-error - Decorator type inference issue
        @Log({
          sink: logSink,
          getCorrelationId: getCid,
        })
        createUserWithError(_username: string) {
          throw new Error('User creation failed');
        }
      }

      const userService = new UserService();
      const testCid = 'error-correlation-id-789';

      // Simulate context with correlation ID for error scenario
      reqStore.run({ cid: testCid }, () => {
        expect(() => {
          userService.createUserWithError('error_user');
        }).toThrow('User creation failed');
      });

      expect(capturedLogs).toHaveLength(1);
      const logEntry = capturedLogs[0];
      expect(logEntry).toBeDefined();

      expect(logEntry?.correlationId).toBe(testCid);
      expect(logEntry.outcome).toBe('failure');
      expect(logEntry.error).toBeDefined();
      expect(logEntry.error?.message).toBe('User creation failed');
    });

    it('should handle correlation ID in async error scenarios', async () => {
      class UserService {
        // @ts-expect-error - Decorator type inference issue
        @Log({
          sink: logSink,
          getCorrelationId: getCid,
        })
        async createUserWithAsyncError(_username: string): Promise<never> {
          await new Promise((resolve) => setTimeout(resolve, 10));
          throw new Error('Async user creation failed');
        }
      }

      const userService = new UserService();
      const testCid = 'async-error-correlation-id-101';

      // Simulate context with correlation ID for async error scenario
      await reqStore.run({ cid: testCid }, async () => {
        await expect(userService.createUserWithAsyncError('async_error_user')).rejects.toThrow(
          'Async user creation failed'
        );
      });

      expect(capturedLogs).toHaveLength(1);
      const logEntry = capturedLogs[0];
      expect(logEntry).toBeDefined();

      expect(logEntry?.correlationId).toBe(testCid);
      expect(logEntry.outcome).toBe('failure');
      expect(logEntry.error).toBeDefined();
      expect(logEntry.error?.message).toBe('Async user creation failed');
    });
  });

  describe('Context Isolation', () => {
    it('should isolate correlation IDs between different contexts', () => {
      class UserService {
        // @ts-expect-error - Decorator type inference issue
        @Log({
          sink: logSink,
          getCorrelationId: getCid,
        })
        createUser(username: string) {
          return { id: 1, username };
        }
      }

      const userService = new UserService();
      const cid1 = 'context-1-id';
      const cid2 = 'context-2-id';

      // Execute in different contexts
      reqStore.run({ cid: cid1 }, () => {
        userService.createUser('user1');
      });

      reqStore.run({ cid: cid2 }, () => {
        userService.createUser('user2');
      });

      expect(capturedLogs).toHaveLength(2);

      expect(capturedLogs[0]?.correlationId).toBe(cid1);
      expect(capturedLogs[0]?.args).toEqual(['user1']);

      expect(capturedLogs[1]?.correlationId).toBe(cid2);
      expect(capturedLogs[1]?.args).toEqual(['user2']);
    });

    it('should not leak correlation ID outside context', () => {
      class UserService {
        // @ts-expect-error - Decorator type inference issue
        @Log({
          sink: logSink,
          getCorrelationId: getCid,
        })
        createUser(username: string) {
          return { id: 1, username };
        }
      }

      const userService = new UserService();
      const testCid = 'leak-test-id';

      // Execute inside context
      reqStore.run({ cid: testCid }, () => {
        userService.createUser('context_user');
      });

      // Execute outside context
      userService.createUser('outside_user');

      expect(capturedLogs).toHaveLength(2);

      expect(capturedLogs[0]?.correlationId).toBe(testCid);
      expect(capturedLogs[1]?.correlationId).toBeUndefined();
    });
  });
});
