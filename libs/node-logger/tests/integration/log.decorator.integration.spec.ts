import { Log } from '../../src/log.decorator';
import type { LogEntry } from '../../src/types';

describe('Log Decorator E2E Integration', () => {
  let capturedEntries: LogEntry[];
  let correlationIdCounter = 0;

  const getCorrelationId = () => `test-cid-${++correlationIdCounter}`;

  const mockSink = jest.fn((entry: LogEntry) => {
    capturedEntries.push(entry);
  });

  // Reusable UserService class for all tests
  class UserService {
    private readonly users = new Map<string, { id: string; name: string; email: string }>();

    constructor() {
      // Initialize with some test users
      this.users.set('1', {
        id: '1',
        name: 'João Silva',
        email: 'joao@example.com',
      });
      this.users.set('2', {
        id: '2',
        name: 'Maria Santos',
        email: 'maria@example.com',
      });
    }

    async findUserById(id: string): Promise<{ id: string; name: string; email: string } | null> {
      // Simulates an async operation
      await new Promise((resolve) => setTimeout(resolve, 10));
      return this.users.get(id) || null;
    }

    createUser(name: string, email: string): { id: string; name: string; email: string } {
      const id = (this.users.size + 1).toString();
      const user = { id, name, email };
      this.users.set(id, user);
      return user;
    }

    async updateUser(
      id: string,
      updates: Partial<{ name: string; email: string }>
    ): Promise<boolean> {
      const user = this.users.get(id);
      if (!user) {
        throw new Error(`User with ID ${id} not found`);
      }

      // Simulates an async operation
      await new Promise((resolve) => setTimeout(resolve, 15));

      this.users.set(id, { ...user, ...updates });
      return true;
    }

    async deleteUser(id: string): Promise<boolean> {
      const user = this.users.get(id);
      if (!user) {
        throw new Error(`User with ID ${id} not found`);
      }

      // Simulates an async operation
      await new Promise((resolve) => setTimeout(resolve, 20));

      return this.users.delete(id);
    }

    getAllUsers(): Array<{ id: string; name: string; email: string }> {
      return Array.from(this.users.values());
    }
  }

  beforeEach(() => {
    capturedEntries = [];
    correlationIdCounter = 0;
  });

  afterEach(() => {
    jest.clearAllMocks();
    capturedEntries = [];
  });

  describe('Real Scenario: User Service with Log Decorator', () => {
    // Extended class with Log decorators
    class LoggedUserService extends UserService {
      // @ts-expect-error - Decorator type inference issue
      @Log({
        level: 'info',
        includeArgs: true,
        includeResult: false,
        sink: mockSink,
        getCorrelationId,
      })
      override findUserById(
        id: string
      ): Promise<{ id: string; name: string; email: string } | null> {
        return super.findUserById(id);
      }

      // @ts-expect-error - Decorator type inference issue
      @Log({
        level: 'debug',
        includeArgs: true,
        includeResult: true,
        sink: mockSink,
        getCorrelationId,
      })
      override createUser(
        name: string,
        email: string
      ): { id: string; name: string; email: string } {
        return super.createUser(name, email);
      }

      // @ts-expect-error - Decorator type inference issue
      @Log({
        level: 'warn',
        includeArgs: true,
        includeResult: false,
        sink: mockSink,
        getCorrelationId,
      })
      override updateUser(
        id: string,
        updates: Partial<{ name: string; email: string }>
      ): Promise<boolean> {
        return super.updateUser(id, updates);
      }

      // @ts-expect-error - Decorator type inference issue
      @Log({
        level: 'error',
        includeArgs: true,
        includeResult: false,
        sink: mockSink,
        getCorrelationId,
      })
      override deleteUser(id: string): Promise<boolean> {
        return super.deleteUser(id);
      }

      // @ts-expect-error - Decorator type inference issue
      @Log({
        level: 'info',
        includeArgs: false,
        includeResult: true,
        sink: mockSink,
        getCorrelationId,
      })
      override getAllUsers(): Array<{
        id: string;
        name: string;
        email: string;
      }> {
        return super.getAllUsers();
      }
    }

    it('should integrate correctly with a real user service', async () => {
      const userService = new LoggedUserService();

      // Test 1: Find existing user
      const user1 = await userService.findUserById('1');
      expect(user1).toEqual({
        id: '1',
        name: 'João Silva',
        email: 'joao@example.com',
      });

      // Test 2: Create new user
      const newUser = userService.createUser('Pedro Costa', 'pedro@example.com');
      expect(newUser).toEqual({
        id: '3',
        name: 'Pedro Costa',
        email: 'pedro@example.com',
      });

      // Test 3: Update user
      const updateResult = await userService.updateUser('1', {
        name: 'João Silva Atualizado',
      });
      expect(updateResult).toBe(true);

      // Test 4: Find updated user
      const updatedUser = await userService.findUserById('1');
      expect(updatedUser?.name).toBe('João Silva Atualizado');

      // Test 5: List all users
      const allUsers = userService.getAllUsers();
      expect(allUsers).toHaveLength(3);

      expect(Array.isArray(capturedEntries)).toBe(true);
      expect(capturedEntries.length).toBeGreaterThanOrEqual(1);

      // Verify log structure
      for (const entry of capturedEntries) {
        expect(entry).toMatchObject({
          timestamp: expect.any(String),
          scope: {
            className: 'LoggedUserService',
            methodName: expect.any(String),
          },
          durationMs: expect.any(Number),
          outcome: 'success',
          correlationId: expect.stringMatching(/^test-cid-\d+$/),
        });
      }

      // Verify that each entry has a unique correlationId
      const correlationIds = capturedEntries.map((e) => e.correlationId);
      expect(new Set(correlationIds).size).toBe(5);
    });

    it('should handle errors correctly in async methods', async () => {
      const userService = new LoggedUserService();

      // Test: Try to delete non-existent user
      await expect(userService.deleteUser('999')).rejects.toThrow('User with ID 999 not found');

      expect(Array.isArray(capturedEntries)).toBe(true);
      expect(capturedEntries.length).toBeGreaterThanOrEqual(1);

      const errorEntry = capturedEntries[0];
      expect(errorEntry).toMatchObject({
        level: 'error',
        outcome: 'failure',
        scope: {
          className: 'LoggedUserService',
          methodName: 'deleteUser',
        },
        args: ['999'],
        error: {
          name: 'Error',
          message: 'User with ID 999 not found',
          stack: expect.any(String),
        },
      });
    });

    it('should respect sensitive data redaction configurations', () => {
      const redactedSink = jest.fn((entry: LogEntry) => {
        capturedEntries.push(entry);
      });

      // Redaction function that removes emails
      const redactSensitiveData = (data: unknown): unknown => {
        if (typeof data === 'string' && data.includes('@')) {
          return '[EMAIL_REDACTED]';
        }
        if (Array.isArray(data)) {
          return data.map(redactSensitiveData);
        }
        if (data && typeof data === 'object') {
          const redacted: Record<string, unknown> = {};
          for (const [key, value] of Object.entries(data)) {
            redacted[key] = redactSensitiveData(value);
          }
          return redacted;
        }
        return data;
      };

      class SecureUserService {
        // @ts-expect-error - Decorator type inference issue
        @Log({
          level: 'info',
          includeArgs: true,
          includeResult: true,
          sink: redactedSink,
          redact: redactSensitiveData,
          getCorrelationId,
        })
        createUser(name: string, email: string): { id: string; name: string; email: string } {
          return { id: '1', name, email };
        }
      }

      const secureService = new SecureUserService();
      const user = secureService.createUser('Ana Silva', 'ana@example.com');

      expect(user).toEqual({
        id: '1',
        name: 'Ana Silva',
        email: 'ana@example.com',
      });
      expect(capturedEntries).toHaveLength(1);

      expect(capturedEntries[0]?.args).toEqual(['Ana Silva', '[EMAIL_REDACTED]']);
      expect(capturedEntries[0]?.result).toEqual({
        id: '1',
        name: 'Ana Silva',
        email: '[EMAIL_REDACTED]',
      });
    });

    it('should apply sample rate correctly', async () => {
      const sampleSink = jest.fn((entry: LogEntry) => {
        capturedEntries.push(entry);
      });

      class SampledService {
        // @ts-expect-error - Decorator type inference issue
        @Log({
          level: 'info',
          includeResult: true,
          sink: sampleSink,
          sampleRate: 0.5, // 50% chance of logging
          getCorrelationId,
        })
        async processItem(item: string): Promise<string> {
          await new Promise((resolve) => setTimeout(resolve, 5));
          return `processed-${item}`;
        }
      }

      const service = new SampledService();

      // Execute multiple times to test sample rate
      const createPromise = (i: number) => service.processItem(`item-${i}`);
      const promises = Array.from({ length: 10 }, (_, i) => createPromise(i));

      await Promise.all(promises);

      // Verify that approximately 50% of logs were captured
      // (with tolerance for statistical variation - allow 1-9 logs for 10 operations)
      expect(capturedEntries.length).toBeGreaterThanOrEqual(1);
      expect(capturedEntries.length).toBeLessThanOrEqual(9);

      // Verify that all captured logs have the correct structure
      for (const entry of capturedEntries) {
        expect(entry).toMatchObject({
          level: 'info',
          outcome: 'success',
          scope: {
            className: 'SampledService',
            methodName: 'processItem',
          },
          args: expect.arrayContaining([expect.stringMatching(/^item-\d+$/)]),
          result: expect.stringMatching(/^processed-item-\d+$/),
        });
      }
    });

    it('should maintain adequate performance with multiple concurrent calls', async () => {
      const performanceSink = jest.fn((entry: LogEntry) => {
        capturedEntries.push(entry);
      });

      class PerformanceService {
        // @ts-expect-error - Decorator type inference issue
        @Log({
          level: 'debug',
          includeArgs: false,
          includeResult: false,
          sink: performanceSink,
          getCorrelationId,
        })
        fastOperation(id: number): number {
          // Very fast operation
          return id * 2;
        }
      }

      const service = new PerformanceService();
      const startTime = Date.now();

      // Execute 100 concurrent operations
      const promises = Array.from({ length: 100 }, (_, i) => service.fastOperation(i));

      const results = await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Verify that all operations were executed
      expect(results).toHaveLength(100);
      results.forEach((result, index) => {
        expect(result).toBe(index * 2);
      });

      // Verify that all logs were captured
      expect(capturedEntries).toHaveLength(100);

      // Verify that total time is reasonable (less than 1 second for 100 operations)
      expect(totalTime).toBeLessThan(1000);

      // Verify that each log has small durationMs (less than 50ms)
      for (const entry of capturedEntries) {
        expect(entry.durationMs).toBeLessThan(50);
      }
    });
  });

  describe('Real Scenario: NestJS Controller with Log Decorator', () => {
    // Simulates a real NestJS controller
    class UserController {
      private readonly userService: UserService;

      constructor() {
        this.userService = new UserService();
      }

      // @ts-expect-error - Decorator type inference issue
      @Log({
        level: 'info',
        includeArgs: true,
        includeResult: false,
        sink: mockSink,
        getCorrelationId,
      })
      async getUser(id: string): Promise<{ id: string; name: string; email: string } | null> {
        // Simulates input validation
        if (!id || id.trim() === '') {
          throw new Error('ID do usuário é obrigatório');
        }

        // Simulates authorization
        if (id === 'admin') {
          throw new Error('Acesso negado');
        }

        return await this.userService.findUserById(id);
      }

      // @ts-expect-error - Decorator type inference issue
      @Log({
        level: 'warn',
        includeArgs: true,
        includeResult: true,
        sink: mockSink,
        getCorrelationId,
      })
      createUser(data: { name: string; email: string }): {
        id: string;
        name: string;
        email: string;
      } {
        // Simulates validation
        if (!data.name || !data.email) {
          throw new Error('Nome e email são obrigatórios');
        }

        if (!data.email.includes('@')) {
          throw new Error('Email inválido');
        }

        return this.userService.createUser(data.name, data.email);
      }
    }

    it('should integrate correctly with a NestJS controller', async () => {
      const controller = new UserController();

      // Test 1: Find valid user
      const user = await controller.getUser('1');
      expect(user).toEqual({
        id: '1',
        name: 'João Silva',
        email: 'joao@example.com',
      });

      // Test 2: Create valid user
      // Remove await since createUser is not async
      const newUser = controller.createUser({
        name: 'Maria Santos',
        email: 'maria@example.com',
      });
      expect(newUser).toEqual({
        id: '3',
        name: 'Maria Santos',
        email: 'maria@example.com',
      });

      // Test 3: Try to find non-existent user
      const notFoundUser = await controller.getUser('999');
      expect(notFoundUser).toBeNull();

      // Test 4: Try to search with empty ID (should fail)
      await expect(controller.getUser('')).rejects.toThrow('ID do usuário é obrigatório');

      // Test 5: Try to create user with invalid data
      expect(() => controller.createUser({ name: '', email: 'email@example.com' })).toThrow(
        'Nome e email são obrigatórios'
      );

      // Verify logs
      expect(capturedEntries).toHaveLength(5);

      // Verify that we have success and failure logs
      const successLogs = capturedEntries.filter((e) => e.outcome === 'success');
      const failureLogs = capturedEntries.filter((e) => e.outcome === 'failure');

      expect(successLogs).toHaveLength(3);
      expect(failureLogs).toHaveLength(2);

      // Verify success log structure
      for (const entry of successLogs) {
        expect(entry).toMatchObject({
          scope: {
            className: 'UserController',
          },
        });
        expect(entry.error).toBeUndefined();
      }

      // Verify failure log structure
      for (const entry of failureLogs) {
        expect(entry).toMatchObject({
          scope: {
            className: 'UserController',
          },
          error: {
            name: 'Error',
            message: expect.any(String),
            stack: expect.any(String),
          },
        });
      }
    });
  });
});
