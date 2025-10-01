import { Log } from '@boyscout/node-logger';
import { Body, Controller, Get, HttpException, HttpStatus, Post } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Log({
    level: 'info',
    includeArgs: true,
    includeResult: false,
  })
  getData() {
    return this.appService.getData();
  }

  @Get('async')
  @Log({
    level: 'info',
    includeArgs: true,
    includeResult: true,
    sampleRate: 0.1,
  })
  getDataAsync() {
    return this.appService.getDataAsync();
  }

  @Get('error')
  @Log({
    level: 'error',
    includeArgs: true,
    includeResult: true,
  })
  async getDataWithError() {
    try {
      return await this.appService.getDataWithError();
    } catch (_error) {
      throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('user')
  @Log({
    level: 'info',
    includeArgs: true,
    includeResult: false,
  })
  processUser(
    @Body() userData: { name: string; email: string; password: string; cardNumber: string }
  ) {
    return this.appService.processUserData(userData);
  }

  @Post('complex')
  @Log({
    level: 'debug',
    includeArgs: true,
    includeResult: true,
  })
  processComplex(@Body() data: Record<string, unknown>) {
    return this.appService.processComplexData(data);
  }

  @Post('validate')
  @Log({
    level: 'warn',
    includeArgs: true,
    includeResult: false,
  })
  validate(@Body() input: Record<string, unknown>) {
    return this.appService.validateInput(input);
  }
}
