# RFC2: Decorador `@Log` para Instrumentação Estruturada em TypeScript

**Status:** Aprovada
**Autor:** Mateus Macedo Dos Anjos
**Data:** 01/09/2025
**Escopo:** Serviços Node.js/TypeScript (NestJS — Express e Fastify — e libs internas)
**Decisão Relacionada (ADR):** [ADR1: Padronização de Log com Decorator `@Log`]

----------

## 1. Contexto e Problema

Os serviços registram logs de modo heterogêneo: formatação diversa, ausência de `correlationId`, vazamento de dados sensíveis e falta de padrão para medir duração de chamadas. Precisamos de um mecanismo leve e reaproveitável que:

- **padronize logs** (JSON estruturado),

- **propague correlação** por requisição,

- **mascare dados sensíveis** por padrão,

- meça **latência** e diferencie **sucesso/erro**,

- funcione em **métodos sync/async** com baixo atrito.

## 2. Objetivos

- Decorador de método `@Log` com opções tipadas.

- Evento de log **estruturado** com `class/method`, `durationMs`, `outcome`, `args/result` opcionais.

- **Redatores padrão** (CPF/CNPJ, e-mail, tokens, chaves comuns) com `keepLengths=false` (padrão) e opção de habilitar.

- **Amostragem** por `sampleRate`.

- **Sink pluggable**, com implementação para **Pino**.

- **CorrelationId** via `AsyncLocalStorage` + header `x-correlation-id` (Express/Fastify/Nest).

### Não-objetivos

- Tracing distribuído completo (use **OpenTelemetry**).

- Validação de domínio/contratos (feito fora do `@Log`).

- Migração automática de todos os pontos de log legados.

## 3. Proposta

### 3.1 API (tipos principais)

```ts
export type LogLevel = 'trace'|'debug'|'info'|'warn'|'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  scope: { className?: string; methodName: string };
  outcome: 'success' | 'failure';
  args?: unknown[];
  result?: unknown;
  error?: { name: string; message: string; stack?: string };
  correlationId?: string;
  durationMs: number;
}

export interface LogOptions {
  level?: LogLevel;
  includeArgs?: boolean;
  includeResult?: boolean;
  sampleRate?: number; // 0..1
  redact?: (v: unknown) => unknown; // redatores custom
  sink?: (entry: LogEntry) => void;  // destino
  getCorrelationId?: () => string | undefined;
}
```

### 3.2 Decorador `@Log` (resumo de comportamento)

- Envolve `descriptor.value`.

- Mede tempo de execução (usa `performance.now()`).

- Detecta `Promise` para registrar após `then/catch`.

- Aplica **amostragem** antes de instrumentar.

- Monta `LogEntry` e envia ao **sink**.

- Aplica `redact(args/result)` (padrão + custom).

- **Valores padrão**: `level="info"`, `includeArgs=true`, `includeResult=false`, `sampleRate=1`.

### 3.3 Redação de dados sensíveis

- `createRedactor({ keys, patterns, keepLengths=false, redactArrayIndices=true, maxDepth=5 })` com chaves comuns (`password`, `token`, `authorization`, `cpf`, `cnpj` etc.) e regex (CPF/CNPJ, e-mail, tokens hex).

- **Padrão**: `keepLengths=false` (usa `***` como máscara).

- **Suporte a tipos especiais**: `Date`, `RegExp`, `Buffer`, `Stream`, `Map`, `Set`, `Error`.

- **Tratamento de ciclos**: `[Circular]` para referências circulares.

- **Profundidade limitada**: `[MaxDepth]` para estruturas muito profundas.

- **Redação de índices de array**: opção `redactArrayIndices=true` por padrão.

- `composeRedactors` para combinar redator padrão + específico da equipe.

### 3.4 Sink para Pino

```ts
import pino, { Logger } from 'pino';
import { LogEntry } from './types';

export interface PinoSinkOptions {
  logger?: Logger;
  loggerOptions?: LoggerOptions;
  service?: string;
  env?: string;
  version?: string;
  messageFormat?: (e: LogEntry) => string;
}

export function createPinoSink(opts: PinoSinkOptions = {}) {
  // ... implementação
  return function pinoSink(e: LogEntry) {
    const level = asLevel(e.level as string);
    const { level: _drop, ...payload } = e;
    const l = e.correlationId ? logger.child({ cid: e.correlationId }) : logger;
    l[level](payload, fmt(e));
  };
}
```

### 3.5 CorrelationId via ALS

- **Express/Nest**: _middleware_ que lê `x-correlation-id` (ou gera), ecoa no response e executa `reqStore.run({ cid })`.

- **Fastify/Nest**: plugin com `onRequest` fazendo o mesmo.

- **Função `ensureCid`**: valida header recebido ou gera UUID v4.

```ts
// Uso no decorator
@Log({ sink: pinoSink, getCorrelationId: getCid, includeArgs: true })
method(...) { ... }
```

## 4. Exemplos de Uso

```ts
class Svc {
  @Log({ includeArgs: true, sampleRate: 1 })
  total(a: number, b: number) { return a + b; }

  @Log({ includeResult: true }) // result será redatado quando aplicável
  async load(id: string) { return { id, ok: true, token: 'abc123def456' }; }
}
```

**Redator custom adicional (opcional):**

```ts
const redactAuth = createRedactor({
  keys: [/^authorization$/i, 'password', 'token'],
  patterns: [/\bBearer\s+[A-Za-z0-9\-._=]+\b/gi],
  keepLengths: true, // preserva tamanho das strings
});
@Log({ redact: composeRedactors(defaultRedactor, redactAuth) })
async secure(...) { ... }
```

## 5. Design e Considerações

- **Compatibilidade:** Node ≥ 16 (ALS), TypeScript com `experimentalDecorators`.

- **Overhead:** ~wrap simples + `performance.now()`. `sampleRate` permite reduzir custo.

- **Erros:** capturados e enviados ao sink com `error.name/message/stack`.

- **`this`** preservado com `apply`.

- **Propriedades sensíveis:** evitamos acesso direto; usamos `redact` sobre `args/result`.

- **Ciclos/estruturas profundas:** `redactor` trata `[Circular]` e `maxDepth`.

- **Sink padrão**: `console.log(JSON.stringify(e))` quando não especificado.

## 6. Segurança e Privacidade

- **Padrão seguro**: `keepLengths=false` (usa `***` como máscara padrão), chaves e padrões comuns pré-configurados.

- **Extensível**: times podem acrescentar chaves/padrões de domínios específicos.

- **Governança**: orientar a **não** incluir payloads grandes ou PII desnecessária em `result`.

- **Tratamento robusto**: fallback para `[Unredactable]` em caso de erro na redação.

## 7. Observabilidade e Integração

- **Pino** como logger padrão (dev: `pino-pretty`; prod: JSON).

- `correlationId` em todos os eventos (campo `cid`).

- Compatível com agregadores (Loki/Elasticsearch).

- **Futuro**: integrar `traceId/spanId` do OpenTelemetry no `LogEntry`.

## 8. Testes

- **Unit**:

  - redator mascara chaves/padrões (CPF/CNPJ/e-mail/token).

  - `sampleRate` (0, 0.5, 1) respeitado.

  - sync/async geram `success`/`failure` corretamente.

  - tratamento de tipos especiais (Date, Buffer, Stream, etc.).

- **E2E**:

  - Nest+Express e Nest+Fastify propagam `x-correlation-id` até o `@Log`.

  - `includeArgs/includeResult` respeitados.

- **Contrato**: validar shape de `LogEntry` no sink.

## 9. Plano de Adoção

1. **Piloto** em 1 serviço (2 endpoints críticos).

2. Criar **guia de uso** + snippet de ESLint/TS para incentivar adoção.

3. Expandir para serviços core; **desligar logs ad-hoc** redundantes.

4. Dashboards/KPIs: latência média por método, taxa de erro, top N métodos mais lentos.

## 10. Riscos e Mitigações

- **Vazamento por esquecimento de redator custom** → padrão seguro + checklist em PR.

- **Overhead** em hot paths → `sampleRate`, limitar `includeResult`.

- **Quebra por decorator em métodos críticos** → rollout gradativo, feature flag (ex.: `LOG_DECORATOR=off` desativa via _no-op_ na factory).

- **Dados grandes** → limitar tamanho serializado no sink (ex.: truncar strings > N chars antes do `console/pino`).

## 11. Alternativas Consideradas

- **Interceptors apenas** (Nest): boa para HTTP, não cobre chamadas internas nem libs.

- **AOP/lib externas** (ex.: proxies dinâmicos): mais intrusivo/complexo.

- **Novos decoradores (TC39/TS 5+)**: ainda não adotados no stack atual.

## 12. Critérios de Aceite

- Logs estruturados com `scope`, `durationMs`, `outcome` e `cid`.

- Redator padrão ativo com `keepLengths=false`.

- Testes E2E Express e Fastify aprovados.

- Guia de migração publicado.

## 13. Anexos (trechos de referência)

- `LogOptions`, `LogEntry`, `@Log` (já implementados).

- `createRedactor` e `composeRedactors` com suporte a tipos especiais.

- `createPinoSink` + configuração `pino-pretty`.

- Middleware/Plugin de `x-correlation-id` (Express/Fastify).

- **Implementação atual**: `libs/logger/src/nestjs/decorator/`
