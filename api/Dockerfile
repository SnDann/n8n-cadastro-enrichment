FROM node:20-alpine AS base

RUN apk update && apk upgrade && apk add --no-cache

WORKDIR /app

# Copia package.json e instala dependências
COPY package*.json ./
RUN npm ci --only=production

# Copia código fonte
COPY server.js ./

# Cria pasta de dados
RUN mkdir -p data

# Expõe porta
EXPOSE 3001

# Comando de start
CMD ["node", "server.js"]

