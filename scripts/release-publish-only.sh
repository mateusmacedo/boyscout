#!/bin/bash

# 📤 Script para Publicação Apenas (sem versioning)
# Útil quando você já fez o versioning e quer apenas publicar

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

# Verificar se o usuário está logado no NPM
if ! npm whoami > /dev/null 2>&1; then
    echo "❌ Você não está logado no NPM. Execute 'npm login' primeiro."
    exit 1
fi

log "📤 Executando publicação apenas..."

# Executar publicação
if ! nx release publish; then
    echo "❌ Publicação falhou."
    exit 1
fi

success "Publicação concluída com sucesso!"

log "Resumo do que foi feito:"
echo "  ✅ Pacotes publicados no NPM"
echo
log "Para verificar os pacotes publicados, visite:"
echo "  - @boyscout/node-logger: https://www.npmjs.com/package/@boyscout/node-logger"
echo "  - @boyscout/biome: https://www.npmjs.com/package/@boyscout/biome"
echo "  - @boyscout/tsconfig: https://www.npmjs.com/package/@boyscout/tsconfig"
