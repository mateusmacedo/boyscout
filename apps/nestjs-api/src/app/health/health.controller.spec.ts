import { HttpException } from '@nestjs/common';
import { HealthController } from './health.controller';
import type { HealthService } from './health.service';

// Mock the @Log decorator before importing the controller
jest.mock('@boyscout/node-logger', () => ({
  Log: jest.fn().mockReturnValue(() => {}),
  CorrelationIdMiddleware: jest.fn(),
}));

describe('HealthController', () => {
  let controller: HealthController;
  let service: HealthService;

  beforeEach(() => {
    // Create mock service
    service = {
      incrementRequestCount: jest.fn(),
      incrementErrorCount: jest.fn(),
      getHealthStatus: jest.fn(),
      getDetailedMetrics: jest.fn(),
      resetCounters: jest.fn(),
    } as HealthService;

    // Create controller instance manually
    controller = new HealthController(service);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getHealth', () => {
    it('should return health status successfully', async () => {
      const expectedHealth = {
        status: 'healthy',
        timestamp: '2023-01-01T00:00:00.000Z',
        uptime: { milliseconds: 1000, seconds: 1, minutes: 0, hours: 0 },
        memory: { rss: 50, heapTotal: 100, heapUsed: 80, external: 20 },
        requests: { total: 10, errors: 1, successRate: '90.00%' },
        environment: { nodeVersion: 'v18.0.0', platform: 'linux', arch: 'x64', nodeEnv: 'test' },
      };

      jest.spyOn(service, 'getHealthStatus').mockResolvedValue(expectedHealth);

      const result = await controller.getHealth();

      expect(service.incrementRequestCount).toHaveBeenCalled();
      expect(service.getHealthStatus).toHaveBeenCalled();
      expect(result).toEqual(expectedHealth);
    });

    it('should throw HttpException when service throws error', async () => {
      const error = new Error('Service error');
      jest.spyOn(service, 'getHealthStatus').mockRejectedValue(error);

      await expect(controller.getHealth()).rejects.toThrow(HttpException);
      await expect(controller.getHealth()).rejects.toThrow('Health check failed');
      expect(service.incrementErrorCount).toHaveBeenCalled();
    });
  });

  describe('getMetrics', () => {
    it('should return detailed metrics successfully', async () => {
      const expectedMetrics = {
        timestamp: '2023-01-01T00:00:00.000Z',
        uptime: 1000,
        memory: { rss: 100, heapTotal: 200, heapUsed: 150, external: 50, arrayBuffers: 10 },
        cpu: { user: 1000, system: 500 },
        requests: { total: 5, errors: 1, successRate: 0.8 },
        process: { pid: 1234, ppid: 5678, title: 'node', argv: [], execPath: '/usr/bin/node' },
      };

      jest.spyOn(service, 'getDetailedMetrics').mockResolvedValue(expectedMetrics);

      const result = await controller.getMetrics();

      expect(service.getDetailedMetrics).toHaveBeenCalled();
      expect(result).toEqual(expectedMetrics);
    });

    it('should throw HttpException when service throws error', async () => {
      const error = new Error('Service error');
      jest.spyOn(service, 'getDetailedMetrics').mockRejectedValue(error);

      await expect(controller.getMetrics()).rejects.toThrow(HttpException);
      await expect(controller.getMetrics()).rejects.toThrow('Failed to get metrics');
      expect(service.incrementErrorCount).toHaveBeenCalled();
    });
  });

  describe('resetCounters', () => {
    it('should reset counters successfully', async () => {
      const expectedResult = {
        message: 'Counters reset successfully',
        timestamp: '2023-01-01T00:00:00.000Z',
      };

      jest.spyOn(service, 'resetCounters').mockResolvedValue(expectedResult);

      const result = await controller.resetCounters();

      expect(service.resetCounters).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });

    it('should throw HttpException when service throws error', async () => {
      const error = new Error('Service error');
      jest.spyOn(service, 'resetCounters').mockRejectedValue(error);

      await expect(controller.resetCounters()).rejects.toThrow(HttpException);
      await expect(controller.resetCounters()).rejects.toThrow('Failed to reset counters');
    });
  });
});
