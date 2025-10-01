# 🚀 Guia de Release e Publicação

Este documento explica como usar o sistema de release automatizado do Boyscout.

## 📋 Pré-requisitos

1. **Login no NPM**: Execute `npm login` antes de fazer releases
2. **Git limpo**: Certifique-se de que não há mudanças não commitadas
3. **Branch correta**: Idealmente execute releases na branch `main` ou `master`

## 🛠️ Scripts Disponíveis

### 1. Release Completo (Recomendado)
```bash
pnpm run release:full
# ou
./scripts/release.sh
```

**O que faz:**
- ✅ Executa todos os testes
- ✅ Executa linting
- ✅ Faz build de todos os projetos
- ✅ Executa dry-run do release
- ✅ Solicita confirmação do usuário
- ✅ Executa versioning e publicação
- ✅ Faz push das tags para o Git

### 2. Apenas Versioning
```bash
pnpm run release:version
# ou
./scripts/release-version-only.sh
```

**O que faz:**
- ✅ Atualiza versões nos package.json
- ✅ Atualiza dependências entre projetos
- ✅ Faz commit das mudanças
- ❌ **NÃO** publica no NPM

### 3. Apenas Publicação
```bash
pnpm run release:publish
# ou
./scripts/release-publish-only.sh
```

**O que faz:**
- ✅ Publica pacotes no NPM
- ❌ **NÃO** faz versioning (assume que já foi feito)

## 🔧 Comandos Nx Diretos

### Dry Run (Sempre recomendado primeiro)
```bash
pnpm run release:dry-run
```

### Versioning Manual
```bash
# Todos os projetos
pnpm run version

# Projeto específico
nx release version --projects=@boyscout/node-logger
```

### Publicação Manual
```bash
# Todos os projetos
pnpm run publish

# Projeto específico
nx release publish --projects=@boyscout/node-logger
```

## 📦 Projetos Publicáveis

Os seguintes projetos são configurados para publicação:

- **@boyscout/node-logger**: Logger para Node.js com suporte a NestJS
- **@boyscout/biome**: Configuração do Biome para linting e formatação
- **@boyscout/tsconfig**: Configurações TypeScript para projetos Node.js

## 🔄 Fluxo de Release Recomendado

### 1. Desenvolvimento
```bash
# Fazer mudanças no código
git add .
git commit -m "feat: nova funcionalidade"
```

### 2. Teste Local
```bash
# Executar dry-run para verificar
pnpm run release:dry-run
```

### 3. Release
```bash
# Executar release completo
pnpm run release:full
```

## 🏷️ Versionamento

O sistema usa **Conventional Commits** para determinar o tipo de versionamento:

- `feat:` → **minor** (1.0.0 → 1.1.0)
- `fix:` → **patch** (1.0.0 → 1.0.1)
- `BREAKING CHANGE:` → **major** (1.0.0 → 2.0.0)

### Exemplos de Commits

```bash
# Minor version
git commit -m "feat: adicionar novo método de logging"

# Patch version
git commit -m "fix: corrigir bug no decorator"

# Major version
git commit -m "feat: reestruturar API

BREAKING CHANGE: API completamente reestruturada"
```

## 🚨 Troubleshooting

### Erro: "You cannot publish over the previously published versions"
- **Causa**: Tentativa de publicar uma versão que já existe no NPM
- **Solução**: Execute `pnpm run release:version` primeiro para atualizar as versões

### Erro: "Há mudanças não commitadas"
- **Causa**: Arquivos modificados não commitados
- **Solução**: 
  ```bash
  git add .
  git commit -m "chore: preparar release"
  ```

### Erro: "Você não está logado no NPM"
- **Causa**: Não está autenticado no NPM
- **Solução**: 
  ```bash
  npm login
  ```

### Erro: "Dry-run do release falhou"
- **Causa**: Problemas na configuração ou dependências
- **Solução**: 
  1. Execute `nx run-many -t build` para verificar builds
  2. Execute `nx run-many -t test` para verificar testes
  3. Verifique a configuração no `nx.json`

## 📊 Monitoramento

Após a publicação, você pode verificar os pacotes em:

- [@boyscout/node-logger](https://www.npmjs.com/package/@boyscout/node-logger)
- [@boyscout/biome](https://www.npmjs.com/package/@boyscout/biome)
- [@boyscout/tsconfig](https://www.npmjs.com/package/@boyscout/tsconfig)

## 🔧 Configuração Avançada

A configuração do release está no `nx.json`:

```json
{
  "release": {
    "projects": ["*"],
    "projectsRelationship": "independent",
    "version": {
      "preVersionCommand": "pnpm dlx nx run-many -t build",
      "generator": "@nx/js:release-version",
      "generatorOptions": {
        "packageRoot": "{projectRoot}",
        "currentVersionResolver": "git-tag",
        "fallbackCurrentVersionResolver": "disk",
        "specifierSource": "conventional-commits"
      }
    },
    "releaseTagPattern": "{projectName}@{version}"
  }
}
```

## 📝 Notas Importantes

1. **Sempre execute dry-run primeiro** para verificar o que será feito
2. **Mantenha o workspace limpo** antes de fazer releases
3. **Use conventional commits** para versionamento automático correto
4. **Teste localmente** antes de publicar
5. **Monitore as publicações** no NPM após o release
