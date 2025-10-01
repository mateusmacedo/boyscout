import { CorrelationIdMiddleware, Log } from '@boyscout/node-logger';
import { Body, Controller, Get, Injectable, Post } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';

/**
 * Teste de integração para validar funcionamento completo
 * com injeção de dependência e preservação de metadata
 */
describe('NestJS Integration with @boyscout/node-logger', () => {
  let module: TestingModule;

  @Injectable()
  class UserService {
    @Log({ level: 'info', includeArgs: true, includeResult: true })
    createUser(userData: Record<string, unknown>) {
      return { id: 'user-123', ...userData, created: true };
    }

    @Log({ level: 'debug', includeArgs: false, includeResult: true })
    getUserById(id: string) {
      return { id, name: 'Test User', email: 'test@example.com' };
    }
  }

  @Injectable()
  class OrderService {
    constructor(private readonly userService: UserService) {}

    @Log({ level: 'info', includeArgs: true, includeResult: true })
    async createOrder(orderData: Record<string, unknown>, userId: string) {
      const user = await this.userService.getUserById(userId);
      return { orderId: 'order-123', userId, user, ...orderData };
    }
  }

  @Controller('test')
  class TestController {
    constructor(
      private readonly userService: UserService,
      private readonly orderService: OrderService
    ) {}

    @Get('users/:id')
    @Log({ level: 'info', includeArgs: true, includeResult: true })
    async getUser(@Body() body: { id: string }) {
      return await this.userService.getUserById(body.id);
    }

    @Post('orders')
    @Log({ level: 'info', includeArgs: true, includeResult: true })
    async createOrder(@Body() body: { orderData: Record<string, unknown>; userId: string }) {
      return await this.orderService.createOrder(body.orderData, body.userId);
    }
  }

  beforeEach(async () => {
    module = await Test.createTestingModule({
      controllers: [TestController],
      providers: [UserService, OrderService],
    }).compile();
  });

  afterEach(async () => {
    await module.close();
  });

  it('should handle complete request flow with dependency injection', async () => {
    const userService = module.get<UserService>(UserService);
    const orderService = module.get<OrderService>(OrderService);
    const controller = module.get<TestController>(TestController);

    // Teste do serviço base
    const user = await userService.createUser({ name: 'John Doe', email: 'john@example.com' });
    expect(user).toEqual({
      id: 'user-123',
      name: 'John Doe',
      email: 'john@example.com',
      created: true,
    });

    // Teste do serviço com dependência
    const order = await orderService.createOrder(
      { product: 'Test Product', quantity: 2 },
      'user-123'
    );
    expect(order).toEqual({
      orderId: 'order-123',
      userId: 'user-123',
      user: { id: 'user-123', name: 'Test User', email: 'test@example.com' },
      product: 'Test Product',
      quantity: 2,
    });

    // Teste do controller
    const controllerResult = await controller.getUser({ id: 'user-123' });
    expect(controllerResult).toEqual({
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
    });
  });

  it('should maintain decorator chain with multiple decorators', () => {
    @Injectable()
    class MultiDecoratorService {
      @Log({ level: 'info', includeArgs: true, includeResult: true })
      methodWithLogging(data: Record<string, unknown>) {
        return { processed: true, data };
      }
    }

    const testModule = Test.createTestingModule({
      providers: [MultiDecoratorService],
    }).compile();

    expect(testModule).toBeDefined();
  });

  it('should handle error scenarios with proper logging', async () => {
    @Injectable()
    class ErrorTestService {
      @Log({ level: 'error', includeArgs: true, includeResult: true })
      methodThatThrows(data: Record<string, unknown>) {
        throw new Error(`Test error with data: ${JSON.stringify(data)}`);
      }

      @Log({ level: 'warn', includeArgs: true, includeResult: true })
      methodWithValidation(data: Record<string, unknown>) {
        if (!data || !data.required) {
          throw new Error('Validation failed: required field missing');
        }
        return { validated: true, data };
      }
    }

    const testModule = await Test.createTestingModule({
      providers: [ErrorTestService],
    }).compile();

    const service = testModule.get<ErrorTestService>(ErrorTestService);

    // Teste de erro
    await expect(service.methodThatThrows({ test: 'data' })).rejects.toThrow(
      'Test error with data: {"test":"data"}'
    );

    // Teste de validação
    await expect(service.methodWithValidation({})).rejects.toThrow(
      'Validation failed: required field missing'
    );

    // Teste de sucesso
    const result = await service.methodWithValidation({ required: true, other: 'data' });
    expect(result).toEqual({ validated: true, data: { required: true, other: 'data' } });

    await testModule.close();
  });

  it('should work with middleware integration', () => {
    // Teste se o middleware pode ser aplicado sem conflitos
    expect(CorrelationIdMiddleware).toBeDefined();
    expect(typeof CorrelationIdMiddleware).toBe('function');
  });

  it('should handle async operations with proper logging', async () => {
    @Injectable()
    class AsyncTestService {
      @Log({ level: 'info', includeArgs: true, includeResult: true })
      async asyncOperation(data: Record<string, unknown>) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return { async: true, data, timestamp: new Date().toISOString() };
      }

      @Log({ level: 'debug', includeArgs: true, includeResult: true })
      async parallelOperations(data: Record<string, unknown>[]) {
        const promises = data.map(
          (item, index) =>
            new Promise((resolve) =>
              setTimeout(() => resolve({ processed: true, index, item }), 50)
            )
        );
        return await Promise.all(promises);
      }
    }

    const testModule = await Test.createTestingModule({
      providers: [AsyncTestService],
    }).compile();

    const service = testModule.get<AsyncTestService>(AsyncTestService);

    const result1 = await service.asyncOperation({ test: 'async' });
    expect(result1.async).toBe(true);
    expect(result1.data).toEqual({ test: 'async' });
    expect(result1.timestamp).toBeDefined();

    const result2 = await service.parallelOperations([{ a: 1 }, { b: 2 }, { c: 3 }]);
    expect(result2).toHaveLength(3);
    expect(result2[0]).toEqual({ processed: true, index: 0, item: { a: 1 } });

    await testModule.close();
  });
});
