# @boyscout/biome

> **Preset de configuração Biome para projetos modernos JavaScript/TypeScript**

Esta biblioteca fornece uma configuração padronizada do [Biome](https://biomejs.dev/) otimizada para projetos modernos JavaScript/TypeScript, incluindo suporte completo para React, Node.js e ambientes de teste.

## 🚀 Características

- **Performance**: 35x mais rápido que o Prettier
- **All-in-one**: Linter e formatter em uma única ferramenta
- **Configuração otimizada**: Regras balanceadas entre rigor e produtividade
- **Suporte completo**: JavaScript, TypeScript, JSX, TSX e JSON
- **Integração VCS**: Configuração automática com Git

## 📦 Instalação

```bash
# Via npm
npm install --save-dev @boyscout/biome

# Via pnpm
pnpm add -D @boyscout/biome

# Via yarn
yarn add -D @boyscout/biome
```

## ⚙️ Configuração

### Uso Básico

Crie um arquivo `biome.json` na raiz do seu projeto:

```json
{
  "extends": ["@boyscout/biome"]
}
```

### Configuração Avançada

```json
{
  "extends": ["@boyscout/biome"],
  "linter": {
    "rules": {
      "style": {
        "useConst": "off"
      }
    }
  },
  "formatter": {
    "lineWidth": 120
  }
}
```

## 🎯 Regras Configuradas

### Linter Rules

#### Correctness
- `noUnusedVariables`: error
- `noUnusedImports`: error  
- `noUndeclaredVariables`: error
- `noUnusedFunctionParameters`: warn

#### Suspicious
- `useAwait`: warn
- `noExplicitAny`: warn
- `noArrayIndexKey`: warn

#### Style
- `useImportType`: warn
- `noNonNullAssertion`: warn
- `useNodejsImportProtocol`: warn
- `useConst`: error

#### Complexity
- `useArrowFunction`: warn
- `noForEach`: warn

#### Performance
- `noDelete`: warn

### Formatter

- **Indentação**: 2 espaços
- **Largura da linha**: 100 caracteres
- **Aspas**: Single quotes para JS, double quotes para JSX
- **Semicolons**: Sempre
- **Trailing commas**: ES5 style
- **Bracket spacing**: Habilitado

## 🛠️ Comandos Úteis

```bash
# Verificar problemas
npx biome check .

# Corrigir automaticamente
npx biome check --write .

# Apenas formatação
npx biome format --write .

# Apenas linting
npx biome lint --write .
```

## 🔧 Integração com Workspace

Este preset é parte do workspace **@boyscout/source** e está otimizado para:

- **Monorepos Nx**: Configuração automática para projetos Nx
- **TypeScript**: Suporte completo para decorators e features avançadas
- **Testing**: Globals configurados para Jest/Vitest
- **Git**: Integração automática com `.gitignore`

## 📋 Requisitos

- Node.js >= 18.0.0
- Biome >= 2.2.4

## 🤝 Contribuição

Este preset é mantido como parte do workspace Boyscout. Para contribuir:

1. Faça suas alterações na configuração
2. Teste com `pnpm test`
3. Execute `pnpm lint` para verificar formatação
4. Submeta um PR

## 📄 Licença

MIT © [Mateus Macedo Dos Anjos](mailto:macedodosanjosmateus@gmail.com)

## 🔗 Links

- [Biome Documentation](https://biomejs.dev/)
- [Boyscout Workspace](https://github.com/mmanjos/boyscout)
- [NPM Package](https://www.npmjs.com/package/@boyscout/biome)
