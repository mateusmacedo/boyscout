# Release e Versionamento - Referência Rápida

> **📖 [README.md](./README.md)** - Visão geral e comandos essenciais do workspace.

Referência rápida para comandos de release e versionamento usando **Nx Release** com **Conventional Commits**.

## 🚀 Comandos Essenciais

```bash
# Release completo (recomendado)
pnpm run release

# Verificar o que será feito (sempre execute primeiro)
pnpm run release:dry-run

# Comandos independentes
pnpm run version    # Apenas versionamento
pnpm run changelog  # Apenas changelog
pnpm run publish    # Apenas publicação
```

## 📋 Fluxo Básico

1. **Fazer commits** com conventional commits
2. **Verificar** com `pnpm run release:dry-run`
3. **Executar** `pnpm run release`

## 🎯 Release por Projeto

### Projeto Específico

```bash
# Verificar versionamento
nx release version --projects=@boyscout/biome --dry-run

# Executar versionamento
nx release version --projects=@boyscout/biome

# Gerar changelog
nx release changelog 1.1.0 --projects=@boyscout/biome
```

### Múltiplos Projetos

```bash
# Verificar múltiplos projetos
nx release version --projects=@boyscout/biome,@boyscout/node-logger --dry-run

# Executar versionamento
nx release version --projects=@boyscout/biome,@boyscout/node-logger
```

### Versionamento Específico

```bash
# Bump específico
nx release version --projects=@boyscout/biome --specifier=patch
nx release version --projects=@boyscout/biome --specifier=minor
nx release version --projects=@boyscout/biome --specifier=major
```

## 📝 Conventional Commits

### Tipos de Commit

- `feat:` - Nova funcionalidade (minor)
- `fix:` - Correção de bug (patch)
- `feat!:` - Breaking change (major)
- `docs:` - Documentação (não afeta versão)
- `style:` - Formatação (não afeta versão)
- `refactor:` - Refatoração (não afeta versão)
- `test:` - Testes (não afeta versão)
- `chore:` - Manutenção (não afeta versão)

### Exemplos

```bash
# Nova funcionalidade
git commit -m "feat: adicionar validação de email"

# Correção de bug
git commit -m "fix: corrigir erro de parsing JSON"

# Breaking change
git commit -m "feat!: remover API deprecated"

# Com escopo
git commit -m "feat(biome): adicionar regra de linting"
git commit -m "fix(node-logger): corrigir decorator de logging"
```

## ⚙️ Configuração

A configuração está no `nx.json`:

```json
{
  "release": {
    "projects": ["*"],
    "projectsRelationship": "independent",
    "version": {
      "conventionalCommits": true
    }
  }
}
```

## 🔗 Recursos

- **[README.md](./README.md)** - Visão geral e comandos essenciais
- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Guia completo de desenvolvimento
- [Documentação oficial do Nx Release](https://20.nx.dev/features/manage-releases)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
