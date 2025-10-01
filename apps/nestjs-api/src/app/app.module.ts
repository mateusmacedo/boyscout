import { CorrelationIdMiddleware } from '@boyscout/node-logger';
import { type MiddlewareConsumer, Module, type NestModule } from '@nestjs/common';
import { AnalyticsController } from './analytics/analytics.controller';
import { AnalyticsService } from './analytics/analytics.service';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './health/health.controller';
import { HealthService } from './health/health.service';
import { CustomLoggerController } from './monitoring/custom-logger.controller';
import { CustomLoggerService } from './monitoring/custom-logger.service';
import { UserController } from './user/user.controller';
import { UserService } from './user/user.service';

@Module({
  imports: [],
  controllers: [
    AppController,
    UserController,
    AnalyticsController,
    HealthController,
    CustomLoggerController,
  ],
  providers: [AppService, UserService, AnalyticsService, HealthService, CustomLoggerService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Middleware de correlação de requisições para todas as rotas
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
