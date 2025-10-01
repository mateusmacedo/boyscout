# @boyscout/node-logger

Esse pacote é responsável por padronizar os logs de uma aplicação através de decorators automáticos, correlação de requisições e redação de dados sensíveis. O pacote oferece integração com **Pino** e suporte para **Express** e **Fastify**.

## Instalação

Para instalar o pacote, execute o comando abaixo:

```bash
pnpm add @boyscout/node-logger
```

## Funcionalidades

- **Decorators automáticos**: Logging automático de métodos com rastreamento de performance
- **Correlação de requisições**: Sistema de correlation ID para rastreamento de requisições
- **Redação de dados sensíveis**: Redação automática de senhas, tokens e dados pessoais
- **Integração com Pino**: Sink padrão para logs estruturados com configurações otimizadas
- **Suporte a Express e Fastify**: Middlewares e plugins para correlação de requisições
- **TypeScript**: Tipagem completa para melhor experiência de desenvolvimento
- **Otimizações de Performance**: Buffer inteligente e backpressure para picos de logs
- **Graceful Shutdown**: Limpeza automática de buffers e flush de logs no encerramento
- **Fallback Inteligente**: Funciona mesmo sem Pino instalado (modo mock)

## Utilização

### Decorator Básico

O pacote oferece um decorator `@Log` para logging automático de métodos:

```typescript
import { Log } from '@boyscout/node-logger';

class UserService {
    @Log({
        level: "info",
        includeArgs: true,
        includeResult: false
    })
    async findUserById(id: string) {
        // Lógica do método
        return await this.userRepository.findById(id);
    }
}
```

### Configuração Avançada

Por padrão, o decorator `@Log` usa o sink do Pino com configurações otimizadas. Para configurações mais avançadas, você pode personalizar o sink do Pino e redatores:

```typescript
import { Log, createPinoSink, createRedactor, getCid } from '@boyscout/node-logger';

// O sink do Pino é usado por padrão, mas você pode personalizá-lo
const customPinoSink = createPinoSink({
    service: "minha-aplicacao",
    env: "production",
    version: "1.0.0"
});

// Configurar o redator para dados sensíveis
const redactor = createRedactor({
    keys: ["password", "token", "cardNumber", "cvv"],
    patterns: [/\b\d{4}\s\d{4}\s\d{4}\s\d{4}\b/g],
    mask: "REDACTED"
});

class UserService {
    @Log({
        level: "info",
        includeArgs: true,
        includeResult: false,
        sink: pinoSink,
        redact: redactor,
        getCorrelationId: getCid
    })
    async findUserById(id: string) {
        // Lógica do método
        return await this.userRepository.findById(id);
    }
}
```

### Opções do Decorator `@Log`

| Opção | Tipo | Padrão | Descrição |
|-------|------|--------|-----------|
| `level` | `"trace" \| "debug" \| "info" \| "warn" \| "error"` | `"info"` | Nível do log |
| `includeArgs` | `boolean` | `true` | Incluir argumentos do método no log |
| `includeResult` | `boolean` | `false` | Incluir resultado do método no log |
| `sampleRate` | `number` | `1` | Taxa de amostragem (0-1) |
| `redact` | `function` | Redator padrão | Função para redação de dados sensíveis |
| `sink` | `function` | Sink Pino padrão | Função para processar os logs |
| `getCorrelationId` | `function` | `getCid` | Função para obter ID de correlação |

### Redação de Dados Sensíveis

O sistema inclui um redator robusto que pode ser configurado para mascarar dados sensíveis:

```typescript
import { createRedactor } from '@boyscout/node-logger';

const customRedactor = createRedactor({
    // Chaves sensíveis para redação
    keys: [
        "password", "passwd", "pass", "pwd",
        "token", "access_token", "refresh_token",
        "authorization", "auth", "secret",
        "apiKey", "api_key", "apikey",
        "client_secret", "card", "cardNumber",
        "cvv", "cvc", "ssn", "cpf", "cnpj"
    ],
    // Padrões regex para redação
    patterns: [
        /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/gi, // CPF
        /\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/gi, // CNPJ
        /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/gi, // Email
        /\b(?:[A-Fa-f0-9]{32,64})\b/g // Hashes
    ],
    mask: "***", // Texto de mascaramento
    maxDepth: 5, // Profundidade máxima de recursão
    keepLengths: false, // Manter comprimento original
    redactArrayIndices: true // Redação de índices de array
});
```

### Integração com Express

Para aplicações Express, use o middleware de correlação:

```typescript
import { CorrelationIdMiddleware } from '@boyscout/node-logger';

// No seu módulo NestJS
export class AppModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(CorrelationIdMiddleware)
            .forRoutes('*');
    }
}

// Ou em aplicação Express pura
import express from 'express';
import { CorrelationIdMiddleware } from '@boyscout/node-logger';

const app = express();
app.use(CorrelationIdMiddleware);
```

### Integração com Fastify

Para aplicações Fastify, use o plugin de correlação:

```typescript
import { correlationIdPlugin } from '@boyscout/node-logger';

// No seu main.ts (NestJS com Fastify)
const app = await NestFactory.create(AppModule, {
    logger: new Logger()
});

// Registrar o plugin
app.getHttpAdapter().getInstance().register(correlationIdPlugin);

// Ou em aplicação Fastify pura
import Fastify from 'fastify';
import { correlationIdPlugin } from '@boyscout/node-logger';

const fastify = Fastify();
fastify.register(correlationIdPlugin);
```

### Exemplo Completo de Integração

```typescript
import { Injectable } from '@nestjs/common';
import { Log, createPinoSink, createRedactor, getCid } from '@boyscout/node-logger';

// Configuração global
const pinoSink = createPinoSink({
    service: "user-service",
    env: process.env.NODE_ENV,
    version: "1.0.0"
});

const redactor = createRedactor({
    keys: ["password", "token", "cardNumber"],
    patterns: [/\b\d{4}\s\d{4}\s\d{4}\s\d{4}\b/g]
});

@Injectable()
export class UserService {
    @Log({
        level: "info",
        includeArgs: true,
        includeResult: false,
        sink: pinoSink,
        redact: redactor,
        getCorrelationId: getCid
    })
    async findUserById(id: string) {
        // Simula operação assíncrona
        await new Promise(resolve => setTimeout(resolve, 100));
        return { id, name: "João Silva", email: "joao@example.com" };
    }

    @Log({
        level: "debug",
        includeArgs: true,
        includeResult: true,
        sink: pinoSink,
        redact: redactor,
        getCorrelationId: getCid
    })
    async createUser(userData: { name: string; email: string; password: string }) {
        // A senha será automaticamente redatada nos logs
        const user = await this.userRepository.create(userData);
        return { id: user.id, name: user.name, email: user.email };
    }

    @Log({
        level: "warn",
        includeArgs: true,
        includeResult: false,
        sink: pinoSink,
        redact: redactor,
        getCorrelationId: getCid
    })
    async updateUser(id: string, updates: Partial<{ name: string; email: string }>) {
        const user = await this.userRepository.update(id, updates);
        if (!user) {
            throw new Error(`User with ID ${id} not found`);
        }
        return user;
    }
}
```

## Otimizações de Performance

### Configuração do Sink Pino

O pacote oferece configurações otimizadas para diferentes cenários através do `createPinoSink`:

```typescript
import { createPinoSink } from '@boyscout/node-logger';

// Configuração básica
const basicSink = createPinoSink({
  service: "my-service",
  env: "production",
  version: "1.0.0"
});

// Configuração com otimizações de performance
const optimizedSink = createPinoSink({
  service: "my-service",
  env: "production",
  version: "1.0.0",

  // Otimizações de performance
  enableBackpressure: true,        // Habilita buffer inteligente
  bufferSize: 2000,               // Tamanho do buffer
  flushInterval: 3000,            // Intervalo de flush (ms)

  // Opções do Pino
  loggerOptions: {
    level: 'info',
    base: {
      service: 'my-service',
      env: 'production'
    }
  }
});
```

### Estratégias de Mitigação de Buffer

#### 1. Buffer Inteligente com Backpressure

```typescript
const sink = createPinoSink({
  enableBackpressure: true,
  bufferSize: 1000,
  flushInterval: 5000
});
```

#### 2. Flush Periódico

```typescript
// O sistema automaticamente faz flush baseado no intervalo configurado
const sink = createPinoSink({
  flushInterval: 3000, // Flush a cada 3 segundos
  enableBackpressure: true
});
```

#### 3. Graceful Shutdown

O sistema automaticamente registra handlers de processo para garantir que os logs sejam flushados antes do encerramento:

```typescript
// O sistema automaticamente registra handlers para:
// - beforeExit
// - exit
// - SIGINT
// - SIGTERM
// - SIGQUIT

// Para limpeza manual em testes
import { cleanupAllSinks } from '@boyscout/node-logger';

// Limpar todos os sinks registrados
cleanupAllSinks();
```

### Configurações Recomendadas por Cenário

| Cenário | Buffer Size | Flush Interval | Backpressure | Descrição |
|---------|-------------|----------------|--------------|-----------|
| **Desenvolvimento** | 500 | 5000ms | ❌ | Logs imediatos para debug |
| **Produção** | 1500 | 4000ms | ✅ | Balance entre performance e confiabilidade |
| **Alta Performance** | 2000 | 3000ms | ✅ | Para aplicações com alto volume de logs |
| **Baixa Latência** | 100 | 1000ms | ❌ | Para aplicações que precisam de logs imediatos |

### Estrutura dos Logs Gerados

O decorator gera logs estruturados com as seguintes informações:

```json
{
    "timestamp": "2024-01-15T10:30:00.000Z",
    "level": "info",
    "scope": {
        "className": "UserService",
        "methodName": "findUserById"
    },
    "outcome": "success",
    "args": ["123"],
    "correlationId": "req-123-456",
    "durationMs": 105.2,
    "service": "user-service",
    "env": "production",
    "version": "1.0.0"
}
```

**Nota**: Os campos `service`, `env` e `version` são adicionados pelo sink do Pino baseado na configuração fornecida.

### Tratamento de Erros

O decorator automaticamente captura e loga erros:

```typescript
@Log({
    level: "error",
    includeArgs: true,
    includeResult: false,
    sink: pinoSink,
    redact: redactor,
    getCorrelationId: getCid
})
async deleteUser(id: string) {
    const user = await this.userRepository.findById(id);
    if (!user) {
        throw new Error(`User with ID ${id} not found`);
    }
    return await this.userRepository.delete(id);
}
```

Em caso de erro, o log incluirá:

```json
{
    "timestamp": "2024-01-15T10:30:00.000Z",
    "level": "error",
    "scope": {
        "className": "UserService",
        "methodName": "deleteUser"
    },
    "outcome": "failure",
    "args": ["999"],
    "error": {
        "name": "Error",
        "message": "User with ID 999 not found",
        "stack": "Error: User with ID 999 not found\n    at UserService.deleteUser..."
    },
    "correlationId": "req-123-456",
    "durationMs": 45.1
}
```

## API Reference

### Funções Principais

- `Log(options?)`: Decorator para logging automático de métodos
- `createPinoSink(options?)`: Cria um sink do Pino para logs estruturados
- `createRedactor(options?)`: Cria um redator para dados sensíveis
- `getCid()`: Obtém o correlation ID atual do contexto
- `ensureCid(incoming?)`: Gera ou valida um correlation ID
- `CorrelationIdMiddleware`: Middleware para Express
- `correlationIdPlugin`: Plugin para Fastify
- `cleanupAllSinks()`: Limpa todos os sinks registrados (útil para testes)

### Tipos

- `LogLevel`: Níveis de log disponíveis (`'trace' | 'debug' | 'info' | 'warn' | 'error'`)
- `LogEntry`: Estrutura de entrada de log
- `LogOptions`: Opções do decorator
- `RedactorOptions`: Opções do redator
- `PinoSinkOptions`: Opções do sink do Pino
- `PinoLike`: Interface para loggers compatíveis com Pino

### Opções do PinoSinkOptions

| Opção | Tipo | Padrão | Descrição |
|-------|------|--------|-----------|
| `logger` | `PinoLike` | `undefined` | Logger Pino customizado |
| `loggerOptions` | `LoggerOptions` | `{}` | Opções do Pino |
| `service` | `string` | `'node-logger'` | Nome do serviço |
| `env` | `string` | `process.env.NODE_ENV` | Ambiente |
| `version` | `string` | `'1.0.0'` | Versão do serviço |
| `messageFormat` | `function` | Padrão | Formato da mensagem |
| `enableBackpressure` | `boolean` | `true` | Habilita buffer inteligente |
| `bufferSize` | `number` | `1000` | Tamanho do buffer |
| `flushInterval` | `number` | `5000` | Intervalo de flush (ms) |

## Fallback e Compatibilidade

### Modo Mock

O pacote funciona mesmo sem o Pino instalado, usando um logger mock que não produz saída:

```typescript
// Funciona mesmo sem pino instalado
import { Log } from '@boyscout/node-logger';

class MyService {
  @Log()
  async myMethod() {
    // Logs serão silenciosos se Pino não estiver disponível
    return 'result';
  }
}
```

### Dependências Opcionais

- **Pino**: Se não estiver instalado, o sistema usa um logger mock
- **Express/Fastify**: Middlewares e plugins funcionam independentemente

### Graceful Degradation

O sistema degrada graciosamente em diferentes cenários:

1. **Sem Pino**: Usa logger mock silencioso
2. **Sem AsyncLocalStorage**: Correlation ID não funciona (retorna undefined)
3. **Erro no redator**: Retorna `[Unredactable]` em vez de falhar
4. **Erro no sink**: Logs são ignorados em vez de quebrar a aplicação

## Testes

### Executando os Testes

```bash
# Executar todos os testes
pnpm test

# Executar testes em modo watch
pnpm test:watch

# Executar testes com cobertura
pnpm test:coverage
```

### Estrutura dos Testes

Os testes cobrem:

- **Decorator**: Funcionamento com métodos sync/async, sampleRate, redação
- **Redator**: Mascaramento de dados sensíveis, tipos especiais, referências circulares
- **Sink Pino**: Configuração, buffer, graceful shutdown
- **Correlation ID**: Propagação via AsyncLocalStorage
- **Middlewares/Plugins**: Express e Fastify
- **Fallback**: Funcionamento sem Pino instalado

### Exemplo de Teste

```typescript
import { Log, createRedactor } from '@boyscout/node-logger';

describe('Log Decorator', () => {
  it('should log method execution', () => {
    const mockSink = jest.fn();

    class TestService {
      @Log({ sink: mockSink })
      async testMethod() {
        return 'result';
      }
    }

    const service = new TestService();
    await service.testMethod();

    expect(mockSink).toHaveBeenCalledWith(
      expect.objectContaining({
        outcome: 'success',
        scope: { className: 'TestService', methodName: 'testMethod' }
      })
    );
  });
});
```
