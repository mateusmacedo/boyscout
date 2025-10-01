# @boyscout/source

[![Nx logo](https://raw.githubusercontent.com/nrwl/nx/master/images/nx-logo.png)](https://nx.dev)

✨ **Boyscout Workspace** - Monorepo com packages reutilizáveis para projetos modernos ✨

Workspace Nx com bibliotecas padronizadas para desenvolvimento JavaScript/TypeScript, incluindo configurações de linting, formatação, logging e TypeScript.

## 📦 Packages Disponíveis

### @boyscout/biome

Configuração padronizada do Biome para linting e formatação de projetos JavaScript/TypeScript.

```bash
pnpm add -D @boyscout/biome
```

### @boyscout/node-logger

Biblioteca de logging estruturado com decorators automáticos, correlação de requisições e redação de dados sensíveis.

```bash
pnpm add @boyscout/node-logger
```

### @boyscout/tsconfig

Configurações TypeScript padronizadas para projetos Node.js modernos.

```bash
pnpm add -D @boyscout/tsconfig
```

## 🚀 Início Rápido

### Instalação e Setup

```bash
# Instalar dependências
pnpm install

# Verificar workspace
npx nx graph
```

### Comandos Essenciais

```bash
# Desenvolvimento
pnpm run test             # Executar testes
pnpm run test:watch       # Testes em modo watch
pnpm run check:fix        # Linting e formatação

# Build e Release
pnpm run build            # Build de todos os packages
pnpm run release          # Release completo
pnpm run release:dry-run  # Verificar release (recomendado)

# Utilitários
pnpm run graph            # Visualizar grafo de dependências
pnpm run typecheck        # Type-checking
```

## 🛠️ Desenvolvimento

### Comandos por Projeto

```bash
# Build
npx nx build @boyscout/biome
npx nx build @boyscout/node-logger
npx nx build @boyscout/tsconfig

# Testes
npx nx test @boyscout/node-logger
npx nx test @boyscout/node-logger --coverage

# Lint
npx nx lint @boyscout/biome
npx nx lint @boyscout/node-logger

# Type-checking
npx nx typecheck @boyscout/node-logger
```

### Comandos Afetados (Otimizado)

```bash
# Executar apenas em projetos alterados
npx nx affected -t build test lint
npx nx affected:graph     # Ver grafo de afetados
```

### Gerar Nova Biblioteca

```bash
npx nx g @nx/js:lib libs/nova-lib --publishable --importPath=@boyscout/nova-lib
```

## 📋 Release e Versionamento

O workspace utiliza **Nx Release** com versionamento independente baseado em **Conventional Commits**.

### Comandos Básicos

```bash
# Release completo
pnpm run release

# Verificar o que será feito (recomendado primeiro)
pnpm run release:dry-run

# Comandos independentes
pnpm run version    # Apenas versionamento
pnpm run changelog  # Apenas changelog
pnpm run publish    # Apenas publicação
```

### Fluxo Básico

1. **Fazer commits** com conventional commits
2. **Verificar** com `pnpm run release:dry-run`
3. **Executar** `pnpm run release`

### Release por Projeto

```bash
# Projeto específico
nx release version --projects=@boyscout/biome --dry-run
nx release version --projects=@boyscout/biome

# Múltiplos projetos
nx release version --projects=@boyscout/biome,@boyscout/utils

# Versionamento específico
nx release version --projects=@boyscout/biome --specifier=patch
nx release version --projects=@boyscout/biome --specifier=minor
nx release version --projects=@boyscout/biome --specifier=major
```

## 📚 Documentação Detalhada

- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Guia completo de desenvolvimento
- **[RELEASE.md](./RELEASE.md)** - Referência rápida para release
- [Documentação oficial do Nx](https://nx.dev)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
