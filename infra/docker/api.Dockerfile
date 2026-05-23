# ─── Stage 1: Builder ─────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

RUN npm install -g pnpm@11

WORKDIR /app

# Copy workspace manifests
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY tsconfig.base.json nx.json ./
COPY prisma ./prisma/

# Copy app and package sources
COPY apps/api ./apps/api/
COPY packages ./packages/

# Install dependencies
RUN pnpm install

# Generate Prisma client
RUN npx prisma generate

# Build api
RUN node node_modules/nx/dist/bin/nx.js build api --configuration=production

# ─── Stage 2: Runner ──────────────────────────────────────────────────────────
FROM node:22-alpine AS runner

RUN apk add --no-cache openssl

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/dist/apps/api ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

EXPOSE 3001

CMD ["node", "main.js"]
