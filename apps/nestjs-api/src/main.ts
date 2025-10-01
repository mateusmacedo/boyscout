/**
 * NestJS API com integração do @boyscout/node-logger
 * Seguindo padrões ADR/RFC da lib
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    const app = await NestFactory.create(AppModule);
    const globalPrefix = 'api';
    app.setGlobalPrefix(globalPrefix);

    const port = process.env.PORT || 3000;
    await app.listen(port);

    logger.log(`🚀 Application is running on: http://localhost:${port}/${globalPrefix}`);
  } catch (error) {
    logger.error('Failed to start application', (error as Error).stack);
    process.exit(1);
  }
}

bootstrap();
