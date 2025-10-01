# @boyscout/source

<a alt="Nx logo" href="https://nx.dev" target="_blank" rel="noreferrer"><img src="https://raw.githubusercontent.com/nrwl/nx/master/images/nx-logo.png" width="45"></a>

✨ **Boyscout Workspace** - Monorepo com packages reutilizáveis para projetos modernos ✨.

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

```bash
# Release completo (versionamento + changelog + publicação)
pnpm run release

# Apenas versionamento
pnpm run version

# Apenas changelog
pnpm run changelog

# Apenas publicação
pnpm run publish
```

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
