import { Log } from '../../src/log.decorator';
import { createRedactor } from '../../src/redact';
import type { LogEntry } from '../../src/types';

describe('Log Decorator + Redact Integration', () => {
  let capturedLogs: LogEntry[] = [];
  let logSink: (entry: LogEntry) => void;

  beforeEach(() => {
    capturedLogs = [];
    logSink = (entry: LogEntry) => {
      capturedLogs.push(entry);
    };
  });

  describe('Basic Redaction Integration', () => {
    it('should redact sensitive data in method arguments', () => {
      class UserService {
        // @ts-expect-error - Decorator type inference issue
        @Log({
          redact: createRedactor({
            keys: ['1', '2'], // Redact indices 1 and 2 of the array (password and email)
          }),
          sink: logSink,
          includeResult: false, // Don't include result to simplify
        })
        createUser(_username: string, _password: string, _email: string) {
          return {
            id: 1,
            username: _username,
            password: 'hashed_password_123',
            email: _email,
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

    it('should use custom redactor configuration', () => {
      class UserService {
        // @ts-expect-error - Decorator type inference issue
        @Log({
          redact: createRedactor({
            keys: ['0', '1'], // Redact indices 0 and 1 of the array (secret and apiKey)
            mask: 'REDACTED',
          }),
          sink: logSink,
        })
        authenticateUser(_secret: string, _apiKey: string) {
          return { success: true, userId: 123 };
        }
      }

      const userService = new UserService();
      userService.authenticateUser('my_secret', 'my_api_key');

      expect(capturedLogs).toHaveLength(1);
      const logEntry = capturedLogs[0];

      expect(logEntry.outcome).toBe('success');
      expect(logEntry.args).toBeDefined();
      expect(logEntry.args).toEqual(['REDACTED', 'REDACTED']);
    });
  });

  describe('Advanced Redaction Scenarios', () => {
    it('should redact credit card information with custom patterns', () => {
      class PaymentService {
        // @ts-expect-error - Decorator type inference issue
        @Log({
          redact: createRedactor({
            keys: ['1', '2'], // Redact indices 1 and 2 of the array (cvv and ssn)
            patterns: [/\b\d{4}\s\d{4}\s\d{4}\s\d{4}\b/g],
            keepLengths: true,
          }),
          sink: logSink,
        })
        processPayment(_cardNumber: string, _cvv: string, _ssn: string, amount: number) {
          return {
            transactionId: 'txn_123',
            cardNumber: '**** **** **** 1234',
            cvv: '***',
            ssn: '***-**-****',
            amount,
          };
        }
      }

      const paymentService = new PaymentService();
      paymentService.processPayment('1234 5678 9012 3456', '123', '123-45-6789', 99.99);

      expect(capturedLogs).toHaveLength(1);
      const logEntry = capturedLogs[0];

      expect(logEntry.outcome).toBe('success');
      expect(logEntry.args).toBeDefined();
      // With keepLengths: true, strings maintain their original length
      expect(logEntry.args).toEqual([
        '*******************', // Credit card number redacted by regex pattern (19 characters)
        '***', // CVV redacted by key (3 caracteres)
        '***********', // SSN redacted by key (11 caracteres)
        99.99,
      ]);
    });
  });

  describe('Error Handling with Redaction', () => {
    it('should redact sensitive data in error logs', () => {
      class ErrorProneService {
        // @ts-expect-error - Decorator type inference issue
        @Log({
          redact: createRedactor({
            keys: ['0'], // Redact index 0 of the array (password)
          }),
          sink: logSink,
        })
        riskyOperation(_password: string, _email: string) {
          throw new Error('Something went wrong');
        }
      }

      const errorService = new ErrorProneService();

      expect(() => {
        errorService.riskyOperation('secret123', 'test@example.com');
      }).toThrow('Something went wrong');

      expect(capturedLogs).toHaveLength(1);
      const logEntry = capturedLogs[0];

      expect(logEntry.outcome).toBe('failure');
      expect(logEntry.args).toBeDefined();
      // The email is being redacted by the default regex pattern (email pattern)
      expect(logEntry.args).toEqual(['***', '***']);
      expect(logEntry.error).toBeDefined();
      expect(logEntry.error?.message).toBe('Something went wrong');
    });

    it('should redact sensitive data in async error logs', async () => {
      class ErrorProneService {
        // @ts-expect-error - Decorator type inference issue
        @Log({
          redact: createRedactor({
            keys: ['0'], // Redact index 0 of the array (secret)
            mask: 'ERROR_REDACTED',
          }),
          sink: logSink,
        })
        async asyncRiskyOperation(_secret: string): Promise<string> {
          await new Promise((resolve) => setTimeout(resolve, 10));
          throw new Error('Async error occurred');
        }
      }

      const errorService = new ErrorProneService();

      await expect(errorService.asyncRiskyOperation('my_secret')).rejects.toThrow(
        'Async error occurred'
      );

      expect(capturedLogs).toHaveLength(1);
      const logEntry = capturedLogs[0];

      expect(logEntry.outcome).toBe('failure');
      expect(logEntry.args).toBeDefined();
      expect(logEntry.args).toEqual(['ERROR_REDACTED']);
      expect(logEntry.error).toBeDefined();
      expect(logEntry.error?.message).toBe('Async error occurred');
    });
  });
});
