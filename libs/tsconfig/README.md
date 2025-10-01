# @boyscout/tsconfig

Configurações TypeScript padronizadas para projetos Node.js modernos.

## 📦 Instalação

```bash
# Via npm
npm install --save-dev @boyscout/tsconfig

# Via pnpm
pnpm add -D @boyscout/tsconfig

# Via yarn
yarn add -D @boyscout/tsconfig
```

## ⚙️ Configuração

### Uso Básico

Crie um arquivo `tsconfig.json` na raiz do seu projeto:

```json
{
  "extends": "@boyscout/tsconfig/base.json"
}
```

### Configurações Disponíveis

- **`base.json`** - Configuração base para projetos Node.js
- **`react.json`** - Configuração para projetos React (se disponível)
- **`strict.json`** - Configuração mais rigorosa (se disponível)

### Exemplo de Configuração Avançada

```json
{
  "extends": "@boyscout/tsconfig/base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": "./src",
    "paths": {
      "@/*": ["*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

## 🎯 Características

- **Configuração otimizada** para projetos Node.js modernos
- **Suporte completo** para TypeScript 5.x
- **Configurações balanceadas** entre rigor e produtividade
- **Compatibilidade** com ferramentas modernas (ESLint, Prettier, etc.)

## 📋 Requisitos

- Node.js >= 18.0.0
- TypeScript >= 5.0.0

## 🤝 Contribuição

Este package é mantido como parte do workspace Boyscout. Para contribuir:

1. Faça suas alterações na configuração
2. Teste com `pnpm test`
3. Execute `pnpm lint` para verificar formatação
4. Submeta um PR

## 📄 Licença

MIT © [Mateus Macedo Dos Anjos](mailto:macedodosanjosmateus@gmail.com)

## 🔗 Links

- [TypeScript Documentation](https://www.typescriptlang.org/)
- [Boyscout Workspace](https://github.com/mmanjos/boyscout)
- [NPM Package](https://www.npmjs.com/package/@boyscout/tsconfig)