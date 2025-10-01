#!/bin/bash

# 📦 Script para Versioning Apenas (sem publicação)
# Útil para quando você quer apenas atualizar as versões sem publicar

set -e

# Cores para output
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Verificar se estamos no diretório correto
if [ ! -f "nx.json" ]; then
    echo "❌ Este script deve ser executado na raiz do workspace Nx"
    exit 1
fi

# Verificar se há mudanças não commitadas
if [ -n "$(git status --porcelain)" ]; then
    echo "❌ Há mudanças não commitadas. Faça commit ou stash antes de executar o release."
    git status --short
    exit 1
fi

log "📦 Executando versioning apenas..."

# Executar versioning
if ! nx release version; then
    echo "❌ Versioning falhou."
    exit 1
fi

success "Versioning concluído com sucesso!"

log "Resumo do que foi feito:"
echo "  ✅ Versões atualizadas nos package.json"
echo "  ✅ Dependências atualizadas"
echo "  ✅ Arquivos commitados automaticamente"
echo
warning "Nota: Os pacotes NÃO foram publicados. Use './scripts/release.sh' para publicação completa."
