# 🚨 Solução Rápida - Erro de Autenticação GitHub Packages

## ❌ **Problema Identificado:**
```
npm error code ENEEDAUTH
npm error need auth This command requires you to be logged in to https://npm.pkg.github.com
```

## ✅ **Solução:**

### 1. **Criar Personal Access Token**
```bash
# Acesse: https://github.com/settings/tokens
# Clique em "Generate new token (classic)"
# Selecione escopos: write:packages, read:packages
# Copie o token gerado
```

### 2. **Configurar Autenticação**
```bash
# Opção A: Script automático (RECOMENDADO)
pnpm run auth:github-packages SEU_TOKEN_AQUI

# Opção B: Manual
export GITHUB_TOKEN=SEU_TOKEN_AQUI
./scripts/auth-github-packages.sh
```

### 3. **Verificar Configuração**
```bash
# Deve retornar seu username do GitHub
npm whoami --registry=https://npm.pkg.github.com
```

### 4. **Publicar Package**
```bash
# Agora deve funcionar
cd libs/biome && npm publish
```

## 🔧 **Configuração Manual (Alternativa):**

Se o script não funcionar, configure manualmente:

```bash
# 1. Criar ~/.npmrc
cat > ~/.npmrc << EOF
@boyscout:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=SEU_TOKEN_AQUI
EOF

# 2. Testar
npm whoami --registry=https://npm.pkg.github.com

# 3. Publicar
cd libs/biome && npm publish
```

## 🎯 **Comandos de Teste:**

```bash
# Verificar autenticação
npm whoami --registry=https://npm.pkg.github.com

# Ver package publicado
npm view @boyscout/biome --registry=https://npm.pkg.github.com

# Listar packages do usuário
npm search @boyscout --registry=https://npm.pkg.github.com
```

## 📚 **Documentação Completa:**
Consulte `docs/GITHUB_PACKAGES.md` para instruções detalhadas.
