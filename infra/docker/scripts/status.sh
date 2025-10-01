#!/usr/bin/bash
set -euo pipefail

# Script para verificar status da infraestrutura Liderança Sites
# Uso: ./scripts/status.sh

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "[status] Verificando status da infraestrutura Liderança Sites..."

# Função para executar docker-compose
run_compose() {
    if command -v docker-compose >/dev/null 2>&1; then
        docker-compose "$@"
    else
        docker compose "$@"
    fi
}

# Verifica se o Docker está rodando
if ! docker info >/dev/null 2>&1; then
    echo "[error] Docker não está rodando."
    exit 1
fi

echo "[status] Status dos serviços:"
run_compose ps

echo ""
echo "[status] Status de saúde dos serviços:"

# Verifica PostgreSQL
if run_compose ps postgresql | grep -q "Up"; then
    echo "✓ PostgreSQL: Rodando"
    if docker exec boyscout-postgresql pg_isready -U boyscout -d boyscout >/dev/null 2>&1; then
        echo "  ✓ Conexão com banco: OK"
        # Verifica se há tabelas criadas
        if docker exec boyscout-postgresql psql -U boyscout -d boyscout -c "\dt" >/dev/null 2>&1; then
            echo "  ✓ Estrutura do banco: OK"
        else
            echo "  ⚠ Estrutura do banco: Não inicializada"
        fi
    else
        echo "  ✗ Conexão com banco: Falha"
    fi
else
    echo "✗ PostgreSQL: Parado"
fi

# Verifica Redis
if run_compose ps redis | grep -q "Up"; then
    echo "✓ Redis: Rodando"
    if docker exec boyscout-redis redis-cli ping >/dev/null 2>&1; then
        echo "  ✓ Conexão Redis: OK"
        # Verifica informações do Redis
        if docker exec boyscout-redis redis-cli info memory >/dev/null 2>&1; then
            echo "  ✓ Redis info: OK"
        else
            echo "  ⚠ Redis info: Falha"
        fi
    else
        echo "  ✗ Conexão Redis: Falha"
    fi
else
    echo "✗ Redis: Parado"
fi

# Verifica RabbitMQ
if run_compose ps rabbitmq | grep -q "Up"; then
    echo "✓ RabbitMQ: Rodando"
    if docker exec boyscout-rabbitmq rabbitmq-diagnostics ping >/dev/null 2>&1; then
        echo "  ✓ Conexão RabbitMQ: OK"
        # Verifica status detalhado do RabbitMQ
        if docker exec boyscout-rabbitmq rabbitmq-diagnostics status >/dev/null 2>&1; then
            echo "  ✓ RabbitMQ status: OK"
        else
            echo "  ⚠ RabbitMQ status: Falha"
        fi
    else
        echo "  ✗ Conexão RabbitMQ: Falha"
    fi
else
    echo "✗ RabbitMQ: Parado"
fi

# Verifica Keycloak
if run_compose ps keycloak | grep -q "Up"; then
    echo "✓ Keycloak: Rodando"
    if curl -s -f http://localhost:8080/health/ready >/dev/null 2>&1; then
        echo "  ✓ Health check: OK"
        # Verifica se o Keycloak está totalmente inicializado
        if curl -s -f http://localhost:8080/health/live >/dev/null 2>&1; then
            echo "  ✓ Liveness check: OK"
        else
            echo "  ⚠ Liveness check: Falha"
        fi
    else
        echo "  ✗ Health check: Falha"
    fi
else
    echo "✗ Keycloak: Parado"
fi


# Verifica NestJS API
if run_compose ps nestjs-api | grep -q "Up"; then
    echo "✓ NestJS API: Rodando"
    if curl -s -f http://localhost:3000/health >/dev/null 2>&1; then
        echo "  ✓ Health endpoint: OK"
        # Verifica métricas da aplicação
        if curl -s -f http://localhost:3000/health/metrics >/dev/null 2>&1; then
            echo "  ✓ Metrics endpoint: OK"
        else
            echo "  ⚠ Metrics endpoint: Falha"
        fi
    else
        echo "  ✗ Health endpoint: Falha"
    fi
else
    echo "✗ NestJS API: Parado"
fi

# Verifica LocalStack
if run_compose ps localstack | grep -q "Up"; then
    echo "✓ LocalStack: Rodando"
    if curl -s -f http://localhost:4566/_localstack/health >/dev/null 2>&1; then
        echo "  ✓ Health check: OK"
    else
        echo "  ✗ Health check: Falha"
    fi
else
    echo "✗ LocalStack: Parado"
fi

# Verifica Nginx
if run_compose ps nginx | grep -q "Up"; then
    echo "✓ Nginx: Rodando"
    if curl -s -f http://localhost/health >/dev/null 2>&1; then
        echo "  ✓ Health check: OK"
    else
        echo "  ✗ Health check: Falha"
    fi
else
    echo "✗ Nginx: Parado"
fi

echo ""
echo "[info] URLs de acesso (através do proxy Nginx):"
echo "  - Keycloak: http://localhost/auth/"
echo "  - LocalStack: http://localhost/aws/"
echo "  - RabbitMQ Management: http://localhost/rabbitmq/"
echo "  - Nginx (Proxy): http://localhost"
echo "  - PostgreSQL: Apenas interno (sem acesso externo)"
echo "  - Redis: Apenas interno (sem acesso externo)"
echo "  - RabbitMQ: Apenas interno (sem acesso externo)"
