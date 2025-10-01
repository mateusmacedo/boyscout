import { Test } from '@nestjs/testing';
import { AppService } from './app.service';

describe('AppService', () => {
  let service: AppService;

  beforeAll(async () => {
    const app = await Test.createTestingModule({
      providers: [AppService],
    }).compile();

    service = app.get<AppService>(AppService);
  });

  describe('getData', () => {
    it('should return "Hello API"', () => {
      const result = service.getData();
      expect(result).toEqual({ message: 'Hello API' });
      expect(result).toHaveProperty('message');
      expect(typeof result.message).toBe('string');
    });

    it('should return consistent data structure', () => {
      const result1 = service.getData();
      const result2 = service.getData();
      expect(result1).toEqual(result2);
    });
  });

  describe('getDataAsync', () => {
    it('should return async message with timestamp', async () => {
      const result = await service.getDataAsync();

      expect(result).toHaveProperty('message', 'Hello API Async');
      expect(result).toHaveProperty('timestamp');
      expect(typeof result.timestamp).toBe('string');
      expect(new Date(result.timestamp)).toBeInstanceOf(Date);
    });

    it('should return different timestamps on multiple calls', async () => {
      const result1 = await service.getDataAsync();
      await new Promise((resolve) => setTimeout(resolve, 10)); // Small delay
      const result2 = await service.getDataAsync();

      expect(result1.timestamp).not.toBe(result2.timestamp);
      expect(result1.message).toBe(result2.message);
    });

    it('should complete within reasonable time', async () => {
      const startTime = Date.now();
      await service.getDataAsync();
      const endTime = Date.now();

      // Should complete within 200ms (considering 100ms delay + buffer)
      expect(endTime - startTime).toBeLessThan(200);
    });
  });

  describe('getDataWithError', () => {
    it('should throw an error', async () => {
      await expect(service.getDataWithError()).rejects.toThrow();
    });

    it('should throw error with specific message', async () => {
      await expect(service.getDataWithError()).rejects.toThrow(
        'Simulated error for logging demonstration'
      );
    });
  });

  describe('processUserData', () => {
    const validUserData = {
      name: 'João Silva',
      email: 'joao@example.com',
      password: 'senha123',
      cardNumber: '1234567890123456',
    };

    it('should process user data and return user info', () => {
      const result = service.processUserData(validUserData);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name', validUserData.name);
      expect(result).toHaveProperty('email', validUserData.email);
      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('cardNumber');
    });

    it('should generate unique IDs', () => {
      const result1 = service.processUserData(validUserData);
      const result2 = service.processUserData(validUserData);

      expect(result1.id).not.toBe(result2.id);
      expect(typeof result1.id).toBe('string');
      expect(result1.id.length).toBeGreaterThan(0);
    });

    it('should handle special characters in data', () => {
      const specialData = {
        name: 'João & Associates',
        email: 'joão+test@example.com',
        password: 'senha@123#',
        cardNumber: '1234-5678-9012-3456',
      };

      const result = service.processUserData(specialData);
      expect(result.name).toBe(specialData.name);
      expect(result.email).toBe(specialData.email);
    });

    it('should handle empty or minimal data', () => {
      const minimalData = {
        name: '',
        email: '',
        password: '',
        cardNumber: '',
      };

      const result = service.processUserData(minimalData);
      expect(result).toHaveProperty('id');
      expect(result.name).toBe('');
      expect(result.email).toBe('');
    });

    it('should handle large data payloads', () => {
      const largeData = {
        name: 'A'.repeat(1000),
        email: 'test@example.com',
        password: 'password',
        cardNumber: '1234567890123456',
      };

      const result = service.processUserData(largeData);
      expect(result.name).toBe(largeData.name);
      expect(result.email).toBe(largeData.email);
    });
  });
});
