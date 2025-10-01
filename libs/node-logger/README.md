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
- **Integração com Pino**: Sink configurável para logs estruturados
- **Suporte a Express e Fastify**: Middlewares e plugins para correlação de requisições
- **TypeScript**: Tipagem completa para melhor experiência de desenvolvimento

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

Para configurações mais avançadas, você pode usar o sink do Pino e redatores personalizados:

```typescript
import { Log, createPinoSink, createRedactor, getCid } from '@boyscout/node-logger';

// Configurar o sink do Pino
const pinoSink = createPinoSink({
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
| `sink` | `function` | `console.log` | Função para processar os logs |
| `getCorrelationId` | `function` | `undefined` | Função para obter ID de correlação |

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
```

### Integração com Fastify

Para aplicações Fastify, use o plugin de correlação:

```typescript
import { correlationIdPlugin } from '@boyscout/node-logger';

// No seu main.ts
const app = await NestFactory.create(AppModule, {
    logger: new Logger()
});

// Registrar o plugin
app.getHttpAdapter().getInstance().register(correlationIdPlugin);
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
- `CorrelationIdMiddleware`: Middleware para Express
- `correlationIdPlugin`: Plugin para Fastify

### Tipos

- `LogLevel`: Níveis de log disponíveis
- `LogEntry`: Estrutura de entrada de log
- `LogOptions`: Opções do decorator
- `RedactorOptions`: Opções do redator
- `PinoSinkOptions`: Opções do sink do Pino
