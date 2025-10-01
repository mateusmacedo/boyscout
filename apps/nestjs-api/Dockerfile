# Multi-stage build para otimizar o tamanho da imagem
FROM node:18-alpine AS builder

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Instalar pnpm
RUN npm install -g pnpm

# Instalar dependências
RUN pnpm install --frozen-lockfile

# Copiar código fonte
COPY . .

# Build da aplicação
RUN pnpm nx build nestjs-api

# Estágio de produção
FROM node:18-alpine AS production

# Instalar pnpm
RUN npm install -g pnpm

# Definir diretório de trabalho
WORKDIR /app

# Copiar package.json e pnpm-lock.yaml
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Instalar apenas dependências de produção (sem scripts)
RUN pnpm install --frozen-lockfile --prod --ignore-scripts

# Copiar build da aplicação
COPY --from=builder /app/dist ./dist

# Copiar node_modules necessários
COPY --from=builder /app/node_modules ./node_modules

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
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Comando de inicialização
CMD ["node", "dist/apps/nestjs-api/main.js"]
