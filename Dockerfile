# ============================================================
# Etapa 1: BUILDER — compila TypeScript a JavaScript
# ============================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Solo los manifests primero: si no cambian, Docker reutiliza
# la capa de npm ci (caché) y el build es mucho más rápido.
COPY package*.json ./
RUN npm ci

# Código fuente y compilación
COPY tsconfig*.json nest-cli.json ./
COPY src ./src
RUN npm run build

# ============================================================
# Etapa 2: PRODUCTION — imagen final mínima
# ============================================================
FROM node:20-alpine AS production

ENV NODE_ENV=production

WORKDIR /app

# Solo dependencias de producción: sin TypeScript, Jest ni ESLint.
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Solo el JavaScript compilado desde la etapa builder.
COPY --from=builder /app/dist ./dist

# Usuario no privilegiado: la imagen node:alpine trae el usuario
# 'node' (uid 1000). Si el contenedor se ve comprometido, el
# atacante no tiene permisos de root.
USER node

EXPOSE 3010

# Al arrancar: migraciones -> seed (idempotente) -> API.
# Si las migraciones fallan, el contenedor no arranca (correcto:
# mejor caer que servir con esquema desactualizado).
CMD ["sh", "-c", "npm run migration:run:prod && npm run seed:prod && node dist/main.js"]