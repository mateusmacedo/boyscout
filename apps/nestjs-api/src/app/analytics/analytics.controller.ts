import { Log } from '@boyscout/node-logger';
import { Body, Controller, Get, HttpException, HttpStatus, Post, Query } from '@nestjs/common';
import type { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('track')
  @Log({
    level: 'info',
    includeArgs: true,
    includeResult: false,
  })
  trackEvent(@Body() body: { event: string; data?: Record<string, unknown> }) {
    this.analyticsService.trackEvent(body.event, body.data);
    return { message: 'Event tracked successfully' };
  }

  @Get('metrics')
  @Log({
    level: 'debug',
    includeArgs: true,
    includeResult: true,
    sampleRate: 0.1,
  })
  async getMetrics(@Query('event') eventName?: string) {
    try {
      return await this.analyticsService.getEventMetrics(eventName);
    } catch (_error) {
      throw new HttpException('Failed to get metrics', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('performance')
  @Log({
    level: 'warn',
    includeArgs: true,
    includeResult: false,
  })
  async getPerformanceMetrics() {
    try {
      return await this.analyticsService.getPerformanceMetrics();
    } catch (_error) {
      throw new HttpException(
        'Failed to get performance metrics',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('report')
  @Log({
    level: 'error',
    includeArgs: true,
    includeResult: true,
  })
  async generateReport(@Body() body: { startDate: string; endDate: string }) {
    try {
      const startDate = new Date(body.startDate);
      const endDate = new Date(body.endDate);

      if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
        throw new HttpException('Invalid date format', HttpStatus.BAD_REQUEST);
      }

      if (startDate >= endDate) {
        throw new HttpException('Start date must be before end date', HttpStatus.BAD_REQUEST);
      }

      return await this.analyticsService.generateReport(startDate, endDate);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to generate report', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('cleanup')
  @Log({
    level: 'info',
    includeArgs: true,
    includeResult: false,
  })
  async cleanupOldEvents(@Body() body: { olderThanDays?: number }) {
    const olderThanDays = body.olderThanDays || 30;
    return await this.analyticsService.clearOldEvents(olderThanDays);
  }
}
