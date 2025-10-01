import { Log } from '@boyscout/node-logger';
import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @Log({
    level: 'info',
    includeArgs: true,
    includeResult: true,
  })
  async getHealth() {
    try {
      this.healthService.incrementRequestCount();
      return await this.healthService.getHealthStatus();
    } catch (_error) {
      this.healthService.incrementErrorCount();
      throw new HttpException('Health check failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('metrics')
  @Log({
    level: 'debug',
    includeArgs: true,
    includeResult: true,
    sampleRate: 0.1, // Apenas 10% dos logs para debug
  })
  async getMetrics() {
    try {
      return await this.healthService.getDetailedMetrics();
    } catch (_error) {
      this.healthService.incrementErrorCount();
      throw new HttpException('Failed to get metrics', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('reset')
  @Log({
    level: 'warn',
    includeArgs: true,
    includeResult: false,
  })
  async resetCounters() {
    try {
      return await this.healthService.resetCounters();
    } catch (_error) {
      throw new HttpException('Failed to reset counters', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
