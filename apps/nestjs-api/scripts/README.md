# Scripts e Automações

Comandos e scripts disponíveis para desenvolvimento e testes da API NestJS.

## 🚀 Scripts PNPM

```bash
# Desenvolvimento
pnpm run start:dev     # Servidor de desenvolvimento
pnpm run start:prod    # Servidor de produção
pnpm run build         # Build da aplicação

# Testes
pnpm run test          # Testes unitários
pnpm run test:e2e      # Testes E2E
pnpm run test:e2e:ui   # Interface gráfica dos testes
```

## 🛠️ Comandos Nx

```bash
# Servir aplicação
nx serve nestjs-api                    # Desenvolvimento
nx serve nestjs-api --configuration=production  # Produção

# Testes
nx test nestjs-api                     # Testes unitários
nx e2e nestjs-api                      # Testes E2E
nx e2e:ui nestjs-api                   # Interface gráfica

# Build
nx build nestjs-api                    # Build da aplicação
```

## 📊 Relatórios de Teste

```bash
# Visualizar relatório HTML
pnpx playwright show-report apps/nestjs-api/playwright-report

# Limpar resultados
rm -rf apps/nestjs-api/playwright-report apps/nestjs-api/test-results
```

## 🔧 Troubleshooting

```bash
# Instalar navegadores do Playwright
pnpx playwright install

# Verificar porta em uso
lsof -i :3000
kill -9 <PID>

# Limpar cache
rm -rf node_modules/.cache
```

## 📚 Documentação Relacionada

- **[Testes E2E](../e2e/README.md)** - Guia completo de testes
- **[Boas Práticas](../e2e/BEST_PRACTICES.md)** - Diretrizes de qualidade
