import { Log } from '@boyscout/node-logger';
import { Injectable } from '@nestjs/common';

/**
 * Serviço de Health Check - Demonstra uso do @Log decorator
 * para monitoramento e observabilidade
 */
@Injectable()
export class HealthService {
  private startTime = Date.now();
  private requestCount = 0;
  private errorCount = 0;

  @Log({
    level: 'info',
    includeArgs: true,
    includeResult: true,
  })
  getHealthStatus() {
    const uptime = Date.now() - this.startTime;
    const memoryUsage = process.memoryUsage();

    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: {
        milliseconds: uptime,
        seconds: Math.floor(uptime / 1000),
        minutes: Math.floor(uptime / (1000 * 60)),
        hours: Math.floor(uptime / (1000 * 60 * 60)),
      },
      memory: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        external: Math.round(memoryUsage.external / 1024 / 1024), // MB
      },
      requests: {
        total: this.requestCount,
        errors: this.errorCount,
        successRate:
          this.requestCount > 0
            ? `${(((this.requestCount - this.errorCount) / this.requestCount) * 100).toFixed(2)}%`
            : '0%',
      },
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        nodeEnv: process.env.NODE_ENV || 'development',
        serviceName: process.env.SERVICE_NAME || 'nestjs-api',
        serviceVersion: process.env.SERVICE_VERSION || '1.0.0',
        port: process.env.PORT || '3000',
      },
    };
  }

  @Log({
    level: 'debug',
    includeArgs: true,
    includeResult: false,
  })
  incrementRequestCount() {
    this.requestCount++;
  }

  @Log({
    level: 'error',
    includeArgs: true,
    includeResult: false,
  })
  incrementErrorCount() {
    this.errorCount++;
  }

  @Log({
    level: 'warn',
    includeArgs: true,
    includeResult: true,
  })
  getDetailedMetrics() {
    const uptime = Date.now() - this.startTime;
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      timestamp: new Date().toISOString(),
      uptime: uptime,
      memory: {
        rss: memoryUsage.rss,
        heapTotal: memoryUsage.heapTotal,
        heapUsed: memoryUsage.heapUsed,
        external: memoryUsage.external,
        arrayBuffers: memoryUsage.arrayBuffers,
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
      requests: {
        total: this.requestCount,
        errors: this.errorCount,
        successRate:
          this.requestCount > 0 ? (this.requestCount - this.errorCount) / this.requestCount : 0,
      },
      process: {
        pid: process.pid,
        ppid: process.ppid,
        title: process.title,
        argv: process.argv,
        execPath: process.execPath,
      },
    };
  }

  @Log({
    level: 'info',
    includeArgs: true,
    includeResult: false,
  })
  resetCounters() {
    this.requestCount = 0;
    this.errorCount = 0;
    this.startTime = Date.now();

    return {
      message: 'Counters reset successfully',
      timestamp: new Date().toISOString(),
    };
  }
}
