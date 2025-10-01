#!/bin/bash

# 🚀 Script de Release Automatizado para Boyscout
# Este script automatiza o processo completo de versioning e publicação

set -e  # Exit on any error

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para logging
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar se estamos no diretório correto
if [ ! -f "nx.json" ]; then
    error "Este script deve ser executado na raiz do workspace Nx"
    exit 1
fi

# Verificar se há mudanças não commitadas
if [ -n "$(git status --porcelain)" ]; then
    error "Há mudanças não commitadas. Faça commit ou stash antes de executar o release."
    git status --short
    exit 1
fi

# Verificar se estamos na branch main/master
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ] && [ "$CURRENT_BRANCH" != "master" ]; then
    warning "Você não está na branch main/master. Branch atual: $CURRENT_BRANCH"
    read -p "Deseja continuar mesmo assim? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Verificar se o usuário está logado no NPM
if ! npm whoami > /dev/null 2>&1; then
    error "Você não está logado no NPM. Execute 'npm login' primeiro."
    exit 1
fi

log "🚀 Iniciando processo de release..."

# 1. Executar testes
log "🧪 Executando testes..."
if ! nx run-many -t test --ci; then
    error "Testes falharam. Abortando release."
    exit 1
fi
success "Todos os testes passaram"

# 2. Executar linting
log "🔍 Executando linting..."
if ! nx run-many -t lint; then
    error "Linting falhou. Abortando release."
    exit 1
fi
success "Linting passou"

# 3. Build dos projetos
log "🏗️  Construindo projetos..."
if ! nx run-many -t build; then
    error "Build falhou. Abortando release."
    exit 1
fi
success "Build concluído"

# 4. Dry run do release
log "🔍 Executando dry-run do release..."
if ! nx release --dry-run; then
    error "Dry-run do release falhou. Verifique a configuração."
    exit 1
fi
success "Dry-run passou"

# 5. Confirmar com o usuário
echo
warning "O dry-run foi executado com sucesso. As seguintes mudanças serão aplicadas:"
echo
read -p "Deseja continuar com o release real? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log "Release cancelado pelo usuário."
    exit 0
fi

# 6. Executar release real
log "🚀 Executando release real..."
if ! nx release; then
    error "Release falhou."
    exit 1
fi
success "Release concluído com sucesso!"

# 7. Push das tags
log "📤 Fazendo push das tags..."
if ! git push --follow-tags; then
    error "Falha ao fazer push das tags."
    exit 1
fi
success "Tags enviadas para o repositório"

# 8. Resumo
echo
success "🎉 Release concluído com sucesso!"
echo
log "Resumo do que foi feito:"
echo "  ✅ Testes executados e passaram"
echo "  ✅ Linting executado e passou"
echo "  ✅ Build executado com sucesso"
echo "  ✅ Versões atualizadas nos package.json"
echo "  ✅ Tags criadas no Git"
echo "  ✅ Pacotes publicados no NPM"
echo "  ✅ Tags enviadas para o repositório"
echo
log "Para verificar os pacotes publicados, visite:"
echo "  - @boyscout/node-logger: https://www.npmjs.com/package/@boyscout/node-logger"
echo "  - @boyscout/biome: https://www.npmjs.com/package/@boyscout/biome"
echo "  - @boyscout/tsconfig: https://www.npmjs.com/package/@boyscout/tsconfig"
