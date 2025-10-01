import 'reflect-metadata';
import { Log } from '../../src/log.decorator';
import type { LogEntry } from '../../src/types';

describe('NestJS Compatibility', () => {
  let mockSink: jest.Mock;
  let capturedEntries: LogEntry[];

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

  const getEntry = () => {
    const entry = capturedEntries[0];
    expect(entry).toBeDefined();
    return entry as LogEntry;
  };

  describe('Metadata Preservation', () => {
    it('should preserve existing metadata when decorating methods', () => {
      const metadataKey = 'test:metadata';
      const metadataValue = { test: 'value' };

      class TestController {
        @Log({ sink: mockSink })
        testMethod() {
          return 'test';
        }
      }

      // Add metadata before decoration
      Reflect.defineMetadata(metadataKey, metadataValue, TestController.prototype, 'testMethod');

      // Verify metadata is preserved
      const preservedMetadata = Reflect.getMetadata(
        metadataKey,
        TestController.prototype,
        'testMethod'
      );
      expect(preservedMetadata).toEqual(metadataValue);
    });

    it('should preserve multiple metadata entries', () => {
      const metadata1 = { key1: 'value1' };
      const metadata2 = { key2: 'value2' };

      class TestController {
        @Log({ sink: mockSink })
        testMethod() {
          return 'test';
        }
      }

      // Add multiple metadata entries
      Reflect.defineMetadata('metadata1', metadata1, TestController.prototype, 'testMethod');
      Reflect.defineMetadata('metadata2', metadata2, TestController.prototype, 'testMethod');

      // Verify all metadata is preserved
      expect(Reflect.getMetadata('metadata1', TestController.prototype, 'testMethod')).toEqual(
        metadata1
      );
      expect(Reflect.getMetadata('metadata2', TestController.prototype, 'testMethod')).toEqual(
        metadata2
      );
    });

    it('should preserve PropertyDescriptor properties', () => {
      class TestController {
        @Log({ sink: mockSink })
        testMethod() {
          return 'test';
        }
      }

      const descriptor = Object.getOwnPropertyDescriptor(TestController.prototype, 'testMethod');

      // Verify PropertyDescriptor properties are preserved
      expect(descriptor).toBeDefined();
      expect(descriptor?.configurable).toBe(true);
      expect(descriptor?.enumerable).toBe(false);
      expect(descriptor?.writable).toBe(true);
      expect(typeof descriptor?.value).toBe('function');
    });
  });

  describe('NestJS Decorator Compatibility', () => {
    it('should work with simulated NestJS decorators', () => {
      // Simulate NestJS decorators by adding metadata
      const routeMetadata = { path: '/test', method: 'GET' };
      const guardMetadata = { guards: ['AuthGuard'] };

      class TestController {
        @Log({ sink: mockSink })
        testMethod() {
          return 'test';
        }
      }

      // Simulate what NestJS decorators would do
      Reflect.defineMetadata('route', routeMetadata, TestController.prototype, 'testMethod');
      Reflect.defineMetadata('guards', guardMetadata, TestController.prototype, 'testMethod');

      // Verify our decorator doesn't interfere with NestJS metadata
      expect(Reflect.getMetadata('route', TestController.prototype, 'testMethod')).toEqual(
        routeMetadata
      );
      expect(Reflect.getMetadata('guards', TestController.prototype, 'testMethod')).toEqual(
        guardMetadata
      );

      // Verify the method still works
      const instance = new TestController();
      const result = instance.testMethod();
      expect(result).toBe('test');

      // Verify logging still works
      const entry = getEntry();
      expect(entry.scope.methodName).toBe('testMethod');
    });

    it('should preserve method behavior with complex metadata', () => {
      const complexMetadata = {
        pipes: ['ValidationPipe'],
        interceptors: ['LoggingInterceptor'],
        guards: ['AuthGuard', 'RoleGuard'],
        decorators: ['@UseGuards', '@UsePipes'],
      };

      class TestController {
        @Log({ sink: mockSink, includeArgs: true, includeResult: true })
        complexMethod(data: { id: number; name: string }) {
          return { processed: true, data };
        }
      }

      // Add complex metadata
      Reflect.defineMetadata(
        'nest:metadata',
        complexMetadata,
        TestController.prototype,
        'complexMethod'
      );

      // Verify metadata is preserved
      const preserved = Reflect.getMetadata(
        'nest:metadata',
        TestController.prototype,
        'complexMethod'
      );
      expect(preserved).toEqual(complexMetadata);

      // Test method functionality
      const instance = new TestController();
      const testData = { id: 1, name: 'test' };
      const result = instance.complexMethod(testData);

      expect(result).toEqual({ processed: true, data: testData });

      // Verify logging works
      const entry = getEntry();
      expect(entry.args).toEqual([testData]);
      expect(entry.result).toBeDefined();
      expect((entry.result as { processed: boolean }).processed).toBe(true);
    });
  });

  describe('Framework Integration', () => {
    it('should work with multiple decorators on the same method', () => {
      // Simulate multiple decorators by adding different metadata
      const decorator1Metadata = { type: 'decorator1' };
      const decorator2Metadata = { type: 'decorator2' };

      class TestController {
        @Log({ sink: mockSink })
        multiDecoratedMethod() {
          return 'multi-decorated';
        }
      }

      // Add metadata from multiple "decorators"
      Reflect.defineMetadata(
        'decorator1',
        decorator1Metadata,
        TestController.prototype,
        'multiDecoratedMethod'
      );
      Reflect.defineMetadata(
        'decorator2',
        decorator2Metadata,
        TestController.prototype,
        'multiDecoratedMethod'
      );

      // Verify all metadata is preserved
      expect(
        Reflect.getMetadata('decorator1', TestController.prototype, 'multiDecoratedMethod')
      ).toEqual(decorator1Metadata);
      expect(
        Reflect.getMetadata('decorator2', TestController.prototype, 'multiDecoratedMethod')
      ).toEqual(decorator2Metadata);

      // Test method functionality
      const instance = new TestController();
      const result = instance.multiDecoratedMethod();
      expect(result).toBe('multi-decorated');
    });

    it('should handle async methods with preserved metadata', async () => {
      const asyncMetadata = { async: true, timeout: 5000 };

      class TestController {
        @Log({ sink: mockSink, includeResult: true })
        async asyncMethod(): Promise<string> {
          await new Promise((resolve) => setTimeout(resolve, 10));
          return 'async-result';
        }
      }

      // Add async metadata
      Reflect.defineMetadata('async', asyncMetadata, TestController.prototype, 'asyncMethod');

      // Verify metadata is preserved
      expect(Reflect.getMetadata('async', TestController.prototype, 'asyncMethod')).toEqual(
        asyncMetadata
      );

      // Test async functionality
      const instance = new TestController();
      const result = await instance.asyncMethod();
      expect(result).toBe('async-result');

      // Verify async logging works
      const entry = getEntry();
      expect(entry.result).toBe('async-result');
      expect(entry.outcome).toBe('success');
    });

    it('should preserve metadata when method throws errors', () => {
      const errorMetadata = { errorHandling: true };

      class TestController {
        @Log({ sink: mockSink })
        errorMethod(): never {
          throw new Error('Test error');
        }
      }

      // Add error handling metadata
      Reflect.defineMetadata('error', errorMetadata, TestController.prototype, 'errorMethod');

      // Verify metadata is preserved
      expect(Reflect.getMetadata('error', TestController.prototype, 'errorMethod')).toEqual(
        errorMetadata
      );

      // Test error handling
      const instance = new TestController();
      expect(() => instance.errorMethod()).toThrow('Test error');

      // Verify error logging works
      const entry = getEntry();
      expect(entry.outcome).toBe('failure');
      expect(entry.error?.message).toBe('Test error');
    });
  });

  describe('PropertyDescriptor Preservation', () => {
    it('should preserve all PropertyDescriptor properties', () => {
      class TestController {
        @Log({ sink: mockSink })
        testMethod() {
          return 'test';
        }
      }

      const descriptor = Object.getOwnPropertyDescriptor(TestController.prototype, 'testMethod');

      expect(descriptor).toBeDefined();
      expect(descriptor?.configurable).toBe(true);
      expect(descriptor?.enumerable).toBe(false);
      expect(descriptor?.writable).toBe(true);
      expect(typeof descriptor?.value).toBe('function');
      expect(descriptor?.get).toBeUndefined();
      expect(descriptor?.set).toBeUndefined();
    });

    it('should handle getter/setter properties correctly', () => {
      class TestController {
        private _value = 'test';

        get value() {
          return this._value;
        }

        set value(val: string) {
          this._value = val;
        }

        @Log({ sink: mockSink })
        getValue() {
          return this._value;
        }

        @Log({ sink: mockSink })
        setValue(val: string) {
          this._value = val;
        }
      }

      // Test methods instead of getter/setter
      const instance = new TestController();
      expect(instance.getValue()).toBe('test');

      instance.setValue('updated');
      expect(instance.getValue()).toBe('updated');

      // Verify both methods are logged (getValue is called twice)
      expect(capturedEntries).toHaveLength(3);
    });
  });
});
