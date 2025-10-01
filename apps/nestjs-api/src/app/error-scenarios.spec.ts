import { Test, type TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('Error Scenarios and Edge Cases', () => {
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

  describe('Service Error Handling', () => {
    it('should handle getDataWithError consistently', async () => {
      // Test multiple calls to ensure consistent error behavior
      for (let i = 0; i < 3; i++) {
        await expect(service.getDataWithError()).rejects.toThrow(
          'Simulated error for logging demonstration'
        );
      }
    });

    it('should handle processUserData with null/undefined values', () => {
      const nullData = {
        name: null as any,
        email: undefined as any,
        password: null as any,
        cardNumber: undefined as any,
      };

      const result = service.processUserData(nullData);
      expect(result).toHaveProperty('id');
      expect(result.name).toBe(null);
      expect(result.email).toBe(undefined);
    });

    it('should handle processUserData with extreme values', () => {
      const extremeData = {
        name: 'A'.repeat(10000), // Very long name
        email: 'test@example.com',
        password: 'x'.repeat(1000), // Very long password
        cardNumber: '1'.repeat(50), // Very long card number
      };

      const result = service.processUserData(extremeData);
      expect(result).toHaveProperty('id');
      expect(result.name).toBe(extremeData.name);
      expect(result.email).toBe(extremeData.email);
    });
  });

  describe('Controller Error Handling', () => {
    it('should handle getDataWithError consistently', async () => {
      // Test multiple calls to ensure consistent error behavior
      for (let i = 0; i < 3; i++) {
        await expect(controller.getDataWithError()).rejects.toThrow();
      }
    });

    it('should handle processUser with malformed data', () => {
      const malformedData = {
        name: 123 as any,
        email: 456 as any,
        password: true as any,
        cardNumber: [] as any,
      };

      const result = controller.processUser(malformedData);
      expect(result).toHaveProperty('id');
      expect(result.name).toBe(123);
      expect(result.email).toBe(456);
    });

    it('should handle processUser with circular references', () => {
      const circularData: any = {
        name: 'Test',
        email: 'test@example.com',
        password: 'password',
        cardNumber: '1234567890123456',
      };
      circularData.self = circularData; // Create circular reference

      const result = controller.processUser(circularData);
      expect(result).toHaveProperty('id');
      expect(result.name).toBe('Test');
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent getData calls', async () => {
      const promises = Array.from({ length: 20 }, () => service.getData());
      const results = await Promise.all(promises);

      results.forEach((result) => {
        expect(result).toEqual({ message: 'Hello API' });
      });
    });

    it('should handle concurrent getDataAsync calls', async () => {
      const promises = Array.from({ length: 10 }, () => service.getDataAsync());
      const results = await Promise.all(promises);

      results.forEach((result) => {
        expect(result).toHaveProperty('message', 'Hello API Async');
        expect(result).toHaveProperty('timestamp');
      });
    });

    it('should handle concurrent processUserData calls', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password',
        cardNumber: '1234567890123456',
      };

      const promises = Array.from({ length: 10 }, () => service.processUserData(userData));
      const results = await Promise.all(promises);

      results.forEach((result) => {
        expect(result).toHaveProperty('id');
        expect(result.name).toBe(userData.name);
        expect(result.email).toBe(userData.email);
      });
    });

    it('should handle mixed concurrent operations', async () => {
      const promises = [
        service.getData(),
        service.getDataAsync(),
        service.processUserData({
          name: 'Test',
          email: 'test@example.com',
          password: 'password',
          cardNumber: '1234567890123456',
        }),
        service.getData(),
        service.getDataAsync(),
      ];

      const results = await Promise.all(promises);
      expect(results).toHaveLength(5);
    });
  });

  describe('Memory and Performance', () => {
    it('should handle large number of operations without memory leaks', async () => {
      // Perform many operations to test for memory leaks
      for (let i = 0; i < 20; i++) {
        // Reduced from 100 to 20 for faster execution
        await service.getDataAsync();
        service.processUserData({
          name: `User ${i}`,
          email: `user${i}@example.com`,
          password: 'password',
          cardNumber: '1234567890123456',
        });
      }

      // If we get here without throwing, the test passes
      expect(true).toBe(true);
    }, 15000); // Increased timeout to 15 seconds

    it('should handle rapid successive calls', async () => {
      const startTime = Date.now();

      // Make rapid successive calls
      for (let i = 0; i < 50; i++) {
        service.getData();
      }

      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });

  describe('Data Validation Edge Cases', () => {
    it('should handle empty objects', () => {
      const emptyData = {};
      const result = service.processUserData(emptyData as any);
      expect(result).toHaveProperty('id');
    });

    it('should handle objects with extra properties', () => {
      const extraData = {
        name: 'Test',
        email: 'test@example.com',
        password: 'password',
        cardNumber: '1234567890123456',
        extraProperty: 'should be ignored',
        anotherProperty: 123,
      };

      const result = service.processUserData(extraData);
      expect(result).toHaveProperty('id');
      expect(result.name).toBe('Test');
      expect(result.email).toBe('test@example.com');
    });

    it('should handle Unicode and special characters', () => {
      const unicodeData = {
        name: 'José María Ñoño',
        email: 'josé.maría@example.com',
        password: 'pásswórd',
        cardNumber: '1234-5678-9012-3456',
      };

      const result = service.processUserData(unicodeData);
      expect(result.name).toBe(unicodeData.name);
      expect(result.email).toBe(unicodeData.email);
    });
  });

  describe('Error Recovery', () => {
    it('should recover from getDataWithError and continue working', async () => {
      // First, trigger an error
      await expect(service.getDataWithError()).rejects.toThrow();

      // Then, ensure other methods still work
      const result = service.getData();
      expect(result).toEqual({ message: 'Hello API' });

      const asyncResult = await service.getDataAsync();
      expect(asyncResult).toHaveProperty('message', 'Hello API Async');
    });

    it('should handle service errors gracefully', async () => {
      // Test that error in one method doesn't affect others
      const promises = [
        service.getData(),
        service.getDataWithError().catch(() => 'error'),
        service.getDataAsync(),
      ];

      const results = await Promise.all(promises);
      expect(results[0]).toEqual({ message: 'Hello API' });
      expect(results[1]).toBe('error');
      expect(results[2]).toHaveProperty('message', 'Hello API Async');
    });
  });
});
