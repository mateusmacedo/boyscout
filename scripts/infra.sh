#!/usr/bin/bash
set -euo pipefail

# Script de conveniência para gerenciar infraestrutura via Nx
# Uso: ./scripts/infra.sh [comando] [ambiente]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para mostrar ajuda
show_help() {
    echo -e "${BLUE}🏗️  Infraestrutura Boyscout - Script de Conveniência${NC}"
    echo ""
    echo "Uso: $0 [comando] [ambiente]"
    echo ""
    echo "Comandos disponíveis:"
    echo "  ${GREEN}up${NC}          Inicia infraestrutura"
    echo "  ${GREEN}down${NC}        Para infraestrutura"
    echo "  ${GREEN}status${NC}      Mostra status"
    echo "  ${GREEN}logs${NC}        Mostra logs"
    echo "  ${GREEN}test${NC}        Testa conectividade"
    echo "  ${GREEN}backup${NC}      Faz backup"
    echo "  ${GREEN}cleanup${NC}     Limpa containers órfãos"
    echo "  ${GREEN}dev${NC}         Ambiente de desenvolvimento completo"
    echo "  ${GREEN}prod${NC}        Ambiente de produção simulado"
    echo ""
    echo "Ambientes disponíveis:"
    echo "  ${YELLOW}docker${NC}     Docker Compose (desenvolvimento)"
    echo "  ${YELLOW}k3d${NC}        Kubernetes k3d (produção simulada)"
    echo ""
    echo "Exemplos:"
    echo "  $0 up docker          # Inicia infraestrutura Docker"
    echo "  $0 dev                # Ambiente de desenvolvimento"
    echo "  $0 prod               # Ambiente de produção"
    echo "  $0 status k3d         # Status do cluster k3d"
}

# Função para executar comando Nx
run_nx() {
    local target="$1"
    echo -e "${BLUE}[infra]${NC} Executando: nx ${target}"
    cd "${ROOT_DIR}"
    # Usar comando direto para targets de infraestrutura
    case "${target}" in
        "infra:docker:up")
            cd infra/docker && make up
            ;;
        "infra:docker:down")
            cd infra/docker && make down
            ;;
        "infra:docker:status")
            cd infra/docker && make status
            ;;
        "infra:docker:logs")
            cd infra/docker && make logs
            ;;
        "infra:docker:test")
            cd infra/docker && make test
            ;;
        "infra:docker:backup")
            cd infra/docker && make backup
            ;;
        "infra:docker:cleanup")
            cd infra/docker && make cleanup
            ;;
        "infra:k3d:up")
            cd infra/k3d && make up
            ;;
        "infra:k3d:down")
            cd infra/k3d && make down
            ;;
        "infra:k3d:start")
            cd infra/k3d && make start
            ;;
        "infra:k3d:status")
            cd infra/k3d && make status
            ;;
        "infra:k3d:deploy")
            cd infra/k3d && make deploy-boyscout
            ;;
        "infra:k3d:setup-ingress")
            cd infra/k3d && make setup-centralized-ingress
            ;;
        "infra:k3d:test-ingress")
            cd infra/k3d && make test-centralized-ingress
            ;;
        "infra:k3d:build-images")
            cd infra/k3d && make build-images
            ;;
        "infra:k3d:test")
            cd infra/k3d && make test-all
            ;;
        "infra:k3d:generate-passwords")
            cd infra/k3d && make generate-passwords
            ;;
        *)
            nx "${target}"
            ;;
    esac
}

# Função para verificar dependências
check_deps() {
    if ! command -v nx >/dev/null 2>&1; then
        echo -e "${RED}[error]${NC} Nx não está instalado. Execute: npm install -g nx"
        exit 1
    fi
    
    if ! command -v docker >/dev/null 2>&1; then
        echo -e "${RED}[error]${NC} Docker não está instalado"
        exit 1
    fi
}

# Função para ambiente de desenvolvimento
setup_dev() {
    echo -e "${GREEN}[dev]${NC} Configurando ambiente de desenvolvimento..."
    run_nx "infra:docker:up"
    run_nx "infra:docker:status"
    echo -e "${GREEN}[dev]${NC} Ambiente de desenvolvimento pronto!"
    echo -e "${YELLOW}[info]${NC} Acesse: http://localhost"
}

# Função para ambiente de produção
setup_prod() {
    echo -e "${GREEN}[prod]${NC} Configurando ambiente de produção simulado..."
    run_nx "infra:k3d:up"
    run_nx "infra:k3d:deploy"
    run_nx "infra:k3d:setup-ingress"
    echo -e "${GREEN}[prod]${NC} Ambiente de produção simulado pronto!"
    echo -e "${YELLOW}[info]${NC} Acesse: https://boyscout.local"
    echo -e "${YELLOW}[info]${NC} Adicione ao /etc/hosts: 127.0.0.1 boyscout.local"
}

# Função para mostrar status detalhado
show_status() {
    local env="${1:-docker}"
    
    echo -e "${BLUE}[status]${NC} Verificando status da infraestrutura ${env}..."
    
    if [[ "${env}" == "docker" ]]; then
        run_nx "infra:docker:status"
    elif [[ "${env}" == "k3d" ]]; then
        run_nx "infra:k3d:status"
    else
        echo -e "${RED}[error]${NC} Ambiente inválido: ${env}"
        exit 1
    fi
}

# Função para mostrar logs
show_logs() {
    local env="${1:-docker}"
    
    echo -e "${BLUE}[logs]${NC} Mostrando logs da infraestrutura ${env}..."
    
    if [[ "${env}" == "docker" ]]; then
        run_nx "infra:docker:logs"
    elif [[ "${env}" == "k3d" ]]; then
        echo -e "${YELLOW}[info]${NC} Para logs do k3d, use: kubectl logs -f deployment/<nome> -n boyscout"
    else
        echo -e "${RED}[error]${NC} Ambiente inválido: ${env}"
        exit 1
    fi
}

# Função para testar conectividade
test_connectivity() {
    local env="${1:-docker}"
    
    echo -e "${BLUE}[test]${NC} Testando conectividade da infraestrutura ${env}..."
    
    if [[ "${env}" == "docker" ]]; then
        run_nx "infra:docker:test"
    elif [[ "${env}" == "k3d" ]]; then
        run_nx "infra:k3d:test"
    else
        echo -e "${RED}[error]${NC} Ambiente inválido: ${env}"
        exit 1
    fi
}

# Função para fazer backup
backup_data() {
    local env="${1:-docker}"
    
    echo -e "${BLUE}[backup]${NC} Fazendo backup da infraestrutura ${env}..."
    
    if [[ "${env}" == "docker" ]]; then
        run_nx "infra:docker:backup"
    elif [[ "${env}" == "k3d" ]]; then
        echo -e "${YELLOW}[info]${NC} Para backup do k3d, use: kubectl get all -n boyscout -o yaml > backup.yaml"
    else
        echo -e "${RED}[error]${NC} Ambiente inválido: ${env}"
        exit 1
    fi
}

# Função para limpeza
cleanup_env() {
    local env="${1:-docker}"
    
    echo -e "${YELLOW}[warning]${NC} Limpando infraestrutura ${env}..."
    
    if [[ "${env}" == "docker" ]]; then
        run_nx "infra:docker:cleanup"
    elif [[ "${env}" == "k3d" ]]; then
        run_nx "infra:k3d:down"
    else
        echo -e "${RED}[error]${NC} Ambiente inválido: ${env}"
        exit 1
    fi
}

# Função para iniciar infraestrutura
start_infra() {
    local env="${1:-docker}"
    
    echo -e "${GREEN}[start]${NC} Iniciando infraestrutura ${env}..."
    
    if [[ "${env}" == "docker" ]]; then
        run_nx "infra:docker:up"
    elif [[ "${env}" == "k3d" ]]; then
        run_nx "infra:k3d:up"
    else
        echo -e "${RED}[error]${NC} Ambiente inválido: ${env}"
        exit 1
    fi
}

# Função para parar infraestrutura
stop_infra() {
    local env="${1:-docker}"
    
    echo -e "${RED}[stop]${NC} Parando infraestrutura ${env}..."
    
    if [[ "${env}" == "docker" ]]; then
        run_nx "infra:docker:down"
    elif [[ "${env}" == "k3d" ]]; then
        run_nx "infra:k3d:down"
    else
        echo -e "${RED}[error]${NC} Ambiente inválido: ${env}"
        exit 1
    fi
}

# Main
main() {
    local command="${1:-help}"
    local environment="${2:-docker}"
    
    # Verificar dependências
    check_deps
    
    case "${command}" in
        "help"|"-h"|"--help")
            show_help
            ;;
        "up")
            start_infra "${environment}"
            ;;
        "down")
            stop_infra "${environment}"
            ;;
        "status")
            show_status "${environment}"
            ;;
        "logs")
            show_logs "${environment}"
            ;;
        "test")
            test_connectivity "${environment}"
            ;;
        "backup")
            backup_data "${environment}"
            ;;
        "cleanup")
            cleanup_env "${environment}"
            ;;
        "dev")
            setup_dev
            ;;
        "prod")
            setup_prod
            ;;
        *)
            echo -e "${RED}[error]${NC} Comando inválido: ${command}"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# Executar main com argumentos
main "$@"
