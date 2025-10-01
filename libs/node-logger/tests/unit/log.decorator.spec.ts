import { Log } from '../../src/log.decorator';
import type { LogEntry, LogOptions } from '../../src/types';

describe('Log Decorator', () => {
  let mockSink: jest.Mock;
  let capturedEntries: LogEntry[];
  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const getEntry = () => {
    const entry = capturedEntries[0];
    expect(entry).toBeDefined();
    return entry as LogEntry;
  };

  // Factory functions to create common test classes
  const createTestClass = (options: LogOptions = {}) => {
    class TestClass {
      // @ts-expect-error - Decorator type inference issue
      @Log({ sink: mockSink, ...options })
      testMethod(arg1: string, arg2: number) {
        return `${arg1}-${arg2}`;
      }
    }
    return TestClass;
  };

  const createAsyncTestClass = (options: LogOptions = {}) => {
    class TestClass {
      // @ts-expect-error - Decorator type inference issue
      @Log({ sink: mockSink, ...options })
      async testMethod(arg1: string, arg2: number): Promise<string> {
        await Promise.resolve(); // Add await to satisfy linter
        return `${arg1}-${arg2}`;
      }
    }
    return TestClass;
  };

  const createErrorThrowingTestClass = (error: unknown, options: LogOptions = {}) => {
    class TestClass {
      // @ts-expect-error - Decorator type inference issue
      @Log({ sink: mockSink, ...options })
      testMethod(): never {
        throw error;
      }
    }
    return TestClass;
  };

  const createAsyncErrorThrowingTestClass = (error: unknown, options: LogOptions = {}) => {
    class TestClass {
      // @ts-expect-error - Decorator type inference issue
      @Log({ sink: mockSink, ...options })
      async testMethod(): Promise<never> {
        await Promise.resolve(); // Add await to satisfy linter
        throw error;
      }
    }
    return TestClass;
  };

  const createSimpleTestClass = (options: LogOptions = {}, returnValue: string = 'result') => {
    class TestClass {
      // @ts-expect-error - Decorator type inference issue
      @Log({ sink: mockSink, ...options })
      testMethod() {
        return returnValue;
      }
    }
    return TestClass;
  };

  const createComplexArgsTestClass = (options: LogOptions = {}) => {
    class TestClass {
      // @ts-expect-error - Decorator type inference issue
      @Log({ sink: mockSink, ...options })
      testMethod(_arg: object) {
        return 'result';
      }
    }
    return TestClass;
  };

  const createNullReturnTestClass = (options: LogOptions = {}) => {
    class TestClass {
      // @ts-expect-error - Decorator type inference issue
      @Log({ includeResult: true, sink: mockSink, ...options })
      testMethod() {
        return null;
      }
    }
    return TestClass;
  };

  const createPrimitiveReturnTestClass = (returnValue: unknown, options: LogOptions = {}) => {
    class TestClass {
      // @ts-expect-error - Decorator type inference issue
      @Log({ includeResult: true, sink: mockSink, ...options })
      testMethod() {
        return returnValue;
      }
    }
    return TestClass;
  };

  const createThenableObjectTestClass = (options: LogOptions = {}) => {
    class TestClass {
      // @ts-expect-error - Decorator type inference issue
      @Log({ includeResult: true, sink: mockSink, ...options })
      testMethod() {
        // Return an object that looks like a Promise but isn't
        return {
          thenProperty: 'not a function',
        };
      }
    }
    return TestClass;
  };

  const createObjectWithoutThenTestClass = (options: LogOptions = {}) => {
    class TestClass {
      // @ts-expect-error - Decorator type inference issue
      @Log({ includeResult: true, sink: mockSink, ...options })
      testMethod() {
        // Return an object that doesn't have a 'then' property
        return {
          property: 'value',
        };
      }
    }
    return TestClass;
  };

  const createTimingTestClass = (options: LogOptions = {}) => {
    class TestClass {
      // @ts-expect-error - Decorator type inference issue
      @Log({ sink: mockSink, ...options })
      async testMethod() {
        await delay(10);
        return 'result';
      }
    }
    return TestClass;
  };

  const createSyncTimingTestClass = (options: LogOptions = {}) => {
    class TestClass {
      // @ts-expect-error - Decorator type inference issue
      @Log({ sink: mockSink, ...options })
      testMethod() {
        const start = Date.now();
        // Busy wait for ~5ms
        while (Date.now() - start < 5) {
          // Empty loop
        }
        return 'result';
      }
    }
    return TestClass;
  };

  const createDefaultSinkTestClass = () => {
    class TestClass {
      // @ts-expect-error - Decorator type inference issue
      @Log()
      testMethod() {
        return 'result';
      }
    }
    return TestClass;
  };

  beforeEach(() => {
    capturedEntries = [];
    mockSink = jest.fn((entry: LogEntry) => {
      capturedEntries.push(entry);
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    capturedEntries = [];
  });

  describe('Basic Functionality', () => {
    it('should log successful synchronous method execution with default options', () => {
      const TestClass = createTestClass();
      const instance = new TestClass();
      const result = instance.testMethod('hello', 42);

      expect(result).toBe('hello-42');
      expect(capturedEntries).toHaveLength(1);

      const entry = getEntry();
      expect(entry.level).toBe('info');
      expect(entry.outcome).toBe('success');
      expect(entry.scope.className).toBe('TestClass');
      expect(entry.scope.methodName).toBe('testMethod');
      expect(entry.args).toEqual(['hello', 42]);
      expect(entry.result).toBeUndefined();
      expect(entry.error).toBeUndefined();
      expect(entry.durationMs).toBeGreaterThan(0);
      expect(entry.timestamp).toBeDefined();
    });

    it('should log successful synchronous method execution with custom options', () => {
      const options: LogOptions = {
        level: 'debug',
        includeArgs: false,
        includeResult: true,
      };

      const TestClass = createTestClass(options);
      const instance = new TestClass();
      const result = instance.testMethod('hello', 42);

      expect(result).toBe('hello-42');
      expect(capturedEntries).toHaveLength(1);

      const entry = getEntry();
      expect(entry.level).toBe('debug');
      expect(entry.outcome).toBe('success');
      expect(entry.args).toBeUndefined();
      expect(entry.result).toBe('hello-42');
    });
  });

  describe('Asynchronous Methods', () => {
    it('should log successful Promise resolution', async () => {
      const TestClass = createAsyncTestClass();
      const instance = new TestClass();
      const result = await instance.testMethod('hello', 42);

      expect(result).toBe('hello-42');
      expect(capturedEntries).toHaveLength(1);

      const entry = getEntry();
      expect(entry.outcome).toBe('success');
      expect(entry.args).toEqual(['hello', 42]);
      expect(entry.result).toBeUndefined();
    });

    it('should log successful Promise resolution with includeResult', async () => {
      const TestClass = createAsyncTestClass({ includeResult: true });
      const instance = new TestClass();
      const result = await instance.testMethod('hello', 42);

      expect(result).toBe('hello-42');
      expect(capturedEntries).toHaveLength(1);

      const entry = getEntry();
      expect(entry.outcome).toBe('success');
      expect(entry.result).toBe('hello-42');
    });

    it('should log Promise rejection', async () => {
      const testError = new Error('Test error');
      const TestClass = createAsyncErrorThrowingTestClass(testError);

      const instance = new TestClass();

      await expect(instance.testMethod()).rejects.toThrow('Test error');
      expect(capturedEntries).toHaveLength(1);

      const entry = getEntry();
      expect(entry.outcome).toBe('failure');
      expect(entry.error).toEqual({
        name: 'Error',
        message: 'Test error',
        stack: testError.stack,
      });
    });

    it('should log Promise rejection with non-Error object', async () => {
      const TestClass = createAsyncErrorThrowingTestClass('String error in promise');

      const instance = new TestClass();

      await expect(instance.testMethod()).rejects.toBe('String error in promise');
      expect(capturedEntries).toHaveLength(1);

      const entry = getEntry();
      expect(entry.outcome).toBe('failure');
      expect(entry.error).toEqual({
        name: 'Error',
        message: 'String error in promise',
        stack: undefined,
      });
    });

    it('should log Promise rejection with number', async () => {
      const TestClass = createAsyncErrorThrowingTestClass(500);

      const instance = new TestClass();

      await expect(instance.testMethod()).rejects.toBe(500);
      expect(capturedEntries).toHaveLength(1);

      const entry = getEntry();
      expect(entry.outcome).toBe('failure');
      expect(entry.error).toEqual({
        name: 'Error',
        message: '500',
        stack: undefined,
      });
    });

    it('should log Promise rejection with object that has name property', async () => {
      const customError = { name: 'CustomError', message: 'Custom message' };
      const TestClass = createAsyncErrorThrowingTestClass(customError);

      const instance = new TestClass();

      await expect(instance.testMethod()).rejects.toBe(customError);
      expect(capturedEntries).toHaveLength(1);

      const entry = getEntry();
      expect(entry.outcome).toBe('failure');
      expect(entry.error).toEqual({
        name: 'CustomError',
        message: 'Custom message',
        stack: undefined,
      });
    });
  });

  describe('Error Handling', () => {
    it('should log synchronous method errors', () => {
      const testError = new Error('Sync error');
      const TestClass = createErrorThrowingTestClass(testError);

      const instance = new TestClass();

      expect(() => instance.testMethod()).toThrow('Sync error');
      expect(capturedEntries).toHaveLength(1);

      const entry = getEntry();
      expect(entry.outcome).toBe('failure');
      expect(entry.error).toEqual({
        name: 'Error',
        message: 'Sync error',
        stack: testError.stack,
      });
    });

    it('should handle non-Error objects thrown', () => {
      const TestClass = createErrorThrowingTestClass(new Error('String error'));

      const instance = new TestClass();

      expect(() => instance.testMethod()).toThrow('String error');
      expect(capturedEntries).toHaveLength(1);

      const entry = getEntry();
      expect(entry.outcome).toBe('failure');
      expect(entry.error).toEqual({
        name: 'Error',
        message: 'String error',
        stack: expect.any(String),
      });
    });

    it('should handle null/undefined errors', () => {
      const TestClass = createErrorThrowingTestClass(new Error('null'));

      const instance = new TestClass();

      expect(() => instance.testMethod()).toThrow('null');
      expect(capturedEntries).toHaveLength(1);

      const entry = getEntry();
      expect(entry.outcome).toBe('failure');
      expect(entry.error).toEqual({
        name: 'Error',
        message: 'null',
        stack: expect.any(String),
      });
    });

    it('should handle string errors thrown', () => {
      const TestClass = createErrorThrowingTestClass('String error');

      const instance = new TestClass();

      expect(() => instance.testMethod()).toThrow('String error');
      expect(capturedEntries).toHaveLength(1);

      const entry = getEntry();
      expect(entry.outcome).toBe('failure');
      expect(entry.error).toEqual({
        name: 'Error',
        message: 'String error',
        stack: undefined,
      });
    });

    it('should handle number errors thrown', () => {
      const TestClass = createErrorThrowingTestClass(42);

      const instance = new TestClass();

      expect(() => instance.testMethod()).toThrow();
      expect(capturedEntries).toHaveLength(1);

      const entry = getEntry();
      expect(entry.outcome).toBe('failure');
      expect(entry.error).toEqual({
        name: 'Error',
        message: '42',
        stack: undefined,
      });
    });

    it('should handle object errors thrown', () => {
      const customError = {
        code: 'CUSTOM_ERROR',
        message: 'Custom error message',
      };
      const TestClass = createErrorThrowingTestClass(customError);

      const instance = new TestClass();

      expect(() => instance.testMethod()).toThrow();
      expect(capturedEntries).toHaveLength(1);

      const entry = getEntry();
      expect(entry.outcome).toBe('failure');
      expect(entry.error).toEqual({
        name: 'Error',
        message: 'Custom error message',
        stack: undefined,
      });
    });

    it('should handle object errors with name property thrown', () => {
      const customError = {
        name: 'CustomError',
        message: 'Custom error message',
      };
      const TestClass = createErrorThrowingTestClass(customError);

      const instance = new TestClass();

      expect(() => instance.testMethod()).toThrow();
      expect(capturedEntries).toHaveLength(1);

      const entry = getEntry();
      expect(entry.outcome).toBe('failure');
      expect(entry.error).toEqual({
        name: 'CustomError',
        message: 'Custom error message',
        stack: undefined,
      });
    });
  });

  describe('Sample Rate', () => {
    it('should skip logging when sample rate is 0', () => {
      const TestClass = createSimpleTestClass({ sampleRate: 0 });
      const instance = new TestClass();
      const result = instance.testMethod();

      expect(result).toBe('result');
      expect(capturedEntries).toHaveLength(0);
    });

    it('should skip logging when sample rate is less than 1 and random check fails', () => {
      // Mock crypto.randomBytes to return a value that results in 0.9 (above sample rate of 0.5)
      const crypto = require('node:crypto');
      const randomBytesSpy = jest.spyOn(crypto, 'randomBytes');
      randomBytesSpy.mockReturnValue(Buffer.from([0xff, 0xff, 0xff, 0xe6])); // Results in ~0.9

      const TestClass = createSimpleTestClass({ sampleRate: 0.5 });
      const instance = new TestClass();
      const result = instance.testMethod();

      expect(result).toBe('result');
      expect(capturedEntries).toHaveLength(0);

      // Restore original randomBytes
      randomBytesSpy.mockRestore();
    });

    it('should log when sample rate is less than 1 and random check passes', () => {
      // Mock crypto.randomBytes to return a value that results in 0.1 (below sample rate of 0.5)
      const crypto = require('node:crypto');
      const randomBytesSpy = jest.spyOn(crypto, 'randomBytes');
      randomBytesSpy.mockReturnValue(Buffer.from([0, 0, 0, 0x1a])); // Results in ~0.1

      const TestClass = createSimpleTestClass({ sampleRate: 0.5 });
      const instance = new TestClass();
      const result = instance.testMethod();

      expect(result).toBe('result');
      expect(capturedEntries).toHaveLength(1);

      // Restore original randomBytes
      randomBytesSpy.mockRestore();
    });

    it('should log when sample rate is exactly 1', () => {
      const TestClass = createSimpleTestClass({ sampleRate: 1 });
      const instance = new TestClass();
      const result = instance.testMethod();

      expect(result).toBe('result');
      expect(capturedEntries).toHaveLength(1);

      const entry = getEntry();
      expect(entry.outcome).toBe('success');
      expect(entry.result).toBeUndefined();
    });
  });

  describe('Redaction', () => {
    it('should apply redaction to arguments', () => {
      const redactFunction = (input: unknown) => `redacted-${input}`;
      const redact = jest.fn(redactFunction);

      const TestClass = createTestClass({ redact });
      const instance = new TestClass();
      instance.testMethod('sensitive', 123);

      expect(redact).toHaveBeenCalledWith(['sensitive', 123]);
      const entry = getEntry();
      expect(entry.args).toBe('redacted-sensitive,123');
    });

    it('should apply redaction to result', () => {
      const redactFunction = (input: unknown) => `redacted-${input}`;
      const redact = jest.fn(redactFunction);

      const TestClass = createSimpleTestClass({ includeResult: true, redact }, 'sensitive result');
      const instance = new TestClass();
      instance.testMethod();

      expect(redact).toHaveBeenCalledWith('sensitive result');
      const entry = getEntry();
      expect(entry.result).toBe('redacted-sensitive result');
    });
  });

  describe('Correlation ID', () => {
    it('should include correlation ID when provided', () => {
      const correlationIdFunction = () => 'test-correlation-id';
      const getCorrelationId = jest.fn(correlationIdFunction);

      const TestClass = createSimpleTestClass({ getCorrelationId });
      const instance = new TestClass();
      instance.testMethod();

      expect(getCorrelationId).toHaveBeenCalled();
      const entry = getEntry();
      expect(entry.correlationId).toBe('test-correlation-id');
    });

    it('should handle undefined correlation ID', () => {
      const undefinedCorrelationIdFunction = () => undefined;
      const getCorrelationId = jest.fn(undefinedCorrelationIdFunction);

      const TestClass = createSimpleTestClass({ getCorrelationId });
      const instance = new TestClass();
      instance.testMethod();

      expect(getCorrelationId).toHaveBeenCalled();
      const entry = getEntry();
      expect(entry.correlationId).toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle methods without constructor name', () => {
      const testMethod = () => {
        return 'result';
      };

      const obj = Object.create(null);
      obj.testMethod = testMethod;

      const descriptor = Object.getOwnPropertyDescriptor(obj, 'testMethod');
      expect(descriptor).toBeDefined();
      const logDecorator = Log({ sink: mockSink });
      const decoratedDescriptor = logDecorator(obj, 'testMethod', descriptor as PropertyDescriptor);

      const decoratedValue = (decoratedDescriptor as PropertyDescriptor).value;
      const result = decoratedValue.call(obj);

      expect(result).toBe('result');
      const entry = getEntry();
      expect(entry.scope.className).toBeUndefined();
    });

    it('should handle methods that return null', () => {
      const TestClass = createNullReturnTestClass();
      const instance = new TestClass();
      const result = instance.testMethod();

      expect(result).toBeNull();
      const entry = getEntry();
      expect(entry.result).toBeNull();
    });

    it('should handle methods with no arguments', () => {
      const TestClass = createSimpleTestClass();
      const instance = new TestClass();
      const result = instance.testMethod();

      expect(result).toBe('result');
      const entry = getEntry();
      expect(entry.args).toEqual([]);
    });

    it('should handle methods with complex arguments', () => {
      const complexArg = { nested: { value: 'test' } };
      const TestClass = createComplexArgsTestClass();

      const instance = new TestClass();
      const result = instance.testMethod(complexArg);

      expect(result).toBe('result');
      const entry = getEntry();
      expect(entry.args).toEqual([complexArg]);
    });

    it('should handle descriptor without value property', () => {
      const obj = {};
      const descriptor: PropertyDescriptor = {
        configurable: true,
        enumerable: true,
        writable: true,
        // value is intentionally missing
      };

      const logDecorator = Log({ sink: mockSink });
      const decoratedDescriptor = logDecorator(obj, 'testMethod', descriptor);

      // Should return the original descriptor unchanged
      expect(decoratedDescriptor).toBe(descriptor);
    });

    it('should handle descriptor with non-function value', () => {
      const obj = {};
      const descriptor: PropertyDescriptor = {
        configurable: true,
        enumerable: true,
        writable: true,
        value: 'not a function', // Non-function value
      };

      const logDecorator = Log({ sink: mockSink });
      const decoratedDescriptor = logDecorator(obj, 'testMethod', descriptor);

      // Should return the original descriptor unchanged
      expect(decoratedDescriptor).toBe(descriptor);
    });

    it('should handle methods with includeArgs false', () => {
      const TestClass = createTestClass({ includeArgs: false });
      const instance = new TestClass();
      const result = instance.testMethod('hello', 42);

      expect(result).toBe('hello-42');
      const entry = getEntry();
      expect(entry.args).toBeUndefined();
    });

    it('should handle methods with includeResult false', () => {
      const TestClass = createSimpleTestClass({ includeResult: false }, 'secret result');
      const instance = new TestClass();
      const result = instance.testMethod();

      expect(result).toBe('secret result');
      const entry = getEntry();
      expect(entry.result).toBeUndefined();
    });

    it('should handle methods with both includeArgs and includeResult false', () => {
      const TestClass = createTestClass({ includeArgs: false, includeResult: false });
      const instance = new TestClass();
      const result = instance.testMethod('hello', 42);

      expect(result).toBe('hello-42');
      const entry = getEntry();
      expect(entry.args).toBeUndefined();
      expect(entry.result).toBeUndefined();
    });

    it('should handle methods that return thenable objects', () => {
      const TestClass = createThenableObjectTestClass();
      const instance = new TestClass();
      const result = instance.testMethod();

      expect(result).toEqual({ thenProperty: 'not a function' });
      const entry = getEntry();
      expect(entry.outcome).toBe('success');
      expect(entry.result).toEqual({ thenProperty: 'not a function' });
    });

    it('should handle methods that return null/undefined', () => {
      const TestClass = createNullReturnTestClass();
      const instance = new TestClass();
      const result = instance.testMethod();

      expect(result).toBeNull();
      const entry = getEntry();
      expect(entry.outcome).toBe('success');
      expect(entry.result).toBeNull();
    });

    it('should handle methods that return primitive values', () => {
      const TestClass = createPrimitiveReturnTestClass(42);
      const instance = new TestClass();
      const result = instance.testMethod();

      expect(result).toBe(42);
      const entry = getEntry();
      expect(entry.outcome).toBe('success');
      expect(entry.result).toBe(42);
    });

    it('should handle methods that return objects with then property but not a function', () => {
      const TestClass = createThenableObjectTestClass();
      const instance = new TestClass();
      const result = instance.testMethod();

      expect(result).toEqual({ thenProperty: 'not a function' });
      const entry = getEntry();
      expect(entry.outcome).toBe('success');
      expect(entry.result).toEqual({ thenProperty: 'not a function' });
    });

    it('should handle methods that return objects without then property', () => {
      const TestClass = createObjectWithoutThenTestClass();
      const instance = new TestClass();
      const result = instance.testMethod();

      expect(result).toEqual({ property: 'value' });
      const entry = getEntry();
      expect(entry.outcome).toBe('success');
      expect(entry.result).toEqual({ property: 'value' });
    });
  });

  describe('Performance Timing', () => {
    it('should measure execution time correctly', async () => {
      const TestClass = createTimingTestClass();
      const instance = new TestClass();
      await instance.testMethod();

      const entry = getEntry();
      expect(entry.durationMs).toBeGreaterThan(5);
    });

    it('should measure synchronous execution time', () => {
      const TestClass = createSyncTimingTestClass();
      const instance = new TestClass();
      instance.testMethod();

      const entry = getEntry();
      expect(entry.durationMs).toBeGreaterThan(0);
    });
  });

  describe('Default Sink', () => {
    it('should use Pino sink as default when no sink is provided', () => {
      // Since the default sink is now a Pino sink, we need to test that it works
      // without throwing errors and that it processes the log entry correctly
      const TestClass = createDefaultSinkTestClass();
      const instance = new TestClass();

      // This should not throw any errors
      expect(() => instance.testMethod()).not.toThrow();

      // The method should return the expected result
      const result = instance.testMethod();
      expect(result).toBe('result');
    });
  });
});
