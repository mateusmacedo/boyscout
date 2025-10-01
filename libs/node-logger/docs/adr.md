# ADR1: Padronização de Log com Decorator `@Log`

**Status:** Aprovada
**Data:** 2025-08-19
**Autores:** Mateus Macedo Dos Anjos
**Relacionado:** FC2: Decorador `@Log` para Instrumentação Estruturada em TypeScript
**Escopo:** Serviços Node.js/TypeScript (NestJS — Express e Fastify — e libs internas)

## 1. Contexto

Os serviços registravam logs de forma heterogênea (formatos, campos e níveis distintos), sem `correlationId` consistente e com risco de vazamento de dados sensíveis. Isso dificultava depuração, observabilidade e correlação entre componentes.

## 2. Decisão

Adotar, como padrão de engenharia, o seguinte:

1. **Decorator de método `@Log`** para instrumentar chamadas sync/async com:

    - `scope` (classe/método), `outcome` (success/error),

    - inclusão opcional de `args` e `result`,

    - **amostragem** (`sampleRate`) e integração por **sink**.

2. **Sink Padrão: Pino** (JSON estruturado), com **child logger** por `correlationId`.

3. **CorrelationId por requisição** via **AsyncLocalStorage** (ALS), usando o header `x-correlation-id` (aceita valor recebido ou gera um UUID) — middleware (Express) e plugin (Fastify/Nest).

4. **Redação de dados sensíveis** por padrão com `keepLengths=false` (ocultando o comprimento das strings redatadas) e chaves/padrões comuns (password/token/authorization, CPF/CNPJ, e-mail, tokens hex e demais customizadas).

5. **Defaults operacionais** do decorator:

    - `level: 'info'`

    - `includeArgs: true`

    - `includeResult: false`

    - `sampleRate: 1`

    - `redact: defaultRedact`

    - `sink: pinoSink`

    - `getCorrelationId: getCid (ALS)`

## 3. Consequências

**Positivas**

- Padrão único para logs estruturados.

- Correlação ponta-a-ponta com `cid`.

- Redução de retrabalho em troubleshooting.

**Negativas / Custos**

- Pequeno overhead por chamada (wrap + possível serialização).

- Necessidade de disciplina para **não** logar `result` desnecessário.

- Configuração de ALS e header nas bordas do sistema.

## 4. Justificativa

- **Consistência** de logs e facilidade de correlação por requisição.

- **Baixo atrito** de adoção (1 linha por método) e compatível com sync/async.

- **Segurança**: redatores padrão reduzem risco de PII/segredos em logs.

- **Observabilidade**: estrutura uniforme viabiliza dashboards (latência, taxa de erro, hot spots).

## 5. Opções Alternativas

- **Somente interceptors HTTP (Nest)**: cobre entrada/saída web, mas não chamadas internas/libraries.

- **AOP/Proxies dinâmicos**: maior complexidade e custo cognitivo.

- **Novos Decorators (TC39/TS 5+)**: ainda não adotados no stack; exigiriam mudanças de sintaxe e tooling.

## 6. Detalhes de Implementação (resumo)

- `tsconfig`: `experimentalDecorators: true`, `emitDecoratorMetadata: true`.

- `@Log(opts)`: envolve `descriptor.value`, trata `Promise`, aplica `sampleRate`, redige `args/result` e envia ao `sink`.

- **Redator**: `createRedactor({ keepLengths: false, keys, patterns })` + `composeRedactors` para extensões por domínio.

- **Pino**: `createPinoSink({ logger })` mapeia nível, cria child `{ cid }` quando presente.

- **ALS**: middleware (Express) / plugin (Fastify) que lê ou gera `x-correlation-id` e executa `reqStore.run({ cid })`.

## 7. Segurança e Privacidade

- **Default seguro**: redatores ativos e preservação de tamanho das strings mascaradas.

- **Política**: evitar `includeResult` quando houver chance de PII/segredos; usar redatores específicos por domínio quando necessário.

- **Auditoria**: adicionar verificação de redatores no checklist de PR.

## 8. Testes e Critérios de Aceite

- **Unitários**:

  - Redator mascara chaves/padrões (CPF/CNPJ, e-mail, tokens).

  - `sampleRate` respeitado (0, 0.5, 1).

  - sync/async → `outcome` correto.

- **E2E**:

  - Nest+Express e Nest+Fastify propagam `x-correlation-id` até o `@Log`.

  - `includeArgs/includeResult` obedecidos e redatados.

- **Aceite**: serviços piloto exibem logs Pino com `scope`, `cid`, `outcome` e latências coerentes.

## 9. Plano de Adoção

1. **Piloto** em um serviço crítico (2–3 métodos de alto tráfego).

2. Publicar guia rápido e snippets de exemplo; ativar `pino-pretty` em dev.

3. Expandir aos poucos; remover logs ad-hoc redundantes.

4. Painéis: p95/p99 por método, taxa de erro.

## 10. Plano de Reversão

- Feature flag `LOG_DECORATOR=off` (decorator no-op).

- Remoção do middleware/plugin de `cid` não impacta execução funcional (apenas observabilidade).

- Retorno a logs ad-hoc onde necessário.

## 11. Impacto Operacional

- **Desempenho**: impacto mínimo; use `sampleRate < 1` em hot paths se preciso.

- **Infra**: nenhum requisito extra além do pipeline de logs existente.

- **DevEx**: aumenta previsibilidade e reduz tempo de diagnóstico.

## 12. Itens de Acompanhamento (Follow-ups)

- Integrar `traceId/spanId` do APM ao `LogEntry`.

- Truncar campos grandes no sink (ex.: strings > 8 KB).

- Guideline por domínio com chaves/padrões de redatores adicionais.

## 13. Checklist de Conformidade (por PR)

- Decorator `@Log` aplicado aos métodos alvo.

- `sink` configurado para Pino; `cid` presente.

- `includeResult` usado apenas quando necessário.

- Redatores adicionais para campos do domínio quando aplicável.

- Testes (unit/E2E) cobrindo o fluxo com `cid`.
