# Nx Release - Versionamento e Changelog

> **📖 [Consulte o README.md principal](./README.md#release-e-versionamento)** para a documentação completa de release e versionamento.

Este arquivo serve como referência rápida para comandos de release. Para documentação completa, exemplos detalhados e configurações, consulte a seção **Release e Versionamento** do [README.md](./README.md).

## 🚀 Comandos Rápidos

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

## 📋 Fluxo Básico

1. Fazer commits com conventional commits
2. Verificar com `pnpm run release:dry-run`
3. Executar `pnpm run release`

## 🎯 Comandos por Projeto

```bash
# Projeto específico
nx release version --projects=@boyscout/biome --dry-run
nx release version --projects=@boyscout/biome

# Múltiplos projetos
nx release version --projects=@boyscout/biome,@boyscout/utils --dry-run
nx release version --projects=@boyscout/biome,@boyscout/utils

# Versionamento específico
nx release version --projects=@boyscout/biome --specifier=patch
nx release version --projects=@boyscout/biome --specifier=minor
nx release version --projects=@boyscout/biome --specifier=major
```

## 📚 Documentação Completa

- **[README.md - Release e Versionamento](./README.md#release-e-versionamento)** - Documentação completa
- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Guia completo de desenvolvimento
- [Documentação oficial do Nx Release](https://20.nx.dev/features/manage-releases)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
