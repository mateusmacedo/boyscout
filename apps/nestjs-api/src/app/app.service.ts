import { Log } from '@boyscout/node-logger';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  @Log({
    level: 'info',
    includeArgs: true,
    includeResult: false,
  })
  getData(): { message: string } {
    return { message: 'Hello API' };
  }

  @Log({
    level: 'info',
    includeArgs: true,
    includeResult: true,
    sampleRate: 0.1,
  })
  async getDataAsync(): Promise<{ message: string; timestamp: string }> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return {
      message: 'Hello API Async',
      timestamp: new Date().toISOString(),
    };
  }

  @Log({
    level: 'error',
    includeArgs: true,
    includeResult: true,
  })
  getDataWithError(): Promise<{ message: string }> {
    throw new Error('Simulated error for logging demonstration');
  }

  @Log({
    level: 'info',
    includeArgs: true,
    includeResult: false,
  })
  processUserData(userData: { name: string; email: string; password: string; cardNumber: string }) {
    // Dados sensíveis são automaticamente redatados pelo redator padrão da lib
    return {
      id: Math.random().toString(36).substr(2, 9),
      name: userData.name,
      email: userData.email,
    };
  }
}
