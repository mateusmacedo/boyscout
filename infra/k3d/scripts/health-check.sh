#!/usr/bin/bash
set -euo pipefail

# Script de verificação de saúde para Kubernetes
# Verifica status de pods, serviços e health checks
# Uso: ./scripts/health-check.sh

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NAMESPACE="boyscout"

echo "[health-check] Verificando saúde da infraestrutura Boyscout..."

# Função para verificar se o kubectl está disponível
check_kubectl() {
    if ! command -v kubectl >/dev/null 2>&1; then
        echo "[error] kubectl não está instalado ou não está no PATH"
        exit 1
    fi
    
    if ! kubectl cluster-info >/dev/null 2>&1; then
        echo "[error] Não é possível conectar ao cluster Kubernetes"
        echo "[info] Execute 'make up' primeiro para criar o cluster"
        exit 1
    fi
}

# Função para verificar status dos pods
check_pods() {
    echo "[health-check] Status dos pods:"
    kubectl get pods -n "$NAMESPACE" -o wide
    
    echo ""
    echo "[health-check] Pods com problemas:"
    local problem_pods=$(kubectl get pods -n "$NAMESPACE" --field-selector=status.phase!=Running,status.phase!=Succeeded --no-headers 2>/dev/null || true)
    if [ -n "$problem_pods" ]; then
        echo "$problem_pods"
    else
        echo "  ✓ Todos os pods estão rodando"
    fi
}

# Função para verificar health checks
check_health_endpoints() {
    echo ""
    echo "[health-check] Verificando endpoints de saúde:"
    
    # PostgreSQL
    echo "  PostgreSQL:"
    if kubectl exec -n "$NAMESPACE" deployment/postgresql -- pg_isready -U boyscout -d boyscout >/dev/null 2>&1; then
        echo "    ✓ Conexão: OK"
    else
        echo "    ✗ Conexão: Falha"
    fi
    
    # Redis
    echo "  Redis:"
    if kubectl exec -n "$NAMESPACE" deployment/redis -- redis-cli ping >/dev/null 2>&1; then
        echo "    ✓ Ping: OK"
    else
        echo "    ✗ Ping: Falha"
    fi
    
    # RabbitMQ
    echo "  RabbitMQ:"
    if kubectl exec -n "$NAMESPACE" deployment/rabbitmq -- rabbitmq-diagnostics ping >/dev/null 2>&1; then
        echo "    ✓ Ping: OK"
    else
        echo "    ✗ Ping: Falha"
    fi
    
    # Keycloak
    echo "  Keycloak:"
    if kubectl exec -n "$NAMESPACE" deployment/keycloak -- curl -s -f http://localhost:8080/health/ready >/dev/null 2>&1; then
        echo "    ✓ Health: OK"
    else
        echo "    ✗ Health: Falha"
    fi
    
    # LocalStack
    echo "  LocalStack:"
    if kubectl exec -n "$NAMESPACE" deployment/localstack -- curl -s -f http://localhost:4566/_localstack/health >/dev/null 2>&1; then
        echo "    ✓ Health: OK"
    else
        echo "    ✗ Health: Falha"
    fi
    
    # NestJS API
    echo "  NestJS API:"
    if kubectl exec -n "$NAMESPACE" deployment/nestjs-api -- curl -s -f http://localhost:3000/health >/dev/null 2>&1; then
        echo "    ✓ Health: OK"
    else
        echo "    ✗ Health: Falha"
    fi
}

# Função para verificar serviços
check_services() {
    echo ""
    echo "[health-check] Status dos serviços:"
    kubectl get services -n "$NAMESPACE"
    
    echo ""
    echo "[health-check] Endpoints dos serviços:"
    kubectl get endpoints -n "$NAMESPACE"
}

# Função para verificar ingress
check_ingress() {
    echo ""
    echo "[health-check] Status do ingress:"
    kubectl get ingress -n "$NAMESPACE"
    
    echo ""
    echo "[health-check] Verificando conectividade externa:"
    echo "  - Keycloak: http://boyscout.local/auth/"
    echo "  - LocalStack: http://boyscout.local/aws/"
    echo "  - RabbitMQ: http://boyscout.local/rabbitmq/"
    echo "  - API: http://boyscout.local/api/"
    echo "  - Health: http://boyscout.local/health"
}

# Função para verificar recursos do cluster
check_resources() {
    echo ""
    echo "[health-check] Uso de recursos:"
    kubectl top nodes 2>/dev/null || echo "  ⚠ Métricas não disponíveis (instalar metrics-server)"
    kubectl top pods -n "$NAMESPACE" 2>/dev/null || echo "  ⚠ Métricas de pods não disponíveis"
}

# Função para verificar logs de pods com problemas
check_problem_logs() {
    echo ""
    echo "[health-check] Verificando logs de pods com problemas:"
    
    local problem_pods=$(kubectl get pods -n "$NAMESPACE" --field-selector=status.phase!=Running,status.phase!=Succeeded -o name 2>/dev/null || true)
    if [ -n "$problem_pods" ]; then
        for pod in $problem_pods; do
            echo "  Logs de $pod:"
            kubectl logs -n "$NAMESPACE" "$pod" --tail=10 || echo "    ⚠ Não foi possível obter logs"
        done
    else
        echo "  ✓ Nenhum pod com problemas encontrado"
    fi
}

# Função principal
main() {
    check_kubectl
    check_pods
    check_health_endpoints
    check_services
    check_ingress
    check_resources
    check_problem_logs
    
    echo ""
    echo "[health-check] Verificação de saúde concluída!"
}

# Executa função principal
main "$@"
