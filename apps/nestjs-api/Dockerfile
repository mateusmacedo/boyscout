# Multi-stage build para projeto Nx
FROM node:22-alpine AS base

# Instalar dependências do sistema e atualizar pacotes
RUN apk add --no-cache curl && apk upgrade --no-cache

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de configuração do workspace
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY nx.json tsconfig.base.json ./

# Instalar pnpm globalmente
RUN npm install -g pnpm@8.15.0

# Instalar dependências do workspace
RUN pnpm install --frozen-lockfile

# Copiar código fonte
COPY . .

# Build do projeto
RUN pnpm build nestjs-api

# Stage de produção
FROM node:22-alpine AS production

# Instalar curl para health checks e atualizar pacotes
RUN apk add --no-cache curl && apk upgrade --no-cache

# Definir diretório de trabalho
WORKDIR /app

# Copiar apenas os arquivos necessários para produção
COPY --from=base /app/dist/apps/nestjs-api ./dist/apps/nestjs-api
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package.json ./package.json

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Mudar para usuário não-root
USER nestjs

# Expor porta
EXPOSE 3000

# Variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=5 \
  CMD curl -f http://localhost:3000/health || exit 1

# Comando de inicialização
CMD ["node", "dist/apps/nestjs-api/main.js"]