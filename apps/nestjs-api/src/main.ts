/**
 * NestJS API com integração do @boyscout/node-logger
 * Seguindo padrões ADR/RFC da lib
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { CustomLogger } from './config/custom-logger';

async function bootstrap() {
  const logger = new CustomLogger();

  try {
    const app = await NestFactory.create(AppModule, {
      logger: logger,
    });

    const globalPrefix = 'api';
    app.setGlobalPrefix(globalPrefix);

    const port = process.env.PORT || 3000;
    const serviceName = process.env.SERVICE_NAME || 'nestjs-api';
    const serviceVersion = process.env.SERVICE_VERSION || '1.0.0';

    await app.listen(port);

    logger.log(
      `🚀 ${serviceName} v${serviceVersion} is running on: http://localhost:${port}/${globalPrefix}`,
      'Bootstrap'
    );
  } catch (error) {
    logger.error('Failed to start application', (error as Error).stack, 'Bootstrap');
    process.exit(1);
  }
}

bootstrap();
