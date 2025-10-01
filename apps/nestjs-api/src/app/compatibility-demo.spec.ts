import { Log } from '@boyscout/node-logger';
import { Body, Controller, Get, Injectable, Post, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, type TestingModule } from '@nestjs/testing';

/**
 * Demonstração completa da compatibilidade entre @boyscout/node-logger e NestJS
 * Validando injeção de dependência e preservação de metadata
 */
describe('@boyscout/node-logger NestJS Compatibility Demo', () => {
  let module: TestingModule;
  let reflector: Reflector;

  // Serviço com injeção de dependência e decorators
  @Injectable()
  class UserService {
    @Log({ level: 'info', includeArgs: true, includeResult: true })
    createUser(userData: { name: string; email: string }) {
      return { id: 'user-123', ...userData, created: true };
    }

    @Log({ level: 'debug', includeArgs: false, includeResult: true })
    getUserById(id: string) {
      return { id, name: 'Test User', email: 'test@example.com' };
    }
  }

  // Serviço com dependência e metadata customizada
  @Injectable()
  class OrderService {
    constructor(private readonly userService: UserService) {}

    @SetMetadata('business:operation', 'order-creation')
    @Log({ level: 'info', includeArgs: true, includeResult: true })
    async createOrder(orderData: Record<string, unknown>, userId: string) {
      const user = await this.userService.getUserById(userId);
      return { orderId: 'order-123', userId, user, ...orderData };
    }
  }

  // Controller com múltiplos decorators
  @Controller('demo')
  class DemoController {
    constructor(
      private readonly userService: UserService,
      private readonly orderService: OrderService
    ) {}

    @Get('users/:id')
    @SetMetadata('auth:required', true)
    @Log({ level: 'info', includeArgs: true, includeResult: true })
    async getUser(@Body() body: { id: string }) {
      return await this.userService.getUserById(body.id);
    }

    @Post('orders')
    @SetMetadata('rate:limit', { requests: 10, window: '1m' })
    @Log({ level: 'info', includeArgs: true, includeResult: true })
    async createOrder(@Body() body: { orderData: Record<string, unknown>; userId: string }) {
      return await this.orderService.createOrder(body.orderData, body.userId);
    }
  }

  beforeEach(async () => {
    module = await Test.createTestingModule({
      controllers: [DemoController],
      providers: [UserService, OrderService],
    }).compile();

    reflector = module.get<Reflector>(Reflector);
  });

  afterEach(async () => {
    await module.close();
  });

  describe('Dependency Injection Compatibility', () => {
    it('should inject dependencies correctly with @Log decorators', () => {
      const userService = module.get<UserService>(UserService);
      const orderService = module.get<OrderService>(OrderService);
      const controller = module.get<DemoController>(DemoController);

      expect(userService).toBeDefined();
      expect(orderService).toBeDefined();
      expect(controller).toBeDefined();

      // Verifica se as dependências foram injetadas corretamente
      expect(controller.userService).toBe(userService);
      expect(controller.orderService).toBe(orderService);
      expect(orderService.userService).toBe(userService);
    });

    it('should execute methods with @Log decorators without errors', async () => {
      const userService = module.get<UserService>(UserService);
      const orderService = module.get<OrderService>(OrderService);

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
    });
  });

  describe('Metadata Preservation', () => {
    it('should preserve custom metadata alongside @Log decorators', () => {
      const orderService = module.get<OrderService>(OrderService);
      const businessMetadata = reflector.get('business:operation', orderService.createOrder);

      expect(businessMetadata).toBe('order-creation');
    });

    it('should preserve multiple metadata keys with @Log decorators', () => {
      const controller = module.get<DemoController>(DemoController);

      const authMetadata = reflector.get('auth:required', controller.getUser);
      const rateLimitMetadata = reflector.get('rate:limit', controller.createOrder);

      expect(authMetadata).toBe(true);
      expect(rateLimitMetadata).toEqual({ requests: 10, window: '1m' });
    });

    it('should maintain method functionality with preserved metadata', async () => {
      const controller = module.get<DemoController>(DemoController);

      const result1 = await controller.getUser({ id: 'user-123' });
      expect(result1).toEqual({
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
      });

      const result2 = await controller.createOrder({
        orderData: { product: 'Test Product' },
        userId: 'user-123',
      });
      expect(result2).toEqual({
        orderId: 'order-123',
        userId: 'user-123',
        user: { id: 'user-123', name: 'Test User', email: 'test@example.com' },
        product: 'Test Product',
      });
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complex business scenarios with logging', async () => {
      const userService = module.get<UserService>(UserService);
      const orderService = module.get<OrderService>(OrderService);

      // Cenário: Criar usuário e depois um pedido
      const user = await userService.createUser({ name: 'Jane Doe', email: 'jane@example.com' });
      const order = await orderService.createOrder(
        { product: 'Laptop', quantity: 1, price: 999.99 },
        user.id
      );

      expect(user.created).toBe(true);
      expect(order.orderId).toBe('order-123');
      expect(order.userId).toBe(user.id);
    });

    it('should handle error scenarios with proper logging', async () => {
      @Injectable()
      class ErrorTestService {
        @Log({ level: 'error', includeArgs: true, includeResult: true })
        methodThatThrows(data: Record<string, unknown>) {
          throw new Error(`Business error: ${JSON.stringify(data)}`);
        }
      }

      const testModule = await Test.createTestingModule({
        providers: [ErrorTestService],
      }).compile();

      const service = testModule.get<ErrorTestService>(ErrorTestService);

      expect(() => service.methodThatThrows({ test: 'data' })).toThrow(
        'Business error: {"test":"data"}'
      );

      await testModule.close();
    });
  });

  describe('Performance and Reliability', () => {
    it('should handle concurrent operations with logging', async () => {
      const userService = module.get<UserService>(UserService);

      // Executa múltiplas operações concorrentes
      const promises = Array.from({ length: 5 }, (_, i) =>
        userService.createUser({ name: `User ${i}`, email: `user${i}@example.com` })
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      results.forEach((result, index) => {
        expect(result.name).toBe(`User ${index}`);
        expect(result.created).toBe(true);
      });
    });

    it('should maintain decorator chain integrity', () => {
      const orderService = module.get<OrderService>(OrderService);
      const controller = module.get<DemoController>(DemoController);

      // Verifica se os métodos existem e são funções
      expect(typeof orderService.createOrder).toBe('function');
      expect(typeof controller.getUser).toBe('function');
      expect(typeof controller.createOrder).toBe('function');

      // Verifica se os decorators não quebraram a funcionalidade
      expect(orderService.createOrder.length).toBe(2); // (orderData, userId)
      expect(controller.getUser.length).toBe(1); // (@Body() body)
      expect(controller.createOrder.length).toBe(1); // (@Body() body)
    });
  });
});
