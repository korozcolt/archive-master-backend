FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine

RUN npm install -g pm2

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package*.json ./
COPY ecosystem.config.js ./

RUN mkdir -p storage/uploads && \
    chown -R node:node .

USER node

CMD ["pm2-runtime", "ecosystem.config.js"]