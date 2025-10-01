import { Log } from '@boyscout/node-logger';
import { Injectable } from '@nestjs/common';

/**
 * Serviço de Logging Customizado - Demonstra uso avançado do @Log decorator
 * com diferentes estratégias de logging baseadas no contexto
 */
@Injectable()
export class CustomLoggerService {
  private logBuffer: Array<{
    level: string;
    message: string;
    timestamp: Date;
    context?: Record<string, unknown>;
  }> = [];
  private maxBufferSize = 1000;

  @Log({
    level: 'info',
    includeArgs: true,
    includeResult: false,
  })
  logBusinessEvent(event: string, data: Record<string, unknown>) {
    const logEntry = {
      level: 'info',
      message: `Business Event: ${event}`,
      timestamp: new Date(),
      context: {
        event,
        data,
        service: 'business-logger',
      },
    };

    this.addToBuffer(logEntry);
    return { logged: true, event, timestamp: logEntry.timestamp };
  }

  @Log({
    level: 'warn',
    includeArgs: true,
    includeResult: false,
  })
  logSecurityEvent(event: string, details: Record<string, unknown>) {
    const logEntry = {
      level: 'warn',
      message: `Security Event: ${event}`,
      timestamp: new Date(),
      context: {
        event,
        details,
        service: 'security-logger',
        severity: 'high',
      },
    };

    this.addToBuffer(logEntry);
    return { logged: true, event, timestamp: logEntry.timestamp };
  }

  @Log({
    level: 'error',
    includeArgs: true,
    includeResult: true,
  })
  logSystemError(error: Error, context: Record<string, unknown> = {}) {
    const logEntry = {
      level: 'error',
      message: `System Error: ${error.message}`,
      timestamp: new Date(),
      context: {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        ...context,
        service: 'system-logger',
      },
    };

    this.addToBuffer(logEntry);
    return { logged: true, error: error.name, timestamp: logEntry.timestamp };
  }

  @Log({
    level: 'debug',
    includeArgs: true,
    includeResult: true,
    sampleRate: 0.2, // Apenas 20% dos logs de debug
  })
  logPerformanceMetric(metric: string, value: number, unit: string = 'ms') {
    const logEntry = {
      level: 'debug',
      message: `Performance Metric: ${metric}`,
      timestamp: new Date(),
      context: {
        metric,
        value,
        unit,
        service: 'performance-logger',
      },
    };

    this.addToBuffer(logEntry);
    return { logged: true, metric, value, unit, timestamp: logEntry.timestamp };
  }

  @Log({
    level: 'info',
    includeArgs: true,
    includeResult: true,
  })
  getLogSummary() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const recentLogs = this.logBuffer.filter((log) => log.timestamp > oneHourAgo);
    const logsByLevel = this.logBuffer.reduce(
      (acc, log) => {
        acc[log.level] = (acc[log.level] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      totalLogs: this.logBuffer.length,
      recentLogs: recentLogs.length,
      logsByLevel,
      bufferSize: this.logBuffer.length,
      maxBufferSize: this.maxBufferSize,
      oldestLog: this.logBuffer[0]?.timestamp,
      newestLog: this.logBuffer[this.logBuffer.length - 1]?.timestamp,
    };
  }

  @Log({
    level: 'warn',
    includeArgs: true,
    includeResult: false,
  })
  clearOldLogs(olderThanHours: number = 24) {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - olderThanHours);

    const initialCount = this.logBuffer.length;
    this.logBuffer = this.logBuffer.filter((log) => log.timestamp > cutoffTime);
    const removedCount = initialCount - this.logBuffer.length;

    return {
      removedLogs: removedCount,
      remainingLogs: this.logBuffer.length,
      cutoffTime,
    };
  }

  @Log({
    level: 'debug',
    includeArgs: true,
    includeResult: true,
    sampleRate: 0.1, // Apenas 10% dos logs para debug
  })
  getLogsByLevel(level: string, limit: number = 100) {
    const filteredLogs = this.logBuffer
      .filter((log) => log.level === level)
      .slice(-limit)
      .reverse(); // Mais recentes primeiro

    return {
      level,
      count: filteredLogs.length,
      logs: filteredLogs.map((log) => ({
        message: log.message,
        timestamp: log.timestamp,
        context: log.context,
      })),
    };
  }

  private addToBuffer(logEntry: {
    level: string;
    message: string;
    timestamp: Date;
    context?: Record<string, unknown>;
  }) {
    this.logBuffer.push(logEntry);

    // Manter buffer dentro do limite
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer = this.logBuffer.slice(-this.maxBufferSize);
    }
  }
}
