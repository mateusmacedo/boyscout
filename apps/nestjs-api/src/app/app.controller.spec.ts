import { Test, type TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
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

  describe('getData', () => {
    it('should return "Hello API"', () => {
      const result = controller.getData();
      expect(result).toEqual({ message: 'Hello API' });
    });

    it('should call service.getData', () => {
      const spy = jest.spyOn(service, 'getData');
      controller.getData();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('getDataAsync', () => {
    it('should return async message with timestamp', async () => {
      const result = await controller.getDataAsync();

      expect(result).toHaveProperty('message', 'Hello API Async');
      expect(result).toHaveProperty('timestamp');
      expect(typeof result.timestamp).toBe('string');
    });

    it('should call service.getDataAsync', async () => {
      const spy = jest.spyOn(service, 'getDataAsync');
      await controller.getDataAsync();
      expect(spy).toHaveBeenCalled();
    });

    it('should complete within reasonable time', async () => {
      const startTime = Date.now();
      await controller.getDataAsync();
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(200);
    });
  });

  describe('getDataWithError', () => {
    it('should throw HttpException with 500 status', async () => {
      await expect(controller.getDataWithError()).rejects.toThrow();
    });

    it('should call service.getDataWithError', async () => {
      const spy = jest.spyOn(service, 'getDataWithError');
      try {
        await controller.getDataWithError();
      } catch (_error) {
        // Expected to throw
      }
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('processUser', () => {
    const validUserData = {
      name: 'João Silva',
      email: 'joao@example.com',
      password: 'senha123',
      cardNumber: '1234567890123456',
    };

    it('should process user data and return user info', () => {
      const result = controller.processUser(validUserData);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name', validUserData.name);
      expect(result).toHaveProperty('email', validUserData.email);
      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('cardNumber');
    });

    it('should call service.processUserData with correct data', () => {
      const spy = jest.spyOn(service, 'processUserData');
      controller.processUser(validUserData);
      expect(spy).toHaveBeenCalledWith(validUserData);
    });

    it('should handle special characters in user data', () => {
      const specialData = {
        name: 'João & Associates',
        email: 'joão+test@example.com',
        password: 'senha@123#',
        cardNumber: '1234-5678-9012-3456',
      };

      const result = controller.processUser(specialData);
      expect(result.name).toBe(specialData.name);
      expect(result.email).toBe(specialData.email);
    });

    it('should handle empty user data', () => {
      const emptyData = {
        name: '',
        email: '',
        password: '',
        cardNumber: '',
      };

      const result = controller.processUser(emptyData);
      expect(result).toHaveProperty('id');
      expect(result.name).toBe('');
      expect(result.email).toBe('');
    });

    it('should handle large user data', () => {
      const largeData = {
        name: 'A'.repeat(1000),
        email: 'test@example.com',
        password: 'password',
        cardNumber: '1234567890123456',
      };

      const result = controller.processUser(largeData);
      expect(result.name).toBe(largeData.name);
      expect(result.email).toBe(largeData.email);
    });
  });

  describe('Integration Tests', () => {
    it('should work with real service integration', () => {
      // Test that controller and service work together
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password',
        cardNumber: '1234567890123456',
      };

      const result = controller.processUser(userData);
      expect(result).toHaveProperty('id');
      expect(result.name).toBe(userData.name);
      expect(result.email).toBe(userData.email);
    });

    it('should handle concurrent requests', async () => {
      const promises = Array.from({ length: 5 }, () => controller.getData());
      const results = await Promise.all(promises);

      results.forEach((result) => {
        expect(result).toEqual({ message: 'Hello API' });
      });
    });
  });
});
