# GitHub Packages - Configuração e Uso

Este documento explica como configurar e usar o GitHub Packages como registro npm para os packages do workspace @boyscout.

## 📋 Pré-requisitos

1. **Conta GitHub** com acesso ao repositório `mmanjos/boyscout`
2. **Personal Access Token** com escopos:
   - `write:packages` - para publicar packages
   - `read:packages` - para instalar packages
   - `repo` - para acessar repositórios privados (se necessário)

## 🔧 Configuração Inicial

### 1. Criar Personal Access Token

1. Acesse: https://github.com/settings/tokens
2. Clique em "Generate new token (classic)"
3. Selecione os escopos necessários
4. Copie o token gerado

### 2. Configurar Autenticação

#### Opção A: Script Automático (Recomendado)
```bash
# Execute o script com seu token
./scripts/setup-github-packages.sh SEU_TOKEN_AQUI
```

#### Opção B: Configuração Manual
```bash
# Configurar autenticação no npm
npm login --scope=@boyscout --auth-type=legacy --registry=https://npm.pkg.github.com

# Ou adicionar manualmente ao ~/.npmrc
echo "//npm.pkg.github.com/:_authToken=SEU_TOKEN" >> ~/.npmrc
echo "@boyscout:registry=https://npm.pkg.github.com" >> ~/.npmrc
```

### 3. Verificar Configuração

```bash
# Verificar autenticação
npm whoami --registry=https://npm.pkg.github.com

# Deve retornar seu username do GitHub
```

## 📦 Packages Disponíveis

O workspace contém os seguintes packages com escopo `@boyscout`:

- **@boyscout/biome** - Configuração do Biome para linting e formatação
- **@boyscout/node-logger** - Biblioteca de logging com Pino
- **@boyscout/tsconfig** - Configurações TypeScript para Node.js

## 🚀 Publicando Packages

### Publicar um Package Específico

```bash
# Navegar para o diretório do package
cd libs/biome

# Publicar
npm publish
```

### Publicar Todos os Packages

```bash
# Usar o comando do workspace
pnpm run publish
```

### Publicar com Nx Release

```bash
# Versão e changelog automático
pnpm run release

# Apenas publicar (sem versionar)
pnpm run publish
```

## 📥 Instalando Packages

### Instalar um Package

```bash
# Instalar package específico
npm install @boyscout/biome --registry=https://npm.pkg.github.com

# Ou configurar .npmrc no projeto que vai usar
echo "@boyscout:registry=https://npm.pkg.github.com" >> .npmrc
npm install @boyscout/biome
```

### Usar em Projetos

```json
{
  "dependencies": {
    "@boyscout/biome": "^0.1.0",
    "@boyscout/node-logger": "^1.0.0",
    "@boyscout/tsconfig": "^0.1.0"
  }
}
```

## 🔍 Comandos Úteis

### Verificar Packages Publicados
```bash
# Listar packages do usuário
npm view @boyscout/biome --registry=https://npm.pkg.github.com

# Ver informações de um package
npm info @boyscout/biome --registry=https://npm.pkg.github.com
```

### Gerenciar Versões
```bash
# Ver versões disponíveis
npm view @boyscout/biome versions --registry=https://npm.pkg.github.com

# Instalar versão específica
npm install @boyscout/biome@0.1.0 --registry=https://npm.pkg.github.com
```

## 🐛 Troubleshooting

### Erro de Autenticação
```bash
# Verificar token
npm whoami --registry=https://npm.pkg.github.com

# Se falhar, reconfigurar
./scripts/setup-github-packages.sh NOVO_TOKEN
```

### Erro de Permissão
- Verificar se o token tem escopo `write:packages`
- Verificar se o package tem escopo correto (`@boyscout/package-name`)
- Verificar se o `publishConfig` está configurado

### Erro de Registry
```bash
# Verificar configuração do .npmrc
cat .npmrc

# Deve conter:
# @boyscout:registry=https://npm.pkg.github.com
# //npm.pkg.github.com/:_authToken=TOKEN
```

## 📚 Recursos Adicionais

- [Documentação GitHub Packages](https://docs.github.com/pt/packages/working-with-a-github-packages-registry/working-with-the-npm-registry)
- [Nx Release Documentation](https://nx.dev/recipes/nx-release)
- [npm Publishing Guide](https://docs.npmjs.com/cli/v8/commands/npm-publish)

## 🔗 Links Úteis

- [Packages Publicados](https://github.com/mmanjos/boyscout/packages)
- [Configuração de Tokens](https://github.com/settings/tokens)
- [Nx Workspace](https://nx.dev)
