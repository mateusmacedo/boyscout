import { HttpException } from '@nestjs/common';
import { AppController } from './app.controller';
import type { AppService } from './app.service';

// Mock the @Log decorator before importing the controller
jest.mock('@boyscout/node-logger', () => ({
  Log: jest.fn().mockReturnValue(() => {}),
  CorrelationIdMiddleware: jest.fn(),
}));

describe('AppController', () => {
  let controller: AppController;
  let service: AppService;

  beforeEach(() => {
    // Create mock service
    service = {
      getData: jest.fn(),
      getDataAsync: jest.fn(),
      getDataWithError: jest.fn(),
      processUserData: jest.fn(),
    } as any;

    // Create controller instance manually
    controller = new AppController(service);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getData', () => {
    it('should return data from service', () => {
      const expectedData = { message: 'Hello API' };
      jest.spyOn(service, 'getData').mockReturnValue(expectedData);

      const result = controller.getData();

      expect(service.getData).toHaveBeenCalled();
      expect(result).toEqual(expectedData);
    });
  });

  describe('getDataAsync', () => {
    it('should return async data from service', async () => {
      const expectedData = {
        message: 'Hello API Async',
        timestamp: '2023-01-01T00:00:00.000Z',
      };
      jest.spyOn(service, 'getDataAsync').mockResolvedValue(expectedData);

      const result = await controller.getDataAsync();

      expect(service.getDataAsync).toHaveBeenCalled();
      expect(result).toEqual(expectedData);
    });
  });

  describe('getDataWithError', () => {
    it('should throw HttpException when service throws error', async () => {
      const error = new Error('Service error');
      jest.spyOn(service, 'getDataWithError').mockRejectedValue(error);

      await expect(controller.getDataWithError()).rejects.toThrow(HttpException);
      await expect(controller.getDataWithError()).rejects.toThrow('Internal server error');
    });

    it('should return data when service succeeds', async () => {
      const expectedData = { message: 'Success' };
      jest.spyOn(service, 'getDataWithError').mockResolvedValue(expectedData);

      const result = await controller.getDataWithError();

      expect(service.getDataWithError).toHaveBeenCalled();
      expect(result).toEqual(expectedData);
    });
  });

  describe('processUser', () => {
    it('should process user data', () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'secret123',
        cardNumber: '1234567890123456',
      };
      const expectedResult = {
        id: 'test-id',
        name: 'John Doe',
        email: 'john@example.com',
      };
      jest.spyOn(service, 'processUserData').mockReturnValue(expectedResult);

      const result = controller.processUser(userData);

      expect(service.processUserData).toHaveBeenCalledWith(userData);
      expect(result).toEqual(expectedResult);
    });
  });
});
