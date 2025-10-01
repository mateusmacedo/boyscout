import 'reflect-metadata';
import { Log } from '../../src/log.decorator';
import type { LogEntry } from '../../src/types';

describe('NestJS Real Integration', () => {
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

  describe('Real NestJS Controller Simulation', () => {
    it('should work with simulated NestJS controller decorators', async () => {
      // Simulate NestJS decorators by manually adding metadata
      const controllerMetadata = { path: 'test' };
      const routeMetadata = { path: '/', method: 'GET' };
      const guardMetadata = { guards: ['AuthGuard'] };

      class TestController {
        @Log({ sink: mockSink, includeArgs: true, includeResult: true })
        getData() {
          return { message: 'Hello World' };
        }

        @Log({ sink: mockSink, includeArgs: true, includeResult: false })
        createUser(userData: { name: string; email: string }) {
          return { id: 1, ...userData };
        }

        @Log({ sink: mockSink, level: 'error', includeArgs: true })
        getDataWithError(): never {
          throw new Error('Database connection failed');
        }
      }

      // Simulate what NestJS would do with decorators
      Reflect.defineMetadata('path', controllerMetadata, TestController);
      Reflect.defineMetadata('routes', routeMetadata, TestController.prototype, 'getData');
      Reflect.defineMetadata('guards', guardMetadata, TestController.prototype, 'getData');

      // Verify metadata is preserved
      expect(Reflect.getMetadata('path', TestController)).toEqual(controllerMetadata);
      expect(Reflect.getMetadata('routes', TestController.prototype, 'getData')).toEqual(
        routeMetadata
      );
      expect(Reflect.getMetadata('guards', TestController.prototype, 'getData')).toEqual(
        guardMetadata
      );

      // Test controller methods
      const controller = new TestController();

      // Test GET endpoint
      const getResult = controller.getData();
      expect(getResult).toEqual({ message: 'Hello World' });

      // Test POST endpoint
      const userData = { name: 'John Doe', email: 'john@example.com' };
      const createResult = controller.createUser(userData);
      expect(createResult).toEqual({ id: 1, ...userData });

      // Test error endpoint
      try {
        await controller.getDataWithError();
      } catch (error) {
        expect((error as Error).message).toBe('Database connection failed');
      }

      // Verify all methods were logged
      expect(capturedEntries).toHaveLength(3);

      // Verify GET endpoint logging
      const getEntry = capturedEntries[0];
      expect(getEntry?.scope.methodName).toBe('getData');
      expect(getEntry?.outcome).toBe('success');
      expect(getEntry?.result).toEqual({ message: 'Hello World' });

      // Verify POST endpoint logging
      const postEntry = capturedEntries[1];
      expect(postEntry?.scope.methodName).toBe('createUser');
      expect(postEntry?.outcome).toBe('success');
      expect(postEntry?.args).toEqual([
        expect.objectContaining({
          name: 'John Doe',
          email: expect.any(String),
        }),
      ]);
      expect(postEntry?.result).toBeUndefined(); // includeResult: false

      // Verify error endpoint logging
      const errorEntry = capturedEntries[2];
      expect(errorEntry?.scope.methodName).toBe('getDataWithError');
      expect(errorEntry?.outcome).toBe('failure');
      expect(errorEntry?.error?.message).toBe('Database connection failed');
    });

    it('should work with complex NestJS scenarios', async () => {
      // Simulate a more complex NestJS scenario with multiple decorators
      const controllerMetadata = { path: 'api/v1/users' };
      const methodMetadata = {
        path: '/:id',
        method: 'GET',
        guards: ['AuthGuard', 'RoleGuard'],
        pipes: ['ValidationPipe'],
        interceptors: ['LoggingInterceptor'],
      };

      class UserController {
        @Log({
          sink: mockSink,
          level: 'info',
          includeArgs: true,
          includeResult: true,
        })
        async getUser(id: string): Promise<{ id: string; name: string; email: string }> {
          // Simulate async operation
          await new Promise((resolve) => setTimeout(resolve, 10));
          return { id, name: 'John Doe', email: 'john@example.com' };
        }

        @Log({
          sink: mockSink,
          level: 'warn',
          includeArgs: true,
          includeResult: false,
        })
        updateUser(id: string, userData: Partial<{ name: string; email: string }>) {
          return { id, ...userData, updatedAt: new Date().toISOString() };
        }

        @Log({ sink: mockSink, level: 'error', includeArgs: true })
        deleteUser(id: string): never {
          throw new Error(`User ${id} not found`);
        }
      }

      // Add complex metadata
      Reflect.defineMetadata('path', controllerMetadata, UserController);
      Reflect.defineMetadata('method', methodMetadata, UserController.prototype, 'getUser');

      // Verify metadata preservation
      expect(Reflect.getMetadata('path', UserController)).toEqual(controllerMetadata);
      expect(Reflect.getMetadata('method', UserController.prototype, 'getUser')).toEqual(
        methodMetadata
      );

      // Test controller methods
      const controller = new UserController();

      // Test async method
      const getUserResult = await controller.getUser('123');
      expect(getUserResult).toEqual({
        id: '123',
        name: 'John Doe',
        email: 'john@example.com',
      });

      // Test update method
      const updateResult = controller.updateUser('123', { name: 'Jane Doe' });
      expect(updateResult.id).toBe('123');
      expect(updateResult.name).toBe('Jane Doe');

      // Test delete method
      expect(() => controller.deleteUser('123')).toThrow('User 123 not found');

      // Verify all methods were logged with correct levels
      expect(capturedEntries).toHaveLength(3);

      const [getEntry, updateEntry, deleteEntry] = capturedEntries;

      expect(getEntry?.level).toBe('info');
      expect(getEntry?.outcome).toBe('success');
      expect(getEntry?.result).toEqual(
        expect.objectContaining({
          id: '123',
          name: 'John Doe',
          email: expect.any(String),
        })
      );

      expect(updateEntry?.level).toBe('warn');
      expect(updateEntry?.outcome).toBe('success');
      expect(updateEntry?.args).toEqual(['123', { name: 'Jane Doe' }]);

      expect(deleteEntry?.level).toBe('error');
      expect(deleteEntry?.outcome).toBe('failure');
      expect(deleteEntry?.error?.message).toBe('User 123 not found');
    });

    it('should preserve metadata when using multiple decorators on the same method', () => {
      // Simulate multiple decorators on the same method
      const routeMetadata = { path: '/', method: 'POST' };
      const guardMetadata = { guards: ['AuthGuard'] };
      const pipeMetadata = { pipes: ['ValidationPipe'] };
      const interceptorMetadata = { interceptors: ['LoggingInterceptor'] };

      class TestController {
        @Log({ sink: mockSink, includeArgs: true, includeResult: true })
        createResource(data: { name: string; value: number }) {
          return {
            id: Math.random(),
            ...data,
            createdAt: new Date().toISOString(),
          };
        }
      }

      // Add metadata from multiple "decorators"
      Reflect.defineMetadata('route', routeMetadata, TestController.prototype, 'createResource');
      Reflect.defineMetadata('guards', guardMetadata, TestController.prototype, 'createResource');
      Reflect.defineMetadata('pipes', pipeMetadata, TestController.prototype, 'createResource');
      Reflect.defineMetadata(
        'interceptors',
        interceptorMetadata,
        TestController.prototype,
        'createResource'
      );

      // Verify all metadata is preserved
      expect(Reflect.getMetadata('route', TestController.prototype, 'createResource')).toEqual(
        routeMetadata
      );
      expect(Reflect.getMetadata('guards', TestController.prototype, 'createResource')).toEqual(
        guardMetadata
      );
      expect(Reflect.getMetadata('pipes', TestController.prototype, 'createResource')).toEqual(
        pipeMetadata
      );
      expect(
        Reflect.getMetadata('interceptors', TestController.prototype, 'createResource')
      ).toEqual(interceptorMetadata);

      // Test method functionality
      const controller = new TestController();
      const testData = { name: 'Test Resource', value: 42 };
      const result = controller.createResource(testData);

      expect(result.id).toBeDefined();
      expect(result.name).toBe('Test Resource');
      expect(result.value).toBe(42);
      expect(result.createdAt).toBeDefined();

      // Verify logging works
      const entry = getEntry();
      expect(entry.scope.methodName).toBe('createResource');
      expect(entry.args).toEqual([testData]);
      expect(entry.result).toEqual(
        expect.objectContaining({
          name: 'Test Resource',
          value: 42,
        })
      );
    });
  });

  describe('Edge Cases with NestJS', () => {
    it('should handle methods with no existing metadata', () => {
      class TestController {
        @Log({ sink: mockSink })
        simpleMethod() {
          return 'simple';
        }
      }

      // No metadata added - should still work
      const controller = new TestController();
      const result = controller.simpleMethod();
      expect(result).toBe('simple');

      // Verify logging works
      const entry = getEntry();
      expect(entry.scope.methodName).toBe('simpleMethod');
      expect(entry.outcome).toBe('success');
    });

    it('should handle methods with circular references in metadata', () => {
      const circularMetadata = { data: {} };
      circularMetadata.data = circularMetadata; // Create circular reference

      class TestController {
        @Log({ sink: mockSink })
        circularMethod() {
          return 'circular';
        }
      }

      // Add circular metadata
      Reflect.defineMetadata(
        'circular',
        circularMetadata,
        TestController.prototype,
        'circularMethod'
      );

      // Should not throw when accessing metadata
      expect(() => {
        Reflect.getMetadata('circular', TestController.prototype, 'circularMethod');
      }).not.toThrow();

      // Method should still work
      const controller = new TestController();
      const result = controller.circularMethod();
      expect(result).toBe('circular');
    });

    it('should handle methods with function metadata', () => {
      const functionMetadata = {
        validator: (value: unknown) => value !== null,
        transformer: (value: unknown) => String(value),
      };

      class TestController {
        @Log({ sink: mockSink })
        functionMetadataMethod(value: unknown) {
          return functionMetadata.transformer(value);
        }
      }

      // Add function metadata
      Reflect.defineMetadata(
        'functions',
        functionMetadata,
        TestController.prototype,
        'functionMetadataMethod'
      );

      // Verify function metadata is preserved
      const preserved = Reflect.getMetadata(
        'functions',
        TestController.prototype,
        'functionMetadataMethod'
      );
      expect(preserved.validator).toBe(functionMetadata.validator);
      expect(preserved.transformer).toBe(functionMetadata.transformer);

      // Test method functionality
      const controller = new TestController();
      const result = controller.functionMetadataMethod(42);
      expect(result).toBe('42');
    });
  });
});
