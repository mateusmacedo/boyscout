# NestJS API com @boyscout/node-logger

API NestJS demonstrando integração completa com a biblioteca `@boyscout/node-logger`, implementando recursos complementares para observabilidade e monitoramento.

## 🚀 Início Rápido

```bash
# Instalar dependências
pnpm install

# Desenvolvimento
pnpm run start:dev

# Produção
pnpm run start:prod

# Testes E2E
pnpm run test:e2e
```

## 📋 Funcionalidades

- **Middleware de Correlação**: Rastreamento automático de requisições
- **Decorators de Logging**: `@Log` com diferentes níveis e configurações
- **Redação Automática**: Proteção de dados sensíveis
- **Health Checks**: Monitoramento de sistema e performance
- **Analytics**: Tracking de eventos e métricas
- **Monitoring**: Logs customizados por contexto

## 🛠️ Endpoints

| Módulo | Endpoints | Descrição |
|--------|-----------|-----------|
| **App** | `GET /api`, `POST /api/user`, `POST /api/complex` | Endpoints básicos com logging |
| **Users** | `GET/POST/PUT/DELETE /api/users/*` | CRUD completo de usuários |
| **Analytics** | `POST /api/analytics/track`, `GET /api/analytics/metrics` | Tracking e métricas |
| **Health** | `GET /api/health`, `GET /api/health/metrics` | Health checks e monitoramento |
| **Monitoring** | `POST /api/monitoring/*`, `GET /api/monitoring/summary` | Logs customizados |

## 🔧 Configuração

### Variáveis de Ambiente

```bash
NODE_ENV=development
PORT=3000
SERVICE_NAME=nestjs-api
SERVICE_VERSION=1.0.0
```

### Scripts Disponíveis

```bash
pnpm run start:dev     # Desenvolvimento
pnpm run start:prod    # Produção
pnpm run build         # Build
pnpm run test          # Testes unitários
pnpm run test:e2e      # Testes E2E
pnpm run test:e2e:ui   # Interface gráfica dos testes
```

## 📚 Documentação Detalhada

- **[Testes E2E](./e2e/README.md)** - Guia completo de testes end-to-end
- **[Boas Práticas](./e2e/BEST_PRACTICES.md)** - Diretrizes para testes de qualidade
- **[Scripts](./scripts/README.md)** - Comandos e automações disponíveis

## 🔗 Links Úteis

- [@boyscout/node-logger](../libs/node-logger/README.md) - Biblioteca principal
- [Documentação NestJS](https://docs.nestjs.com/) - Framework oficial
- [Playwright](https://playwright.dev/) - Framework de testes E2E
