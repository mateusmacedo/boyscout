# Nx Release - Versionamento e Changelog

Configuração simplificada para versionamento e changelog usando Nx Release.

## 🚀 Comandos Básicos

### Release Completo
```bash
# Release completo (versionamento + changelog + publicação)
pnpm run release

# Verificar o que será feito (recomendado primeiro)
pnpm run release:dry-run
```

### Comandos Independentes
```bash
# Apenas versionamento
pnpm run version

# Apenas changelog
pnpm run changelog

# Apenas publicação
pnpm run publish
```

## 📋 Como Funciona

1. **Conventional Commits**: O versionamento é baseado nos commits seguindo o padrão conventional commits
2. **Versionamento Automático**: Detecta automaticamente se é major, minor ou patch
3. **Changelog Automático**: Gera changelog baseado nos commits
4. **Independente**: Cada projeto é versionado independentemente

## 🎯 Exemplos de Uso

### Fluxo Básico - Todos os Projetos
```bash
# 1. Fazer commits com conventional commits
git commit -m "feat: adicionar nova funcionalidade"

# 2. Verificar o que será versionado
pnpm run release:dry-run

# 3. Executar o release
pnpm run release
```

### Fluxo Independente - Projeto Específico
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

### Fluxo Independente - Múltiplos Projetos
```bash
# 1. Fazer commits que afetam múltiplos projetos
git commit -m "feat(biome): adicionar funcionalidade A"
git commit -m "fix(utils): corrigir bug B"

# 2. Versionar apenas os projetos afetados
nx release version --projects=@boyscout/biome,@boyscout/utils --dry-run

# 3. Executar versionamento
nx release version --projects=@boyscout/biome,@boyscout/utils
```

### Versionamento com Versão Específica
```bash
# Versionar com bump específico
nx release version --projects=@boyscout/biome --specifier=patch
nx release version --projects=@boyscout/biome --specifier=minor
nx release version --projects=@boyscout/biome --specifier=major
```

## ⚙️ Configuração

A configuração mínima está no `nx.json`:

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

## 💡 Dicas

- **Sempre use `--dry-run` primeiro** para verificar as mudanças
- **Use conventional commits** para versionamento automático
- **Cada projeto é versionado independentemente** baseado em suas mudanças
- **O changelog é gerado automaticamente** baseado nos commits

## 🔧 Comandos Avançados

```bash
# Versionamento com opções específicas
nx release version --projects=lib1 --specifier=minor --dry-run

# Changelog com range específico
nx release changelog --from=v1.0.0 --to=HEAD

# Publicação com configurações específicas
nx release publish
```

## 📚 Recursos

- [Documentação oficial do Nx Release](https://20.nx.dev/features/manage-releases)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
