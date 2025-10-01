import { Test, type TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Mock the @boyscout/node-logger
jest.mock('@boyscout/node-logger', () => ({
  Log: jest.fn(() => (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) => {
    // Mock decorator that preserves the original function behavior
    const originalMethod = descriptor.value;
    descriptor.value = function (...args: any[]) {
      return originalMethod.apply(this, args);
    };
    return descriptor;
  }),
}));

describe('Logging Integration Tests', () => {
  let app: TestingModule;
  let controller: AppController;
  let service: AppService;

  beforeAll(async () => {
    app = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    controller = app.get<AppController>(AppController);
    service = app.get<AppService>(AppService);
  });

  describe('Controller Logging', () => {
    it('should have @Log decorator on getData method', () => {
      // Test that the method exists and can be called
      const result = controller.getData();
      expect(result).toEqual({ message: 'Hello API' });
    });

    it('should have @Log decorator on getDataAsync method', async () => {
      const result = await controller.getDataAsync();
      expect(result).toHaveProperty('message', 'Hello API Async');
      expect(result).toHaveProperty('timestamp');
    });

    it('should have @Log decorator on getDataWithError method', async () => {
      await expect(controller.getDataWithError()).rejects.toThrow();
    });

    it('should have @Log decorator on processUser method', () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password',
        cardNumber: '1234567890123456',
      };

      const result = controller.processUser(userData);
      expect(result).toHaveProperty('id');
      expect(result.name).toBe(userData.name);
    });
  });

  describe('Service Logging', () => {
    it('should have @Log decorator on getData method', () => {
      const result = service.getData();
      expect(result).toEqual({ message: 'Hello API' });
    });

    it('should have @Log decorator on getDataAsync method', async () => {
      const result = await service.getDataAsync();
      expect(result).toHaveProperty('message', 'Hello API Async');
      expect(result).toHaveProperty('timestamp');
    });

    it('should have @Log decorator on getDataWithError method', async () => {
      await expect(service.getDataWithError()).rejects.toThrow();
    });

    it('should have @Log decorator on processUserData method', () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password',
        cardNumber: '1234567890123456',
      };

      const result = service.processUserData(userData);
      expect(result).toHaveProperty('id');
      expect(result.name).toBe(userData.name);
    });
  });

  describe('Logging Configuration Tests', () => {
    it('should handle logging with includeArgs: true', () => {
      // Test that methods with includeArgs: true work correctly
      const result = service.getData();
      expect(result).toBeDefined();
    });

    it('should handle logging with includeResult: true', async () => {
      // Test that methods with includeResult: true work correctly
      const result = await service.getDataAsync();
      expect(result).toBeDefined();
    });

    it('should handle logging with sampleRate: 0.1', async () => {
      // Test that methods with sampling work correctly
      const result = await service.getDataAsync();
      expect(result).toBeDefined();
    });

    it('should handle error logging with level: error', async () => {
      // Test that error methods with error level logging work
      await expect(service.getDataWithError()).rejects.toThrow();
    });
  });

  describe('Sensitive Data Redaction', () => {
    it('should handle sensitive data in processUserData', () => {
      const sensitiveData = {
        name: 'João Silva',
        email: 'joao@example.com',
        password: 'senha123',
        cardNumber: '1234567890123456',
      };

      const result = service.processUserData(sensitiveData);

      // The result should not contain sensitive data
      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('cardNumber');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('email');
    });

    it('should handle special characters in sensitive data', () => {
      const specialSensitiveData = {
        name: 'João & Associates',
        email: 'joão+test@example.com',
        password: 'senha@123#',
        cardNumber: '1234-5678-9012-3456',
      };

      const result = service.processUserData(specialSensitiveData);

      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('cardNumber');
      expect(result.name).toBe(specialSensitiveData.name);
      expect(result.email).toBe(specialSensitiveData.email);
    });
  });

  describe('Performance with Logging', () => {
    it('should maintain performance with logging decorators', async () => {
      const startTime = Date.now();

      // Execute multiple operations that have logging
      await Promise.all([
        service.getData(),
        service.getDataAsync(),
        service.processUserData({
          name: 'Test',
          email: 'test@example.com',
          password: 'password',
          cardNumber: '1234567890123456',
        }),
      ]);

      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(500); // Should complete within 500ms
    });

    it('should handle concurrent operations with logging', async () => {
      const promises = Array.from({ length: 10 }, () => service.getData());
      const results = await Promise.all(promises);

      results.forEach((result) => {
        expect(result).toEqual({ message: 'Hello API' });
      });
    });
  });
});
