# 🏗️ Infraestrutura Integrada ao Workspace Nx

Este documento descreve como a infraestrutura Docker e Kubernetes foi integrada ao workspace Nx, permitindo gerenciamento unificado através de targets do Nx.

## 📋 Visão Geral

A pasta `infra/` contém duas abordagens de infraestrutura:

- **`infra/docker/`**: Ambiente Docker Compose para desenvolvimento
- **`infra/k3d/`**: Ambiente Kubernetes (k3d) para simulação de produção

Ambas foram integradas ao workspace Nx através de targets personalizados.

## 🎯 Targets de Infraestrutura

### Docker (Desenvolvimento)

```bash
# Gerenciamento básico
nx infra:docker:up          # Inicia toda a infraestrutura
nx infra:docker:down        # Para toda a infraestrutura
nx infra:docker:status      # Mostra status dos serviços
nx infra:docker:logs        # Mostra logs dos serviços

# Testes e manutenção
nx infra:docker:test        # Testa conectividade
nx infra:docker:backup      # Faz backup dos dados
nx infra:docker:cleanup     # Limpa containers órfãos
```

### Kubernetes k3d (Produção Simulada)

```bash
# Gerenciamento do cluster
nx infra:k3d:up             # Cria cluster e registry
nx infra:k3d:down           # Remove cluster
nx infra:k3d:start          # Inicia cluster existente
nx infra:k3d:status         # Status do cluster

# Deploy e configuração
nx infra:k3d:deploy         # Deploy da infraestrutura
nx infra:k3d:setup-ingress   # Configura ingress centralizado
nx infra:k3d:test-ingress    # Testa ingress

# Build e testes
nx infra:k3d:build-images   # Constrói imagens Docker
nx infra:k3d:test           # Testa infraestrutura
nx infra:k3d:generate-passwords  # Gera senhas seguras
```

### Ambientes Completos

```bash
# Ambiente de desenvolvimento completo
nx infra:dev                # Docker + status

# Ambiente de produção simulado
nx infra:prod               # k3d + deploy + ingress
```

## 🔗 Integração com Projetos

### API NestJS

O projeto `nestjs-api` possui targets específicos para integração com infraestrutura:

```bash
# Deploy em diferentes ambientes
nx deploy:docker nestjs-api     # Deploy no Docker
nx deploy:k3d nestjs-api        # Deploy no k3d

# Desenvolvimento com infraestrutura
nx dev:with-infra nestjs-api    # Desenvolvimento + infra

# Testes de integração
nx test:integration nestjs-api  # Testa API + infra
```

## 🚀 Fluxos de Trabalho Recomendados

### 1. Desenvolvimento Local

```bash
# 1. Iniciar infraestrutura de desenvolvimento
nx infra:dev

# 2. Desenvolver com infraestrutura
nx dev:with-infra nestjs-api

# 3. Testar integração
nx test:integration nestjs-api
```

### 2. Teste de Produção

```bash
# 1. Configurar ambiente de produção simulado
nx infra:prod

# 2. Deploy da aplicação
nx deploy:k3d nestjs-api

# 3. Testar ingress
nx infra:k3d:test-ingress
```

### 3. CI/CD Pipeline

```bash
# 1. Testes com infraestrutura
nx infra:docker:up
nx test:integration nestjs-api
nx infra:docker:down

# 2. Deploy em produção
nx infra:k3d:up
nx deploy:k3d nestjs-api
nx infra:k3d:setup-ingress
```

## 🔧 Configuração

### Variáveis de Ambiente

Os arquivos de configuração estão em:
- `infra/docker/.env` - Configuração Docker
- `infra/k3d/.env` - Configuração k3d

### Serviços Disponíveis

#### Docker (Desenvolvimento)
- **PostgreSQL**: `localhost:5432`
- **Redis**: `localhost:6379`
- **Keycloak**: `http://localhost/auth/`
- **LocalStack**: `http://localhost/aws/`
- **RabbitMQ**: `http://localhost/rabbitmq/`
- **Nginx**: `http://localhost/`

#### k3d (Produção)
- **Ingress Centralizado**: `https://boyscout.local/`
- **Keycloak**: `https://boyscout.local/auth/`
- **LocalStack**: `https://boyscout.local/aws/`
- **RabbitMQ**: `https://boyscout.local/rabbitmq/`

## 📊 Monitoramento

### Status da Infraestrutura

```bash
# Docker
nx infra:docker:status

# k3d
nx infra:k3d:status
```

### Logs

```bash
# Docker
nx infra:docker:logs

# k3d (via kubectl)
kubectl logs -f deployment/boyscout-api -n boyscout
```

### Testes de Conectividade

```bash
# Docker
nx infra:docker:test

# k3d
nx infra:k3d:test
```

## 🛠️ Troubleshooting

### Problemas Comuns

1. **Portas em uso**:
   ```bash
   nx infra:docker:cleanup
   ```

2. **Cluster k3d com problemas**:
   ```bash
   nx infra:k3d:down
   nx infra:k3d:up
   ```

3. **Problemas de rede**:
   ```bash
   nx infra:docker:down
   nx infra:docker:up
   ```

### Logs de Debug

```bash
# Docker
nx infra:docker:logs

# k3d
kubectl get pods -n boyscout
kubectl logs -f <pod-name> -n boyscout
```

## 📚 Comandos Úteis

### Listar todos os targets de infraestrutura

```bash
nx run-many --target=infra:docker:status --projects=*
nx run-many --target=infra:k3d:status --projects=*
```

### Executar em paralelo

```bash
nx run-many --target=infra:docker:up,infra:docker:test --parallel=2
```

### Cache e otimização

Os targets de infraestrutura não são cacheados por padrão, mas podem ser otimizados com:

```bash
# Executar apenas se necessário
nx infra:docker:status --skip-nx-cache
```

## 🔄 Integração com CI/CD

### GitHub Actions

```yaml
- name: Setup Infrastructure
  run: nx infra:docker:up

- name: Run Integration Tests
  run: nx test:integration nestjs-api

- name: Deploy to Production
  run: nx infra:prod && nx deploy:k3d nestjs-api
```

### Pipeline de Deploy

```bash
# Desenvolvimento → Staging → Produção
nx infra:dev
nx test:integration nestjs-api
nx infra:prod
nx deploy:k3d nestjs-api
```

## 📈 Benefícios da Integração

1. **Gerenciamento Unificado**: Todos os comandos através do Nx
2. **Cache Inteligente**: Aproveitamento do sistema de cache do Nx
3. **Dependências Automáticas**: Targets executam na ordem correta
4. **Paralelização**: Execução paralela quando possível
5. **Integração com Projetos**: Targets específicos por projeto
6. **CI/CD Otimizado**: Integração natural com pipelines

## 🎯 Próximos Passos

1. **Adicionar mais projetos**: Integrar outros projetos com infraestrutura
2. **Targets específicos**: Criar targets para diferentes ambientes
3. **Monitoramento**: Adicionar targets de monitoramento e alertas
4. **Backup automatizado**: Integrar backup com schedule do Nx
5. **Testes E2E**: Integrar testes end-to-end com infraestrutura
