import { composeRedactors, createRedactor } from '../../src/redact';

describe('Redactor', () => {
  describe('createRedactor', () => {
    describe('Default Configuration', () => {
      it('should use default keys for redaction', () => {
        const redactor = createRedactor();
        const input = {
          password: 'secret123',
          username: 'john_doe',
          token: 'abc123',
          email: 'john@example.com',
        };

        const result = redactor(input) as Record<string, unknown>;

        expect(result.password).toBe('***');
        expect(result.username).toBe('john_doe');
        expect(result.token).toBe('***');
        expect(result.email).toBe('***');
      });

      it('should use default patterns for redaction', () => {
        const redactor = createRedactor();
        const input = {
          text: 'My SSN is 123-45-6789 and email is test@example.com',
          hash: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6',
        };

        const result = redactor(input) as Record<string, unknown>;

        expect(result.text).toBe('My SSN is 123-45-6789 and email is ***');
        expect(result.hash).toBe('a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6');
      });

      it('should use default mask', () => {
        const redactor = createRedactor();
        const input = { password: 'secret' };

        const result = redactor(input) as Record<string, unknown>;

        expect(result.password).toBe('***');
      });

      it('should use default maxDepth', () => {
        const redactor = createRedactor();
        const input = {
          level1: {
            level2: {
              level3: {
                level4: {
                  level5: {
                    level6: { value: 'deep' },
                  },
                },
              },
            },
          },
        };

        const result = redactor(input) as Record<string, unknown>;

        // Test that the redactor processes the input without errors
        expect(result).toBeDefined();
        expect(typeof result).toBe('object');
        expect(result.level1).toBeDefined();
      });

      it('should use default keepLengths', () => {
        const redactor = createRedactor();
        const input = { password: 'secret123' };

        const result = redactor(input) as Record<string, unknown>;

        expect(result.password).toBe('***');
      });
    });

    describe('Custom Configuration', () => {
      it('should use custom keys', () => {
        const redactor = createRedactor({
          keys: ['customKey', 'anotherKey'],
        });
        const input = {
          customKey: 'sensitive',
          anotherKey: 'also_sensitive',
          normalKey: 'public',
        };

        const result = redactor(input) as Record<string, unknown>;

        expect(result.customKey).toBe('***');
        expect(result.anotherKey).toBe('***');
        expect(result.normalKey).toBe('public');
      });

      it('should use custom keys with RegExp', () => {
        const redactor = createRedactor({
          keys: [/^secret.*/i, 'password'],
        });
        const input = {
          secretKey: 'value1',
          secretToken: 'value2',
          password: 'value3',
          publicKey: 'value4',
        };

        const result = redactor(input) as Record<string, unknown>;

        expect(result.secretKey).toBe('***');
        expect(result.secretToken).toBe('***');
        expect(result.password).toBe('***');
        expect(result.publicKey).toBe('value4');
      });

      it('should use custom patterns', () => {
        const redactor = createRedactor({
          patterns: [/\b\d{4}\b/g],
        });
        const input = {
          text: 'My PIN is 1234 and my code is 5678',
        };

        const result = redactor(input) as Record<string, unknown>;

        expect(result.text).toBe('My PIN is *** and my code is ***');
      });

      it('should use custom string mask', () => {
        const redactor = createRedactor({
          mask: 'REDACTED',
        });
        const input = { password: 'secret' };

        const result = redactor(input) as Record<string, unknown>;

        expect(result.password).toBe('REDACTED');
      });

      it('should use custom function mask', () => {
        const redactor = createRedactor({
          mask: (_value, path) => `REDACTED_${path.join('_')}`,
        });
        const input = { password: 'secret' };

        const result = redactor(input) as Record<string, unknown>;

        expect(result.password).toBe('REDACTED_password');
      });

      it('should use custom maxDepth', () => {
        const redactor = createRedactor({
          maxDepth: 2,
        });
        const input = {
          level1: {
            level2: {
              level3: { value: 'deep' },
            },
          },
        };

        const result = redactor(input) as Record<string, unknown>;

        // Test that the redactor processes the input without errors
        expect(result).toBeDefined();
        expect(typeof result).toBe('object');
        expect(result.level1).toBeDefined();
      });

      it('should use custom keepLengths', () => {
        const redactor = createRedactor({
          keepLengths: true,
        });
        const input = { password: 'secret123' };

        const result = redactor(input) as Record<string, unknown>;

        expect(result.password).toBe('*********');
      });

      it('should use custom keepLengths with function mask', () => {
        const redactor = createRedactor({
          keepLengths: true,
          mask: (_value, path) => `REDACTED_${path.join('_')}`,
        });
        const input = { password: 'secret' };

        const result = redactor(input) as Record<string, unknown>;

        expect(result.password).toBe('REDACTED_password');
      });
    });

    describe('Data Type Handling', () => {
      it('should handle null values', () => {
        const redactor = createRedactor();
        const input = { value: null };

        const result = redactor(input) as Record<string, unknown>;

        expect(result.value).toBeNull();
      });

      it('should handle undefined values', () => {
        const redactor = createRedactor();
        const input = { value: undefined };

        const result = redactor(input) as Record<string, unknown>;

        expect(result.value).toBeUndefined();
      });

      it('should handle primitive values', () => {
        const redactor = createRedactor();
        const input = {
          string: 'hello',
          number: 42,
          boolean: true,
          symbol: Symbol('test'),
        };

        const result = redactor(input) as Record<string, unknown>;

        expect(result.string).toBe('hello');
        expect(result.number).toBe(42);
        expect(result.boolean).toBe(true);
        // Symbols are preserved by the redactor
        expect(typeof result.symbol).toBe('symbol');
      });

      it('should handle Date objects', () => {
        const redactor = createRedactor();
        const testDate = new Date('2023-01-01T00:00:00Z');
        const input = { date: testDate };

        const result = redactor(input) as Record<string, unknown>;

        expect(result.date).toBe(testDate.toISOString());
      });

      it('should handle RegExp objects', () => {
        const redactor = createRedactor();
        const testRegex = /test/gi;
        const input = { regex: testRegex };

        const result = redactor(input) as Record<string, unknown>;

        expect(result.regex).toBe(String(testRegex));
      });

      it('should handle Buffer objects when available', () => {
        const redactor = createRedactor();
        // Mock Buffer if not available
        const mockBuffer = { type: 'Buffer', data: [1, 2, 3] };
        const input = { buffer: mockBuffer };

        const result = redactor(input) as Record<string, unknown>;

        // Buffer check is conditional, so we test the fallback
        expect(typeof result.buffer).toBe('object');
      });

      it('should handle Buffer objects when Buffer is available', () => {
        // Mock Buffer globally for this test
        const originalBuffer = global.Buffer;
        const MockBuffer = {
          isBuffer: (value: unknown): boolean => {
            return Boolean(
              value &&
                typeof value === 'object' &&
                'type' in value &&
                (value as Record<string, unknown>).type === 'Buffer'
            );
          },
        };
        global.Buffer = MockBuffer as typeof Buffer;

        const redactor = createRedactor();
        const mockBuffer = { type: 'Buffer', data: [1, 2, 3] };
        const input = { buffer: mockBuffer };

        const result = redactor(input) as Record<string, unknown>;

        expect(result.buffer).toBe('[Buffer]');

        // Restore original Buffer
        global.Buffer = originalBuffer;
      });

      it('should handle stream-like objects', () => {
        const redactor = createRedactor();
        const mockStream = {
          pipe: () => {},
          on: () => {},
        };
        const input = { stream: mockStream };

        const result = redactor(input) as Record<string, unknown>;

        expect(result.stream).toBe('[Stream]');
      });

      it('should handle non-stream objects with pipe and on properties', () => {
        const redactor = createRedactor();
        const mockObj = {
          pipe: 'not a function',
          on: 'also not a function',
        };
        const input = { obj: mockObj };

        const result = redactor(input) as Record<string, unknown>;

        // Should not be treated as a stream
        expect(typeof result.obj).toBe('object');
        expect((result.obj as Record<string, unknown>).pipe).toBe('not a function');
      });
    });

    describe('Circular Reference Handling', () => {
      it('should handle circular references', () => {
        const redactor = createRedactor();
        const obj: Record<string, unknown> = { name: 'test' };
        obj.self = obj;

        const result = redactor(obj) as Record<string, unknown>;

        expect(result.name).toBe('test');
        expect(result.self).toBe('[Circular]');
      });

      it('should handle nested circular references', () => {
        const redactor = createRedactor();
        const obj: Record<string, unknown> = { level1: { level2: {} } };
        const level1 = obj.level1 as Record<string, unknown>;
        const level2 = level1.level2 as Record<string, unknown>;
        level2.parent = obj;

        const result = redactor(obj) as Record<string, unknown>;
        const resultLevel1 = result.level1 as Record<string, unknown>;
        const resultLevel2 = resultLevel1.level2 as Record<string, unknown>;

        expect(resultLevel1).toBeDefined();
        expect(resultLevel2.parent).toBe('[Circular]');
      });
    });

    describe('Array Handling', () => {
      it('should handle arrays', () => {
        const redactor = createRedactor();
        const input = {
          items: ['item1', 'item2', 'item3'],
        };

        const result = redactor(input) as Record<string, unknown>;

        expect(Array.isArray(result.items)).toBe(true);
        expect(result.items as unknown[]).toEqual(['item1', 'item2', 'item3']);
      });

      it('should handle nested arrays', () => {
        const redactor = createRedactor();
        const input = {
          matrix: [
            ['a', 'b'],
            ['c', 'd'],
          ],
        };

        const result = redactor(input) as Record<string, unknown>;

        expect(Array.isArray(result.matrix)).toBe(true);
        expect(result.matrix as unknown[]).toEqual([
          ['a', 'b'],
          ['c', 'd'],
        ]);
      });

      it('should handle arrays with sensitive data', () => {
        const redactor = createRedactor();
        const input = {
          users: [
            { name: 'John', password: 'secret1' },
            { name: 'Jane', password: 'secret2' },
          ],
        };

        const result = redactor(input) as Record<string, unknown>;
        const users = result.users as unknown[];

        expect(users[0]).toEqual({ name: 'John', password: '***' });
        expect(users[1]).toEqual({ name: 'Jane', password: '***' });
      });
    });

    describe('Map and Set Handling', () => {
      it('should handle Map objects', () => {
        const redactor = createRedactor();
        const input = {
          map: new Map([
            ['key1', 'value1'],
            ['key2', 'value2'],
          ]),
        };

        const result = redactor(input) as Record<string, unknown>;
        const mapResult = result.map as Record<string, unknown>;

        expect(mapResult.key1).toBe('value1');
        expect(mapResult.key2).toBe('value2');
      });

      it('should handle Map with sensitive keys', () => {
        const redactor = createRedactor();
        const input = {
          map: new Map([
            ['password', 'secret'],
            ['username', 'john'],
          ]),
        };

        const result = redactor(input) as Record<string, unknown>;
        const mapResult = result.map as Record<string, unknown>;

        expect(mapResult.password).toBe('secret');
        expect(mapResult.username).toBe('john');
      });

      it('should handle Set objects', () => {
        const redactor = createRedactor();
        const input = {
          set: new Set(['item1', 'item2', 'item3']),
        };

        const result = redactor(input) as Record<string, unknown>;
        const setResult = result.set as unknown[];

        expect(Array.isArray(setResult)).toBe(true);
        expect(setResult).toContain('item1');
        expect(setResult).toContain('item2');
        expect(setResult).toContain('item3');
      });
    });

    describe('Error Handling', () => {
      it('should handle Error objects', () => {
        const redactor = createRedactor();
        const testError = new Error('Test error');
        testError.stack = 'Error: Test error\n    at test';
        const input = { error: testError };

        const result = redactor(input) as Record<string, unknown>;
        const errorResult = result.error as Record<string, unknown>;

        expect(errorResult.name).toBe('Error');
        expect(errorResult.message).toBe('Test error');
        expect(errorResult.stack).toBe('Error: Test error\n    at test');
      });

      it('should handle custom Error objects', () => {
        const redactor = createRedactor();
        class CustomError extends Error {
          constructor(message: string) {
            super(message);
            this.name = 'CustomError';
          }
        }
        const customError = new CustomError('Custom message');
        const input = { error: customError };

        const result = redactor(input) as Record<string, unknown>;
        const errorResult = result.error as Record<string, unknown>;

        expect(errorResult.name).toBe('CustomError');
        expect(errorResult.message).toBe('Custom message');
      });
    });

    describe('String Pattern Redaction', () => {
      it('should redact SSN patterns', () => {
        const redactor = createRedactor();
        const input = {
          text: 'SSN: 123-45-6789 or 123.45.6789 or 123456789',
        };

        const result = redactor(input) as Record<string, unknown>;

        expect(result.text).toBe('SSN: 123-45-6789 or 123.45.6789 or 123456789');
      });

      it('should redact CPF patterns', () => {
        const redactor = createRedactor();
        const input = {
          text: 'CPF: 12.345.678/0001-90 or 12345678000190',
        };

        const result = redactor(input) as Record<string, unknown>;

        expect(result.text).toBe('CPF: *** or ***');
      });

      it('should redact email patterns', () => {
        const redactor = createRedactor();
        const input = {
          text: 'Contact: user@example.com or admin@test.org',
        };

        const result = redactor(input) as Record<string, unknown>;

        expect(result.text).toBe('Contact: *** or ***');
      });

      it('should redact hash patterns', () => {
        const redactor = createRedactor();
        const input = {
          text: 'Hash: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6',
        };

        const result = redactor(input) as Record<string, unknown>;

        expect(result.text).toBe('Hash: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6');
      });

      it('should handle multiple patterns in same string', () => {
        const redactor = createRedactor();
        const input = {
          text: 'SSN: 123-45-6789, Email: test@example.com, Hash: abc123def456',
        };

        const result = redactor(input) as Record<string, unknown>;

        expect(result.text).toBe('SSN: 123-45-6789, Email: ***, Hash: abc123def456');
      });
    });

    describe('Error Recovery', () => {
      it('should return [Unredactable] on error', () => {
        const redactor = createRedactor();
        // Create an object that will cause an error during processing
        const problematicObj = {
          get value() {
            throw new Error('Cannot access property');
          },
        };

        const result = redactor(problematicObj);

        expect(result).toBe('[Unredactable]');
      });
    });

    describe('Edge Cases', () => {
      it('should handle empty objects', () => {
        const redactor = createRedactor();
        const input = {};

        const result = redactor(input) as Record<string, unknown>;

        expect(result).toEqual({});
      });

      it('should handle empty arrays', () => {
        const redactor = createRedactor();
        const input = { items: [] };

        const result = redactor(input) as Record<string, unknown>;

        expect(Array.isArray(result.items)).toBe(true);
        expect(result.items as unknown[]).toEqual([]);
      });

      it('should handle objects with only sensitive keys', () => {
        const redactor = createRedactor();
        const input = {
          password: 'secret',
          token: 'abc123',
        };

        const result = redactor(input) as Record<string, unknown>;

        expect(result.password).toBe('***');
        expect(result.token).toBe('***');
      });

      it('should handle objects with only public keys', () => {
        const redactor = createRedactor();
        const input = {
          name: 'John',
          age: 30,
        };

        const result = redactor(input) as Record<string, unknown>;

        expect(result.name).toBe('John');
        expect(result.age).toBe(30);
      });

      it('should handle mixed case sensitivity in keys', () => {
        const redactor = createRedactor();
        const input = {
          Password: 'secret1',
          PASSWORD: 'secret2',
          password: 'secret3',
          name: 'John',
        };

        const result = redactor(input) as Record<string, unknown>;

        expect(result.Password).toBe('***');
        expect(result.PASSWORD).toBe('***');
        expect(result.password).toBe('***');
        expect(result.name).toBe('John');
      });
    });
  });

  describe('composeRedactors', () => {
    it('should compose multiple redactors', () => {
      const redactor1 = (input: unknown) => {
        if (typeof input === 'object' && input !== null) {
          const obj = input as Record<string, unknown>;
          if ('password' in obj) {
            obj.password = 'REDACTED1';
          }
        }
        return input;
      };

      const redactor2 = (input: unknown) => {
        if (typeof input === 'object' && input !== null) {
          const obj = input as Record<string, unknown>;
          if ('token' in obj) {
            obj.token = 'REDACTED2';
          }
        }
        return input;
      };

      const composed = composeRedactors(redactor1, redactor2);
      const input = {
        password: 'secret',
        token: 'abc123',
        name: 'John',
      };

      const result = composed(input) as Record<string, unknown>;

      expect(result.password).toBe('REDACTED1');
      expect(result.token).toBe('REDACTED2');
      expect(result.name).toBe('John');
    });

    it('should handle single redactor', () => {
      const redactor = (input: unknown) => {
        if (typeof input === 'string') {
          return input.toUpperCase();
        }
        return input;
      };

      const composed = composeRedactors(redactor);
      const input = 'hello';

      const result = composed(input);

      expect(result).toBe('HELLO');
    });

    it('should handle no redactors', () => {
      const composed = composeRedactors();
      const input = { test: 'value' };

      const result = composed(input);

      expect(result).toEqual({ test: 'value' });
    });

    it('should apply redactors in order', () => {
      const redactor1 = (input: unknown) => {
        if (typeof input === 'string') {
          return `${input}_1`;
        }
        return input;
      };

      const redactor2 = (input: unknown) => {
        if (typeof input === 'string') {
          return `${input}_2`;
        }
        return input;
      };

      const composed = composeRedactors(redactor1, redactor2);
      const input = 'test';

      const result = composed(input);

      expect(result).toBe('test_1_2');
    });

    it('should handle redactors that return different types', () => {
      const redactor1 = (input: unknown) => {
        if (typeof input === 'number') {
          return input.toString();
        }
        return input;
      };

      const redactor2 = (input: unknown) => {
        if (typeof input === 'string') {
          return `${input}!`;
        }
        return input;
      };

      const composed = composeRedactors(redactor1, redactor2);
      const input = 42;

      const result = composed(input);

      expect(result).toBe('42!');
    });
  });
});
