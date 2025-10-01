#!/bin/bash

# Script para configurar autenticação com GitHub Packages
# Uso: ./scripts/auth-github-packages.sh [TOKEN]

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔐 Configurando autenticação GitHub Packages${NC}"

# Verificar se o token foi fornecido
if [ -z "$1" ]; then
    echo -e "${YELLOW}⚠️  Token não fornecido.${NC}"
    echo ""
    echo -e "${YELLOW}Para criar um token:${NC}"
    echo "1. Acesse: https://github.com/settings/tokens"
    echo "2. Clique em 'Generate new token (classic)'"
    echo "3. Selecione os escopos: 'write:packages' e 'read:packages'"
    echo "4. Copie o token gerado"
    echo ""
    echo -e "${YELLOW}Uso:${NC}"
    echo "  ./scripts/auth-github-packages.sh SEU_TOKEN"
    echo "  ou"
    echo "  export GITHUB_TOKEN=SEU_TOKEN"
    echo "  ./scripts/auth-github-packages.sh"
    exit 1
fi

TOKEN=$1

# Verificar se o token é válido
echo -e "${YELLOW}🔍 Verificando token...${NC}"
if ! curl -s -H "Authorization: token $TOKEN" https://api.github.com/user > /dev/null; then
    echo -e "${RED}❌ Token inválido ou sem permissões adequadas${NC}"
    echo -e "${YELLOW}Verifique se o token tem os escopos: write:packages, read:packages${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Token válido!${NC}"

# Configurar autenticação no npm
echo -e "${YELLOW}🔧 Configurando autenticação npm...${NC}"

# Backup do .npmrc atual se existir
if [ -f ~/.npmrc ]; then
    cp ~/.npmrc ~/.npmrc.backup.$(date +%Y%m%d_%H%M%S)
    echo -e "${YELLOW}📋 Backup do ~/.npmrc criado${NC}"
fi

# Criar/atualizar ~/.npmrc
cat > ~/.npmrc << EOF
# GitHub Packages Configuration
@boyscout:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=$TOKEN
EOF

echo -e "${GREEN}✅ Autenticação configurada em ~/.npmrc${NC}"

# Testar configuração
echo -e "${YELLOW}🧪 Testando configuração...${NC}"
if npm whoami --registry=https://npm.pkg.github.com > /dev/null 2>&1; then
    USERNAME=$(npm whoami --registry=https://npm.pkg.github.com)
    echo -e "${GREEN}✅ Autenticação com GitHub Packages funcionando!${NC}"
    echo -e "${GREEN}   Usuário: $USERNAME${NC}"
else
    echo -e "${RED}❌ Erro na autenticação. Verifique o token.${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 Configuração concluída!${NC}"
echo ""
echo -e "${YELLOW}Próximos passos:${NC}"
echo "1. Para publicar um package: cd libs/biome && npm publish"
echo "2. Para publicar todos os packages: pnpm run publish:github"
echo "3. Para verificar packages publicados: https://github.com/mmanjos/boyscout/packages"
echo ""
echo -e "${YELLOW}Comandos úteis:${NC}"
echo "- npm whoami --registry=https://npm.pkg.github.com"
echo "- npm view @boyscout/biome --registry=https://npm.pkg.github.com"
