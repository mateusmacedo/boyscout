import { Log } from '@boyscout/node-logger';
import { Body, Controller, Get, HttpException, HttpStatus, Post, Query } from '@nestjs/common';
import type { CustomLoggerService } from './custom-logger.service';

@Controller('monitoring')
export class CustomLoggerController {
  constructor(private readonly customLoggerService: CustomLoggerService) {}

  @Post('business-event')
  @Log({
    level: 'info',
    includeArgs: true,
    includeResult: false,
  })
  logBusinessEvent(@Body() body: { event: string; data: Record<string, unknown> }) {
    try {
      if (!body.event || !body.data) {
        throw new HttpException('Event and data are required', HttpStatus.BAD_REQUEST);
      }
      return this.customLoggerService.logBusinessEvent(body.event, body.data);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to log business event', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('security-event')
  @Log({
    level: 'warn',
    includeArgs: true,
    includeResult: false,
  })
  logSecurityEvent(@Body() body: { event: string; details: Record<string, unknown> }) {
    try {
      if (!body.event || !body.details) {
        throw new HttpException('Event and details are required', HttpStatus.BAD_REQUEST);
      }
      return this.customLoggerService.logSecurityEvent(body.event, body.details);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to log security event', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('system-error')
  @Log({
    level: 'error',
    includeArgs: true,
    includeResult: true,
  })
  logSystemError(
    @Body() body: {
      error: { name: string; message: string; stack?: string };
      context?: Record<string, unknown>;
    }
  ) {
    try {
      const error = new Error(body.error.message);
      error.name = body.error.name;
      if (body.error.stack) {
        error.stack = body.error.stack;
      }

      return this.customLoggerService.logSystemError(error, body.context);
    } catch (_error) {
      throw new HttpException('Failed to log system error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('performance-metric')
  @Log({
    level: 'debug',
    includeArgs: true,
    includeResult: true,
    sampleRate: 0.2,
  })
  logPerformanceMetric(@Body() body: { metric: string; value: number; unit?: string }) {
    try {
      if (!body.metric || body.value === undefined || body.value === null) {
        throw new HttpException('Metric and value are required', HttpStatus.BAD_REQUEST);
      }
      if (typeof body.value !== 'number' || Number.isNaN(body.value)) {
        throw new HttpException('Value must be a valid number', HttpStatus.BAD_REQUEST);
      }
      return this.customLoggerService.logPerformanceMetric(body.metric, body.value, body.unit);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to log performance metric', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('summary')
  @Log({
    level: 'info',
    includeArgs: true,
    includeResult: true,
  })
  getLogSummary() {
    try {
      return this.customLoggerService.getLogSummary();
    } catch (_error) {
      throw new HttpException('Failed to get log summary', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('logs')
  @Log({
    level: 'debug',
    includeArgs: true,
    includeResult: true,
    sampleRate: 0.1,
  })
  getLogsByLevel(@Query('level') level: string, @Query('limit') limit?: string) {
    try {
      const limitNumber = limit ? parseInt(limit, 10) : 100;

      if (!level) {
        throw new HttpException('Level parameter is required', HttpStatus.BAD_REQUEST);
      }

      return this.customLoggerService.getLogsByLevel(level, limitNumber);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to get logs', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('cleanup')
  @Log({
    level: 'warn',
    includeArgs: true,
    includeResult: false,
  })
  clearOldLogs(@Body() body: { olderThanHours?: number }) {
    try {
      const olderThanHours = body.olderThanHours || 24;
      return this.customLoggerService.clearOldLogs(olderThanHours);
    } catch (_error) {
      throw new HttpException('Failed to clear old logs', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
