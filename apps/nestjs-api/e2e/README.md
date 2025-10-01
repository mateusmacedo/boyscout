# Testes E2E - NestJS API

Suíte completa de testes end-to-end para validação da integração com `@boyscout/node-logger`.

## 🚀 Execução Rápida

```bash
# Todos os testes
pnpm run test:e2e

# Interface gráfica (recomendado)
pnpm run test:e2e:ui

# Teste específico
pnpx playwright test user-endpoints.spec.ts
```

## 📋 Estrutura dos Testes

### **Testes por Módulo**
- **`core.spec.ts`** - Endpoints básicos e funcionalidades fundamentais
- **`user-endpoints.spec.ts`** - CRUD completo de usuários
- **`analytics-endpoints.spec.ts`** - Tracking de eventos e métricas
- **`health-endpoints.spec.ts`** - Health checks e monitoramento
- **`monitoring-endpoints.spec.ts`** - Logs customizados e eventos

### **Testes Especializados**
- **`performance-tests.spec.ts`** - Carga alta, concorrência e performance
- **`logging-correlation-tests.spec.ts`** - Validação de logging e correlação
- **`integration-tests.spec.ts`** - Workflows completos e integração
- **`error-handling.spec.ts`** - Tratamento de erros e validação

## 🛠️ Comandos de Execução

### **Básicos**
```bash
pnpm run test:e2e      # Todos os testes
pnpm run test:e2e:ui   # Interface gráfica
pnpm run test:e2e:debug # Modo debug
```

### **Por Categoria**
```bash
pnpx playwright test user-endpoints.spec.ts        # Usuários
pnpx playwright test performance-tests.spec.ts     # Performance
pnpx playwright test logging-correlation-tests.spec.ts # Logging
```

### **Por Navegador**
```bash
pnpx playwright test --project=chromium  # Chrome
pnpx playwright test --project=firefox   # Firefox
pnpx playwright test --project=webkit    # Safari
```

## 📊 Cobertura

- **100% dos endpoints** testados
- **Performance** validada (carga alta, concorrência)
- **Logging** verificado (correlation IDs, redação)
- **Segurança** garantida (dados sensíveis protegidos)

## 🔧 Configuração

```bash
# Variáveis de ambiente
NODE_ENV=test
BASE_URL=http://localhost:3000
```

## 📚 Documentação Adicional

- **[Boas Práticas](./BEST_PRACTICES.md)** - Diretrizes para testes de qualidade
- **[Scripts](../scripts/README.md)** - Comandos e automações
