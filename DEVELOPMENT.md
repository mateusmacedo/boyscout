# Guia de Desenvolvimento

Todos os comandos devem ser executados através do **Nx** para aproveitar cache, orquestração de dependências e eficiência do monorepo.

## 📦 Projetos

- **nestjs-api** (`apps/nestjs-api`) - API NestJS
- **node-logger** (`libs/node-logger`) - Biblioteca de logging

## 🚀 Comandos Essenciais

### Build

```bash
# Build de um projeto específico
npx nx build nestjs-api
npx nx build node-logger

# Build de todos os projetos
npx nx run-many -t build

# Build apenas projetos afetados (otimizado)
npx nx affected -t build
```

### Testes Unitários

```bash
# Testes de um projeto
npx nx test nestjs-api
npx nx test node-logger

# Testes com cobertura
npx nx test nestjs-api --coverage
npx nx test node-logger --coverage

# Todos os testes
npx nx run-many -t test

# Testes afetados (otimizado)
npx nx affected -t test
```

### Testes E2E

```bash
# Executar testes E2E
npx nx e2e nestjs-api

# Interface gráfica (desenvolvimento)
npx nx e2e:ui nestjs-api

# Com navegador visível
npx nx e2e nestjs-api -- --headed

# Modo debug
npx nx e2e nestjs-api -- --debug
```

### Servidor de Desenvolvimento

```bash
# Iniciar servidor
npx nx serve nestjs-api

# Com modo de desenvolvimento
npx nx serve nestjs-api --configuration=development

# Com watch automático de dependências
npx nx watch-deps nestjs-api
```

### Linting e Type-checking

```bash
# Lint de um projeto
npx nx lint nestjs-api
npx nx lint node-logger

# Type-checking
npx nx typecheck nestjs-api
npx nx typecheck node-logger

# Todos os projetos
npx nx run-many -t lint
npx nx run-many -t typecheck
```

## 🎯 Workflows Comuns

### Desenvolvimento Diário

```bash
# 1. Iniciar servidor em background
npx nx serve nestjs-api &

# 2. Executar testes em watch mode (em outro terminal)
npx nx test nestjs-api --watch

# 3. Fazer alterações...

# 4. Testar apenas o que foi afetado
npx nx affected -t test lint
```

### Antes de Commit

```bash
# Executar todos os checks nos arquivos afetados
npx nx affected -t lint test typecheck

# Ou executar tudo
npx nx run-many -t lint test typecheck
```

### CI/CD Pipeline

```bash
# Build de produção
npx nx affected -t build --configuration=production

# Testes completos
npx nx affected -t test e2e --parallel=3

# Verificações
npx nx affected -t lint typecheck
```

## 🔍 Exploração e Debugging

### Visualizar Grafo de Dependências

```bash
# Grafo completo do workspace
npx nx graph

# Grafo de um projeto específico
npx nx graph --focus=nestjs-api

# Grafo de projetos afetados
npx nx affected:graph
```

### Informações do Projeto

```bash
# Ver targets disponíveis
npx nx show project nestjs-api
npx nx show project node-logger

# Ver configuração
npx nx show project nestjs-api --json
```

### Cache e Performance

```bash
# Limpar cache do Nx
npx nx reset

# Ver estatísticas de cache
npx nx daemon --stop && npx nx daemon
```

## 📊 Relatórios

### Cobertura de Testes

```bash
# Gerar relatório de cobertura
npx nx test nestjs-api --coverage

# Relatórios ficam em:
# - coverage/apps/nestjs-api/
# - coverage/libs/node-logger/
```

### Testes E2E

```bash
# Relatórios ficam em:
# - apps/nestjs-api/playwright-report/

# Visualizar último relatório
npx playwright show-report apps/nestjs-api/playwright-report
```

## 🛠️ Manutenção

### Atualizar Dependências

```bash
# Atualizar dependências do Nx
npx nx migrate latest

# Aplicar migrações
npx nx migrate --run-migrations

# Atualizar package.json
pnpm update
```

### Limpar Artefatos

```bash
# Limpar cache do Nx
npx nx reset

# Limpar builds
rm -rf dist/

# Limpar cobertura
rm -rf coverage/

# Limpar node_modules
rm -rf node_modules/ && pnpm install
```

## 🎓 Dicas de Produtividade

### Usar Affected para Otimização

O Nx sabe quais projetos foram alterados via Git:

```bash
# Executar apenas nos projetos afetados
npx nx affected -t build test lint

# Ver o que será executado
npx nx affected:graph
```

### Cache Distribuído

O Nx cacheia resultados automaticamente. Comandos idênticos retornam instantaneamente:

```bash
# Primeira execução: ~5s
npx nx test node-logger

# Segunda execução: ~50ms (do cache)
npx nx test node-logger
```

### Execução Paralela

```bash
# Executar múltiplos targets em paralelo
npx nx run-many -t build test lint --parallel=3

# Nx orquestra dependências automaticamente
npx nx run-many -t build  # node-logger → nestjs-api (ordem correta)
```

## 📝 Comandos por Contexto

### Feature Development

```bash
# Watch mode para desenvolvimento
npx nx test nestjs-api --watch
npx nx serve nestjs-api

# Executar afetados ao criar PR
npx nx affected -t test lint typecheck e2e
```

### Bug Fix

```bash
# Testar projeto específico
npx nx test nestjs-api --coverage

# Debug E2E
npx nx e2e:ui nestjs-api
```

### Release

```bash
# Build de produção
npx nx run-many -t build --configuration=production

# Testes completos
npx nx run-many -t test e2e

# Type-checking
npx nx run-many -t typecheck
```

## 🔗 Recursos

- [Documentação do Nx](https://nx.dev)
- [Comandos do Nx](https://nx.dev/nx-api/nx/documents/run)
- [Affected Commands](https://nx.dev/concepts/affected)
