# Guia de Desenvolvimento

> **📖 [README.md](./README.md)** - Visão geral e comandos essenciais do workspace.

Guia detalhado para desenvolvimento diário no workspace Nx. Todos os comandos devem ser executados através do **Nx** para aproveitar cache, orquestração de dependências e eficiência do monorepo.

## 📦 Projetos do Workspace

- **@boyscout/biome** (`libs/biome`) - Configuração Biome para linting/formatação
- **@boyscout/node-logger** (`libs/node-logger`) - Biblioteca de logging estruturado
- **@boyscout/tsconfig** (`libs/tsconfig`) - Configurações TypeScript padronizadas
- **nestjs-api** (`apps/nestjs-api`) - API NestJS (aplicação de exemplo)

## 🚀 Comandos por Categoria

### Build

```bash
# Build de projeto específico
npx nx build @boyscout/node-logger
npx nx build nestjs-api

# Build de todos os projetos
npx nx run-many -t build

# Build apenas projetos afetados (otimizado)
npx nx affected -t build
```

### Testes

```bash
# Testes unitários
npx nx test @boyscout/node-logger
npx nx test @boyscout/node-logger --coverage
npx nx test nestjs-api

# Testes E2E (apenas aplicações)
npx nx e2e nestjs-api
npx nx e2e:ui nestjs-api              # Interface gráfica
npx nx e2e nestjs-api -- --headed     # Com navegador visível
npx nx e2e nestjs-api -- --debug      # Modo debug

# Todos os testes
npx nx run-many -t test

# Testes afetados (otimizado)
npx nx affected -t test
```

### Desenvolvimento

```bash
# Servidor de desenvolvimento
npx nx serve nestjs-api
npx nx serve nestjs-api --configuration=development

# Watch automático de dependências
npx nx watch-deps nestjs-api

# Testes em modo watch
npx nx test @boyscout/node-logger --watch
```

### Qualidade de Código

```bash
# Linting
npx nx lint @boyscout/biome
npx nx lint @boyscout/node-logger
npx nx lint nestjs-api

# Type-checking
npx nx typecheck @boyscout/node-logger
npx nx typecheck nestjs-api

# Todos os projetos
npx nx run-many -t lint
npx nx run-many -t typecheck
```

## 🎯 Workflows de Desenvolvimento

### Desenvolvimento Diário

```bash
# 1. Iniciar servidor em background
npx nx serve nestjs-api &

# 2. Executar testes em watch mode (em outro terminal)
npx nx test @boyscout/node-logger --watch

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
npx nx graph --focus=@boyscout/node-logger

# Grafo de projetos afetados
npx nx affected:graph
```

### Informações do Projeto

```bash
# Ver targets disponíveis
npx nx show project @boyscout/node-logger
npx nx show project nestjs-api

# Ver configuração completa
npx nx show project @boyscout/node-logger --json
```

### Cache e Performance

```bash
# Limpar cache do Nx
npx nx reset

# Ver estatísticas de cache
npx nx daemon --stop && npx nx daemon
```

## 📊 Relatórios e Análise

### Cobertura de Testes

```bash
# Gerar relatório de cobertura
npx nx test @boyscout/node-logger --coverage

# Relatórios ficam em:
# - coverage/libs/node-logger/
# - coverage/apps/nestjs-api/
```

### Testes E2E

```bash
# Relatórios ficam em:
# - apps/nestjs-api/playwright-report/

# Visualizar último relatório
pnpx playwright show-report apps/nestjs-api/playwright-report
```

## 🛠️ Manutenção do Workspace

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

### Comandos Afetados (Otimização)

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
npx nx test @boyscout/node-logger

# Segunda execução: ~50ms (do cache)
npx nx test @boyscout/node-logger
```

### Execução Paralela

```bash
# Executar múltiplos targets em paralelo
npx nx run-many -t build test lint --parallel=3

# Nx orquestra dependências automaticamente
npx nx run-many -t build  # @boyscout/node-logger → nestjs-api (ordem correta)
```

## 📝 Comandos por Contexto

### Feature Development

```bash
# Watch mode para desenvolvimento
npx nx test @boyscout/node-logger --watch
npx nx serve nestjs-api

# Executar afetados ao criar PR
npx nx affected -t test lint typecheck e2e
```

### Bug Fix

```bash
# Testar projeto específico
npx nx test @boyscout/node-logger --coverage

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

- **[README.md](./README.md)** - Visão geral e comandos essenciais
- **[RELEASE.md](./RELEASE.md)** - Referência rápida para release
- [Documentação do Nx](https://nx.dev)
- [Comandos do Nx](https://nx.dev/nx-api/nx/documents/run)
- [Affected Commands](https://nx.dev/concepts/affected)
