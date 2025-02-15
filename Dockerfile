FROM node:20-alpine AS builder

RUN npm install -g npm@11.0.0

WORKDIR /usr/src/app

# Instalar dependencias necesarias
RUN apk add --no-cache python3 make g++

# Copiar archivos de configuración
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY . .

# Construir la aplicación
RUN npm run build

# Etapa de producción
FROM node:20-alpine

RUN npm install -g npm@11.0.0
RUN npm install -g pm2

WORKDIR /usr/src/app

# Copiar archivos necesarios
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/tsconfig*.json ./
COPY --from=builder /usr/src/app/typeorm.config.ts ./
COPY --from=builder /usr/src/app/src/database/migrations ./src/database/migrations
COPY --from=builder /usr/src/app/src/database/seeds ./src/database/seeds
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules

# Copiar archivo de configuración de PM2
COPY ecosystem.config.js ./

# Crear directorios necesarios con permisos correctos
RUN mkdir -p storage/uploads /tmp/logs && \
    chown -R node:node /usr/src/app /tmp/logs

# Usar el usuario node que viene por defecto
USER node

EXPOSE 3000

# Usar PM2 para ejecutar la aplicación
CMD ["pm2-runtime", "start", "ecosystem.config.js"]