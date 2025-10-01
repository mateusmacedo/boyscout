import { Test, type TestingModule } from '@nestjs/testing';
import { HealthService } from './health.service';

// Mock the @Log decorator before importing the service
jest.mock('@boyscout/node-logger', () => ({
  Log: jest.fn().mockReturnValue(() => {}),
  CorrelationIdMiddleware: jest.fn(),
}));

describe('HealthService', () => {
  let service: HealthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HealthService],
    }).compile();

    service = module.get<HealthService>(HealthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getHealthStatus', () => {
    it('should return health status with correct structure', async () => {
      const result = await service.getHealthStatus();

      expect(result).toHaveProperty('status', 'healthy');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('uptime');
      expect(result).toHaveProperty('memory');
      expect(result).toHaveProperty('requests');
      expect(result).toHaveProperty('environment');

      expect(result.uptime).toHaveProperty('milliseconds');
      expect(result.uptime).toHaveProperty('seconds');
      expect(result.uptime).toHaveProperty('minutes');
      expect(result.uptime).toHaveProperty('hours');

      expect(result.memory).toHaveProperty('rss');
      expect(result.memory).toHaveProperty('heapTotal');
      expect(result.memory).toHaveProperty('heapUsed');
      expect(result.memory).toHaveProperty('external');

      expect(result.requests).toHaveProperty('total');
      expect(result.requests).toHaveProperty('errors');
      expect(result.requests).toHaveProperty('successRate');

      expect(result.environment).toHaveProperty('nodeVersion');
      expect(result.environment).toHaveProperty('platform');
      expect(result.environment).toHaveProperty('arch');
      expect(result.environment).toHaveProperty('nodeEnv');
    });

    it('should calculate success rate correctly', async () => {
      // Simulate some requests and errors
      service.incrementRequestCount();
      service.incrementRequestCount();
      service.incrementErrorCount();

      const result = await service.getHealthStatus();

      expect(result.requests.total).toBe(2);
      expect(result.requests.errors).toBe(1);
      expect(result.requests.successRate).toBe('50.00%');
    });
  });

  describe('incrementRequestCount', () => {
    it('should increment request count', () => {
      const initialCount = (service as unknown as { requestCount: number }).requestCount;
      service.incrementRequestCount();
      expect((service as unknown as { requestCount: number }).requestCount).toBe(initialCount + 1);
    });
  });

  describe('incrementErrorCount', () => {
    it('should increment error count', () => {
      const initialCount = (service as unknown as { errorCount: number }).errorCount;
      service.incrementErrorCount();
      expect((service as unknown as { errorCount: number }).errorCount).toBe(initialCount + 1);
    });
  });

  describe('getDetailedMetrics', () => {
    it('should return detailed metrics with correct structure', async () => {
      const result = await service.getDetailedMetrics();

      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('uptime');
      expect(result).toHaveProperty('memory');
      expect(result).toHaveProperty('cpu');
      expect(result).toHaveProperty('requests');
      expect(result).toHaveProperty('process');

      expect(result.memory).toHaveProperty('rss');
      expect(result.memory).toHaveProperty('heapTotal');
      expect(result.memory).toHaveProperty('heapUsed');
      expect(result.memory).toHaveProperty('external');
      expect(result.memory).toHaveProperty('arrayBuffers');

      expect(result.cpu).toHaveProperty('user');
      expect(result.cpu).toHaveProperty('system');

      expect(result.requests).toHaveProperty('total');
      expect(result.requests).toHaveProperty('errors');
      expect(result.requests).toHaveProperty('successRate');

      expect(result.process).toHaveProperty('pid');
      expect(result.process).toHaveProperty('ppid');
      expect(result.process).toHaveProperty('title');
      expect(result.process).toHaveProperty('argv');
      expect(result.process).toHaveProperty('execPath');
    });
  });

  describe('resetCounters', () => {
    it('should reset counters and return success message', () => {
      // Add some data first
      service.incrementRequestCount();
      service.incrementRequestCount();
      service.incrementErrorCount();

      const result = service.resetCounters();

      expect(result).toHaveProperty('message', 'Counters reset successfully');
      expect(result).toHaveProperty('timestamp');
      expect((service as unknown as { requestCount: number }).requestCount).toBe(0);
      expect((service as unknown as { errorCount: number }).errorCount).toBe(0);
    });

    it('should reset start time', () => {
      const beforeReset = (service as unknown as { startTime: number }).startTime;

      // Wait a bit to ensure time difference
      setTimeout(() => {
        service.resetCounters();
        const afterReset = (service as unknown as { startTime: number }).startTime;
        expect(afterReset).toBeGreaterThan(beforeReset);
      }, 10);
    });
  });
});
