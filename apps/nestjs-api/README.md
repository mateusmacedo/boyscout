# NestJS API com @boyscout/node-logger

Integração seguindo padrões ADR/RFC da lib `@boyscout/node-logger` no NestJS.

## Estrutura da Integração

### Componentes Nativos da Lib (conforme ADR)
- ✅ `@Log` decorator - usado diretamente da lib
- ✅ `CorrelationIdMiddleware` - middleware nativo para correlação de requisições
- ✅ `getCid()` - função nativa para obter correlation ID
- ✅ `defaultRedactor` - redator nativo para dados sensíveis (CPF, CNPJ, senhas)
- ✅ `createPinoSink()` - sink nativo do Pino

### Configuração Global (conforme RFC)
- 🔧 **Metadados da aplicação** - service, env, version via Pino sink
- 🔧 **Correlation ID** - rastreamento automático via AsyncLocalStorage
- 🔧 **Redação automática** - dados sensíveis via defaultRedactor da lib

## Uso

### Decorators Seguindo Padrões ADR/RFC
```typescript
import { GlobalLog, GlobalLogError, GlobalLogPerformance } from '../decorators/global-log.decorator';

// Padrão: level='info', includeArgs=true, includeResult=false, sampleRate=1
@GlobalLog()
getData() {
  return { message: 'Hello' };
}

// Erro: level='error', includeResult=true
@GlobalLogError()
async handleError() {
  throw new Error('Something went wrong');
}

// Performance: sampleRate=0.1 (conforme RFC)
@GlobalLogPerformance()
async heavyOperation() {
  // Operação pesada
}
```

### Middleware de Correlação (conforme ADR)
```typescript
// Configurado no AppModule - propaga x-correlation-id
consumer
  .apply(CorrelationIdMiddleware)
  .forRoutes('*');
```

## Endpoints da API

- `GET /api` - Dados básicos
- `GET /api/async` - Operação assíncrona
- `GET /api/error` - Simulação de erro
- `POST /api/user` - Processamento de dados sensíveis

## Logs Estruturados (conforme ADR)

Todos os logs incluem automaticamente:
- **Correlation ID** - rastreamento de requisições via AsyncLocalStorage
- **Scope** - className e methodName
- **Outcome** - success/failure
- **Duration** - tempo de execução em ms
- **Dados sensíveis redatados** - CPF, CNPJ, senhas, tokens (via defaultRedactor)
- **Metadados da aplicação** - service, env, version

## Executar

```bash
pnpm nx serve nestjs-api
```

A aplicação estará disponível em `http://localhost:3000/api`
