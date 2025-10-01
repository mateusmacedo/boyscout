# @boyscout/source

[![Nx logo](https://raw.githubusercontent.com/nrwl/nx/master/images/nx-logo.png)](https://nx.dev)

✨ **Boyscout Workspace** - Monorepo com packages reutilizáveis para projetos modernos ✨.

Workspace Nx com bibliotecas padronizadas para desenvolvimento JavaScript/TypeScript, incluindo configurações de linting, formatação, logging e TypeScript.

> **📖 [Guia Completo de Desenvolvimento](./DEVELOPMENT.md)** - Todos os comandos Nx para desenvolvimento, build, testes e CI/CD.

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

## 🚀 Desenvolvimento

### Comandos Principais

```bash
# Instalar dependências
pnpm install

# Executar linting e formatação
pnpm run check:fix

# Executar testes
pnpm run test

# Build de todos os packages
pnpm run build

# Visualizar grafo de dependências
pnpm run graph
```

### Release e Versionamento

O workspace utiliza **Nx Release** com versionamento independente baseado em **Conventional Commits**.

#### Comandos Básicos

```bash
# Release completo (versionamento + changelog + publicação)
pnpm run release

# Verificar o que será feito (recomendado primeiro)
pnpm run release:dry-run

# Apenas versionamento
pnpm run version

# Apenas changelog
pnpm run changelog

# Apenas publicação
pnpm run publish
```

#### Como Funciona

1. **Conventional Commits**: O versionamento é baseado nos commits seguindo o padrão conventional commits
2. **Versionamento Automático**: Detecta automaticamente se é major, minor ou patch
3. **Changelog Automático**: Gera changelog baseado nos commits
4. **Independente**: Cada projeto é versionado independentemente

#### Fluxo Básico - Todos os Projetos

```bash
# 1. Fazer commits com conventional commits
git commit -m "feat: adicionar nova funcionalidade"

# 2. Verificar o que será versionado
pnpm run release:dry-run

# 3. Executar o release
pnpm run release
```

#### Fluxo Independente - Projeto Específico

```bash
# 1. Fazer commit que afeta apenas um projeto
git commit -m "feat(biome): adicionar nova funcionalidade"

# 2. Verificar versionamento apenas desse projeto
nx release version --projects=@boyscout/biome --dry-run

# 3. Versionar apenas esse projeto
nx release version --projects=@boyscout/biome

# 4. Gerar changelog apenas para esse projeto
nx release changelog 1.1.0 --projects=@boyscout/biome
```

#### Fluxo Independente - Múltiplos Projetos

```bash
# 1. Fazer commits que afetam múltiplos projetos
git commit -m "feat(biome): adicionar funcionalidade A"
git commit -m "fix(utils): corrigir bug B"

# 2. Versionar apenas os projetos afetados
nx release version --projects=@boyscout/biome,@boyscout/utils --dry-run

# 3. Executar versionamento
nx release version --projects=@boyscout/biome,@boyscout/utils
```

#### Versionamento com Versão Específica

```bash
# Versionar com bump específico
nx release version --projects=@boyscout/biome --specifier=patch
nx release version --projects=@boyscout/biome --specifier=minor
nx release version --projects=@boyscout/biome --specifier=major
```

#### Comandos Avançados

```bash
# Versionamento com opções específicas
nx release version --projects=lib1 --specifier=minor --dry-run

# Changelog com range específico
nx release changelog --from=v1.0.0 --to=HEAD

# Publicação com configurações específicas
nx release publish
```

#### Configuração

A configuração está no `nx.json`:

```json
{
  "release": {
    "projects": ["*"],
    "version": {
      "conventionalCommits": true
    }
  }
}
```

#### Dicas

- **Sempre use `--dry-run` primeiro** para verificar as mudanças
- **Use conventional commits** para versionamento automático
- **Cada projeto é versionado independentemente** baseado em suas mudanças
- **O changelog é gerado automaticamente** baseado nos commits

## 🛠️ Comandos Nx

### Gerar Nova Biblioteca

```bash
npx nx g @nx/js:lib libs/nova-lib --publishable --importPath=@boyscout/nova-lib
```

### Executar Tarefas

```bash
# Build de projeto específico
npx nx build @boyscout/biome

# Testes de projeto específico
npx nx test @boyscout/node-logger

# Lint de projeto específico
npx nx lint @boyscout/tsconfig

# Todas as tarefas de um projeto
npx nx <target> <project-name>
```

### Sincronização TypeScript

```bash
# Sincronizar referências de projeto
npx nx sync

# Verificar sincronização (para CI)
npx nx sync:check
```

## 📚 Recursos

- [Documentação oficial do Nx Release](https://20.nx.dev/features/manage-releases)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [Guia Completo de Desenvolvimento](./DEVELOPMENT.md)
