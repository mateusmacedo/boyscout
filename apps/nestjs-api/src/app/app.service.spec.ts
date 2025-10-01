import { Test, type TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';

// Mock the @Log decorator before importing the service
jest.mock('@boyscout/node-logger', () => ({
  Log: jest.fn().mockReturnValue(() => {}),
  CorrelationIdMiddleware: jest.fn(),
}));

describe('AppService', () => {
  let service: AppService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppService],
    }).compile();

    service = module.get<AppService>(AppService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getData', () => {
    it('should return hello message', () => {
      const result = service.getData();
      expect(result).toEqual({ message: 'Hello API' });
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
  });

  describe('getDataWithError', () => {
    it('should throw an error', async () => {
      await expect(service.getDataWithError()).rejects.toThrow(
        'Simulated error for logging demonstration'
      );
    });
  });

  describe('processUserData', () => {
    it('should process user data and return sanitized result', () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'secret123',
        cardNumber: '1234567890123456',
      };

      const result = service.processUserData(userData);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name', 'John Doe');
      expect(result).toHaveProperty('email', 'john@example.com');
      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('cardNumber');
      expect(typeof result.id).toBe('string');
      expect(result.id.length).toBeGreaterThan(0);
    });
  });
});
