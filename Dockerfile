FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package*.json ./

# Crear directorios y asignar permisos
RUN mkdir -p storage/uploads logs && \
    chown -R node:node /usr/src/app

USER node

CMD ["node", "dist/src/main"]