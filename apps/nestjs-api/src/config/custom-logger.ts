import type { LoggerService, LogLevel } from '@nestjs/common';

/**
 * Logger customizado do NestJS que usa Pino diretamente
 * Compatível com o padrão do @boyscout/node-logger
 */
export class CustomLogger implements LoggerService {
  private readonly pinoLogger: Record<string, (data: unknown) => void> | null;
  private readonly service = 'nestjs-api';
  private readonly env = process.env.NODE_ENV || 'development';
  private readonly version = process.env.SERVICE_VERSION || '1.0.0';

  constructor() {
    // Usar Pino diretamente com configuração compatível com @boyscout/node-logger
    try {
      const pino = require('pino');
      this.pinoLogger = pino({
        level: 'info',
        base: {
          service: this.service,
          env: this.env,
          version: this.version,
        },
        timestamp: pino.stdTimeFunctions.isoTime,
        formatters: {
          level: (label: string) => {
            return { level: label };
          },
        },
      });
    } catch (_error) {
      // Fallback para console se Pino não estiver disponível
      console.warn('Pino não disponível, usando console como fallback');
      this.pinoLogger = null;
    }
  }

  private formatMessage(message: unknown, _context?: string): string {
    if (typeof message === 'string') {
      return message;
    }
    return JSON.stringify(message);
  }

  private logWithPino(level: string, message: unknown, context?: string, trace?: string) {
    if (this.pinoLogger?.[level]) {
      const logData = {
        context: context || 'NestJS',
        message: this.formatMessage(message, context),
        ...(trace && { trace }),
      };

      this.pinoLogger[level](logData);
    } else {
      // Fallback para console com formato JSON
      const logEntry = {
        level,
        time: new Date().toISOString(),
        service: this.service,
        env: this.env,
        version: this.version,
        context: context || 'NestJS',
        message: this.formatMessage(message, context),
        ...(trace && { trace }),
      };
      console.log(JSON.stringify(logEntry));
    }
  }

  log(message: unknown, context?: string) {
    this.logWithPino('info', message, context);
  }

  error(message: unknown, trace?: string, context?: string) {
    this.logWithPino('error', message, context, trace);
  }

  warn(message: unknown, context?: string) {
    this.logWithPino('warn', message, context);
  }

  debug(message: unknown, context?: string) {
    this.logWithPino('debug', message, context);
  }

  verbose(message: unknown, context?: string) {
    this.logWithPino('debug', message, context);
  }

  setLogLevels?(_levels: LogLevel[]) {
    // Implementação opcional para definir níveis de log
    // Por enquanto, não implementado
  }
}
