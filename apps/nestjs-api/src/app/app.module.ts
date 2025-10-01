import { CorrelationIdMiddleware } from '@boyscout/node-logger';
import { type MiddlewareConsumer, Module, type NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*'); // Aplicar para todas as rotas
  }
}
