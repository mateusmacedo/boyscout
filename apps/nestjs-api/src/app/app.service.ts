import { randomUUID } from 'node:crypto';
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
      id: randomUUID(),
      name: userData.name,
      email: userData.email,
    };
  }

  @Log({
    level: 'debug',
    includeArgs: true,
    includeResult: true,
  })
  async processComplexData(data: Record<string, unknown>) {
    // Simula processamento complexo com logging detalhado
    await new Promise((resolve) => setTimeout(resolve, 200));

    const result = {
      processed: true,
      timestamp: new Date().toISOString(),
      dataSize: JSON.stringify(data).length,
    };

    return result;
  }

  @Log({
    level: 'warn',
    includeArgs: true,
    includeResult: false,
  })
  validateInput(input: Record<string, unknown>) {
    if (!input || typeof input !== 'object') {
      throw new Error('Invalid input provided');
    }

    if (input.password && typeof input.password === 'string' && input.password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    return { valid: true };
  }
}
