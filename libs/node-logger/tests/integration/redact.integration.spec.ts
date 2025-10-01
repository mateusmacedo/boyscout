import { getCid, reqStore } from '../../src/context';
import { Log } from '../../src/log.decorator';
import { createRedactor } from '../../src/redact';
import type { LogEntry } from '../../src/types';

describe('Redact Integration Tests', () => {
  let capturedLogs: LogEntry[] = [];
  let logSink: (entry: LogEntry) => void;

  beforeEach(() => {
    capturedLogs = [];
    logSink = (entry: LogEntry) => {
      capturedLogs.push(entry);
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
    capturedLogs = [];
  });

  describe('Basic Redaction Integration', () => {
    it('should redact sensitive data in method arguments', () => {
      const redactor = createRedactor({
        keys: ['1', '2'], // Redact indices 1 and 2 of the array (password and email)
      });

      class UserService {
        // @ts-expect-error - Decorator type inference issue
        @Log({
          redact: redactor,
          sink: logSink,
          includeArgs: true,
          includeResult: false,
        })
        createUser(username: string, _password: string, email: string) {
          return {
            id: 1,
            username,
            password: 'hashed_password_123',
            email,
            token: 'jwt_token_abc123',
          };
        }
      }

      const userService = new UserService();
      userService.createUser('john_doe', 'secret123', 'john@example.com');

      expect(capturedLogs).toHaveLength(1);
      const logEntry = capturedLogs[0];

      expect(logEntry.outcome).toBe('success');
      expect(logEntry.args).toBeDefined();
      expect(logEntry.args).toEqual(['john_doe', '***', '***']);
    });

    it('should redact sensitive data in method results', () => {
      const redactor = createRedactor({
        keys: ['password', 'token', 'ssn'],
      });

      class UserService {
        // @ts-expect-error - Decorator type inference issue
        @Log({
          redact: redactor,
          sink: logSink,
          includeArgs: false,
          includeResult: true,
        })
        getUserProfile(userId: string) {
          return {
            id: userId,
            name: 'João Silva',
            email: 'joao@example.com',
            password: 'hashed_password_123',
            token: 'jwt_token_abc123',
            ssn: '123-45-6789',
            preferences: {
              theme: 'dark',
              language: 'pt-BR',
            },
          };
        }
      }

      const userService = new UserService();
      userService.getUserProfile('123');

      expect(capturedLogs).toHaveLength(1);
      const logEntry = capturedLogs[0];

      expect(logEntry.outcome).toBe('success');
      expect(logEntry.result).toBeDefined();
      expect(logEntry.result).toEqual({
        id: '123',
        name: 'João Silva',
        email: '***',
        password: '***',
        token: '***',
        ssn: '***',
        preferences: {
          theme: 'dark',
          language: 'pt-BR',
        },
      });
    });

    it('should use custom mask for redacted values', () => {
      const redactor = createRedactor({
        keys: ['0', '1'],
        mask: 'REDACTED',
      });

      class SecureService {
        // @ts-expect-error - Decorator type inference issue
        @Log({
          redact: redactor,
          sink: logSink,
          includeArgs: true,
          includeResult: false,
        })
        authenticateUser(_secret: string, _apiKey: string) {
          return { success: true, userId: 123 };
        }
      }

      const service = new SecureService();
      service.authenticateUser('my_secret', 'my_api_key');

      expect(capturedLogs).toHaveLength(1);
      const logEntry = capturedLogs[0];

      expect(logEntry.outcome).toBe('success');
      expect(logEntry.args).toBeDefined();
      expect(logEntry.args).toEqual(['REDACTED', 'REDACTED']);
    });
  });

  describe('Advanced Redaction Patterns', () => {
    it('should redact credit card numbers using regex patterns', () => {
      const redactor = createRedactor({
        patterns: [/\b\d{4}\s\d{4}\s\d{4}\s\d{4}\b/g],
        keepLengths: true,
      });

      class PaymentService {
        // @ts-expect-error - Decorator type inference issue
        @Log({
          redact: redactor,
          sink: logSink,
          includeArgs: true,
          includeResult: true,
        })
        processPayment(cardNumber: string, amount: number) {
          return {
            transactionId: 'txn_123',
            cardNumber,
            amount,
            status: 'success',
          };
        }
      }

      const service = new PaymentService();
      service.processPayment('1234 5678 9012 3456', 99.99);

      expect(capturedLogs).toHaveLength(1);
      const logEntry = capturedLogs[0];

      expect(logEntry.outcome).toBe('success');
      expect(logEntry.args).toBeDefined();
      expect(logEntry.args).toEqual([
        '*******************', // 19 caracteres (mantendo comprimento)
        99.99,
      ]);
      expect(logEntry.result).toEqual({
        transactionId: 'txn_123',
        cardNumber: '*******************',
        amount: 99.99,
        status: 'success',
      });
    });

    it('should redact email addresses using default patterns', () => {
      const redactor = createRedactor({
        keys: ['0'], // Redact only the first argument
      });

      class EmailService {
        // @ts-expect-error - Decorator type inference issue
        @Log({
          redact: redactor,
          sink: logSink,
          includeArgs: true,
          includeResult: false,
        })
        sendEmail(_email: string, _subject: string, _message: string) {
          return { success: true, messageId: 'msg_123' };
        }
      }

      const service = new EmailService();
      service.sendEmail('user@example.com', 'Test Subject', 'Hello World');

      expect(capturedLogs).toHaveLength(1);
      const logEntry = capturedLogs[0];

      expect(logEntry.outcome).toBe('success');
      expect(logEntry.args).toBeDefined();
      expect(logEntry.args).toEqual(['***', 'Test Subject', 'Hello World']);
    });

    it('should redact nested sensitive data', () => {
      const redactor = createRedactor({
        keys: ['password', 'token', 'secret'],
      });

      class ConfigService {
        // @ts-expect-error - Decorator type inference issue
        @Log({
          redact: redactor,
          sink: logSink,
          includeArgs: false,
          includeResult: true,
        })
        getConfiguration() {
          return {
            app: {
              name: 'MyApp',
              version: '1.0.0',
              secret: 'app_secret_123',
            },
            database: {
              host: 'localhost',
              port: 5432,
              password: 'db_password_456',
            },
            api: {
              baseUrl: 'https://api.example.com',
              token: 'api_token_789',
              timeout: 5000,
            },
          };
        }
      }

      const service = new ConfigService();
      service.getConfiguration();

      expect(capturedLogs).toHaveLength(1);
      const logEntry = capturedLogs[0];

      expect(logEntry.outcome).toBe('success');
      expect(logEntry.result).toBeDefined();
      expect(logEntry.result).toEqual({
        app: {
          name: 'MyApp',
          version: '1.0.0',
          secret: '***',
        },
        database: {
          host: 'localhost',
          port: 5432,
          password: '***',
        },
        api: {
          baseUrl: 'https://api.example.com',
          token: '***',
          timeout: 5000,
        },
      });
    });
  });

  describe('Redaction with Correlation ID', () => {
    it('should maintain correlation ID while redacting sensitive data', () => {
      const redactor = createRedactor({
        keys: ['1'], // Redact the second argument (password)
      });

      class AuthService {
        // @ts-expect-error - Decorator type inference issue
        @Log({
          redact: redactor,
          sink: logSink,
          includeArgs: true,
          includeResult: false,
          getCorrelationId: getCid,
        })
        authenticateUser(_username: string, _password: string) {
          return { success: true, userId: 123 };
        }
      }

      const service = new AuthService();
      const testCid = 'auth-correlation-id-123';

      reqStore.run({ cid: testCid }, () => {
        service.authenticateUser('john_doe', 'secret123');
      });

      expect(capturedLogs).toHaveLength(1);
      const logEntry = capturedLogs[0];

      expect(logEntry.correlationId).toBe(testCid);
      expect(logEntry.outcome).toBe('success');
      expect(logEntry.args).toBeDefined();
      expect(logEntry.args).toEqual(['john_doe', '***']);
    });

    it('should redact sensitive data in error scenarios with correlation ID', () => {
      const redactor = createRedactor({
        keys: ['0'], // Redact the first argument (secret)
      });

      class SecureService {
        // @ts-expect-error - Decorator type inference issue
        @Log({
          redact: redactor,
          sink: logSink,
          includeArgs: true,
          includeResult: false,
          getCorrelationId: getCid,
        })
        riskyOperation(_secret: string, _data: string) {
          throw new Error('Operation failed');
        }
      }

      const service = new SecureService();
      const testCid = 'error-correlation-id-456';

      reqStore.run({ cid: testCid }, () => {
        expect(() => {
          service.riskyOperation('my_secret', 'public_data');
        }).toThrow('Operation failed');
      });

      expect(capturedLogs).toHaveLength(1);
      const logEntry = capturedLogs[0];

      expect(logEntry.correlationId).toBe(testCid);
      expect(logEntry.outcome).toBe('failure');
      expect(logEntry.args).toBeDefined();
      expect(logEntry.args).toEqual(['***', 'public_data']);
      expect(logEntry.error).toBeDefined();
    });
  });

  describe('Performance and Complex Scenarios', () => {
    it('should handle large objects with redaction efficiently', () => {
      const redactor = createRedactor({
        keys: ['password', 'token', 'secret'],
      });

      class DataService {
        // @ts-expect-error - Decorator type inference issue
        @Log({
          redact: redactor,
          sink: logSink,
          includeArgs: false,
          includeResult: true,
        })
        processLargeDataset() {
          const largeObject = {
            metadata: {
              version: '1.0.0',
              timestamp: new Date().toISOString(),
              secret: 'very_secret_key_123',
            },
            users: Array.from({ length: 100 }, (_, i) => ({
              id: i + 1,
              name: `User ${i + 1}`,
              email: `user${i + 1}@example.com`,
              password: `password_${i + 1}`,
              token: `token_${i + 1}`,
              preferences: {
                theme: 'dark',
                language: 'pt-BR',
              },
            })),
            config: {
              api: {
                baseUrl: 'https://api.example.com',
                token: 'api_token_456',
                timeout: 5000,
              },
              database: {
                host: 'localhost',
                port: 5432,
                password: 'db_password_789',
              },
            },
          };

          return largeObject;
        }
      }

      const service = new DataService();
      const startTime = Date.now();

      service.processLargeDataset();

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      expect(capturedLogs).toHaveLength(1);
      const logEntry = capturedLogs[0];

      expect(logEntry.outcome).toBe('success');
      expect(logEntry.result).toBeDefined();

      // Verify that redaction was applied correctly
      const result = logEntry.result as Record<string, unknown>;
      expect(result.metadata.secret).toBe('***');
      expect(result.config.api.token).toBe('***');
      expect(result.config.database.password).toBe('***');

      // Verify that non-sensitive data was preserved
      expect(result.metadata.version).toBe('1.0.0');
      expect(result.users).toHaveLength(100);
      expect(result.users[0].name).toBe('User 1');
      expect(result.users[0].password).toBe('***');
      expect(result.users[0].token).toBe('***');

      // Verify performance (should be fast)
      expect(processingTime).toBeLessThan(1000);
    });

    it('should handle concurrent operations with redaction', async () => {
      const redactor = createRedactor({
        keys: ['0'], // Redact the first argument
      });

      class ConcurrentService {
        // @ts-expect-error - Decorator type inference issue
        @Log({
          redact: redactor,
          sink: logSink,
          includeArgs: true,
          includeResult: false,
          getCorrelationId: getCid,
        })
        async processWithRedaction(_secret: string, data: string): Promise<string> {
          await new Promise((resolve) => setTimeout(resolve, 10));
          return `processed_${data}`;
        }
      }

      const service = new ConcurrentService();
      const cid1 = 'concurrent-1';
      const cid2 = 'concurrent-2';

      // Execute concurrent operations
      const promise1 = reqStore.run({ cid: cid1 }, () =>
        service.processWithRedaction('secret1', 'data1')
      );
      const promise2 = reqStore.run({ cid: cid2 }, () =>
        service.processWithRedaction('secret2', 'data2')
      );

      await Promise.all([promise1, promise2]);

      expect(capturedLogs).toHaveLength(2);

      // Verify that each log has the correct correlation ID and redacted data
      expect(capturedLogs[0]?.correlationId).toBe(cid1);
      expect(capturedLogs[0]?.args).toEqual(['***', 'data1']);

      expect(capturedLogs[1]?.correlationId).toBe(cid2);
      expect(capturedLogs[1]?.args).toEqual(['***', 'data2']);
    });
  });

  describe('Real-world Integration Scenarios', () => {
    it('should integrate with a complete banking system', async () => {
      const redactor = createRedactor({
        keys: ['password', 'pin', 'cardNumber', 'cvv', 'ssn'],
        patterns: [/\b\d{4}\s\d{4}\s\d{4}\s\d{4}\b/g],
        mask: 'REDACTED',
      });

      class BankAccount {
        constructor(
          private accountNumber: string,
          private pin: string,
          private balance: number
        ) {}

        // @ts-expect-error - Decorator type inference issue
        @Log({
          redact: redactor,
          sink: logSink,
          includeArgs: true,
          includeResult: true,
          getCorrelationId: getCid,
        })
        async withdraw(amount: number, pin: string, _cardNumber: string) {
          if (pin !== this.pin) {
            throw new Error('Invalid PIN');
          }
          if (amount > this.balance) {
            throw new Error('Insufficient funds');
          }

          await new Promise((resolve) => setTimeout(resolve, 50));
          this.balance -= amount;

          return {
            success: true,
            amount,
            newBalance: this.balance,
            transactionId: `txn_${Date.now()}`,
          };
        }

        // @ts-expect-error - Decorator type inference issue
        @Log({
          redact: redactor,
          sink: logSink,
          includeArgs: false,
          includeResult: true,
          getCorrelationId: getCid,
        })
        getAccountInfo(ssn: string) {
          return {
            accountNumber: this.accountNumber,
            balance: this.balance,
            ssn,
            lastTransaction: new Date().toISOString(),
          };
        }
      }

      const account = new BankAccount('1234567890', '1234', 1000);
      const testCid = 'banking-operation-123';

      // Execute banking operations
      await reqStore.run({ cid: testCid }, async () => {
        // Saque bem-sucedido
        const withdrawal = await account.withdraw(100, '1234', '1234 5678 9012 3456');
        expect(withdrawal.success).toBe(true);
        expect(withdrawal.amount).toBe(100);

        // Get account information
        const accountInfo = account.getAccountInfo('123-45-6789');
        expect(accountInfo.accountNumber).toBe('1234567890');
        expect(accountInfo.balance).toBe(900);
      });

      expect(capturedLogs).toHaveLength(2);

      // Verify withdrawal logs
      const withdrawalLog = capturedLogs[0];
      expect(withdrawalLog?.correlationId).toBe(testCid);
      expect(withdrawalLog?.outcome).toBe('success');
      expect(withdrawalLog?.args).toEqual([100, '1234', 'REDACTED']);
      expect(withdrawalLog?.result).toEqual({
        success: true,
        amount: 100,
        newBalance: 900,
        transactionId: expect.stringMatching(/^txn_\d+$/),
      });

      // Verify account information logs
      const accountInfoLog = capturedLogs[1];
      expect(accountInfoLog?.correlationId).toBe(testCid);
      expect(accountInfoLog?.outcome).toBe('success');
      expect(accountInfoLog?.result).toEqual({
        accountNumber: '1234567890',
        balance: 900,
        ssn: 'REDACTED',
        lastTransaction: expect.any(String),
      });
    });
  });
});
