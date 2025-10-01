# Imagem simples para testar health checks
FROM node:18-alpine

# Instalar curl para health checks
RUN apk add --no-cache curl

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar código fonte
COPY . .

# Expor porta
EXPOSE 3000

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
