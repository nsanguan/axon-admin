---
name: docker-deployment
description: Build, run, and deploy the AXON Admin WebApp using Docker, Docker Compose, Nginx, and Kubernetes. Use when creating Dockerfiles, setting up docker-compose for local or production, configuring Nginx reverse proxy, writing GitHub Actions CI/CD pipelines, or creating Kubernetes manifests.
---

# Docker & Deployment — AXON Admin

## Service Topology

```
Internet → Nginx (80/443)
              ├── /       → web:3000  (Next.js)
              ├── /api    → api:3001  (NestJS)
              └── /ws     → api:3001  (WebSocket upgrade)

api:3001  → PostgreSQL @ 202.71.1.13:5435  (external)
api:3001  → redis:6379  (internal)
```

## Step 1: NestJS Dockerfile

```dockerfile
# infra/docker/api.Dockerfile
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

# ── Builder ──────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/types/package.json ./packages/types/
COPY packages/shared/package.json ./packages/shared/
COPY packages/mcp-sdk/package.json ./packages/mcp-sdk/
RUN pnpm install --frozen-lockfile

COPY tsconfig.base.json nx.json ./
COPY apps/api/ ./apps/api/
COPY packages/types/ ./packages/types/
COPY packages/shared/ ./packages/shared/
COPY packages/mcp-sdk/ ./packages/mcp-sdk/
COPY prisma/ ./prisma/

RUN pnpm nx build api --configuration=production
RUN pnpm --filter api --prod deploy /app/deploy

# ── Runner ───────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

COPY --from=builder --chown=nestjs:nodejs /app/deploy ./
COPY --from=builder --chown=nestjs:nodejs /app/prisma ./prisma

USER nestjs
EXPOSE 3001
ENV NODE_ENV=production

CMD ["node", "dist/apps/api/main.js"]
```

## Step 2: Next.js Dockerfile

```dockerfile
# infra/docker/web.Dockerfile
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

# ── Builder ──────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/types/package.json ./packages/types/
COPY packages/ui/package.json ./packages/ui/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile

COPY tsconfig.base.json nx.json ./
COPY apps/web/ ./apps/web/
COPY packages/types/ ./packages/types/
COPY packages/ui/ ./packages/ui/
COPY packages/shared/ ./packages/shared/

ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm nx build web --configuration=production

# ── Runner ───────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

USER nextjs
EXPOSE 3000

CMD ["node", "apps/web/server.js"]
```

Enable standalone mode in `apps/web/next.config.ts`:
```typescript
const nextConfig = {
  output: 'standalone',
  // ...
};
```

## Step 3: Nginx Configuration

```nginx
# infra/nginx/nginx.conf
worker_processes auto;
events { worker_connections 1024; }

http {
  sendfile on;
  tcp_nopush on;
  keepalive_timeout 65;
  gzip on;
  gzip_types text/plain application/json application/javascript text/css;

  upstream web  { server web:3000; }
  upstream api  { server api:3001; }

  server {
    listen 80;
    server_name _;

    # Redirect HTTP to HTTPS in production
    # return 301 https://$host$request_uri;

    # Health check
    location /healthz {
      return 200 "OK";
      add_header Content-Type text/plain;
    }

    # API routes
    location /api/ {
      proxy_pass         http://api;
      proxy_http_version 1.1;
      proxy_set_header   Upgrade $http_upgrade;
      proxy_set_header   Connection "upgrade";
      proxy_set_header   Host $host;
      proxy_set_header   X-Real-IP $remote_addr;
      proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header   X-Forwarded-Proto $scheme;
      proxy_read_timeout 300s;
      proxy_send_timeout 300s;
      client_max_body_size 10M;
    }

    # WebSocket
    location /socket.io/ {
      proxy_pass         http://api;
      proxy_http_version 1.1;
      proxy_set_header   Upgrade $http_upgrade;
      proxy_set_header   Connection "upgrade";
      proxy_set_header   Host $host;
      proxy_set_header   X-Real-IP $remote_addr;
      proxy_read_timeout 3600s;
    }

    # Frontend (all other routes)
    location / {
      proxy_pass         http://web;
      proxy_http_version 1.1;
      proxy_set_header   Host $host;
      proxy_set_header   X-Real-IP $remote_addr;
      proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header   X-Forwarded-Proto $scheme;
      proxy_cache_bypass $http_upgrade;
    }
  }
}
```

## Step 4: docker-compose.yml

```yaml
# docker-compose.yml
version: '3.9'

services:
  redis:
    image: redis:7-alpine
    restart: unless-stopped
    command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks: [axon]

  api:
    build:
      context: .
      dockerfile: infra/docker/api.Dockerfile
    restart: unless-stopped
    env_file: .env.production
    environment:
      NODE_ENV: production
      REDIS_HOST: redis
      REDIS_PORT: 6379
    depends_on:
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3001/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s
    networks: [axon]

  web:
    build:
      context: .
      dockerfile: infra/docker/web.Dockerfile
    restart: unless-stopped
    env_file: .env.production
    environment:
      NODE_ENV: production
      NEXT_PUBLIC_API_URL: http://nginx/api
      NEXT_PUBLIC_WS_URL: http://nginx
    depends_on:
      api:
        condition: service_healthy
    networks: [axon]

  nginx:
    image: nginx:1.27-alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./infra/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - nginx_logs:/var/log/nginx
    depends_on:
      - web
      - api
    networks: [axon]

volumes:
  redis_data:
  nginx_logs:

networks:
  axon:
    driver: bridge
```

## Step 5: Environment Files

```bash
# .env.example (commit this)
# Copy to .env.development or .env.production and fill in values

# Database (external PostgreSQL)
DATABASE_URL="postgresql://axon:axon@202.71.1.13:5435/axon?schema=axon_admin&sslmode=prefer"
DATABASE_URL_AXON="postgresql://axon:axon@202.71.1.13:5435/axon?schema=public&sslmode=prefer"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# API Security
JWT_SECRET=<64-char hex>
ENCRYPTION_KEY=<64-char hex>
COOKIE_SECRET=<32-char hex>
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000
API_URL=http://localhost:3001

# OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_WS_URL=http://localhost:3001
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<32-char hex>

# Email (Nodemailer)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=noreply@axon-admin.com

# Notifications (optional)
SLACK_WEBHOOK_URL=
DISCORD_WEBHOOK_URL=
TELEGRAM_BOT_TOKEN=
```

## Step 6: GitHub Actions CI/CD

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }

      - uses: pnpm/action-setup@v3
        with: { version: 9 }

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      - run: pnpm install --frozen-lockfile

      - name: Restore Nx cache
        uses: actions/cache@v4
        with:
          path: .nx/cache
          key: nx-${{ hashFiles('**/package.json') }}-${{ github.sha }}
          restore-keys: nx-${{ hashFiles('**/package.json') }}-

      - name: Lint (affected)
        run: pnpm nx affected -t lint --base=origin/main

      - name: Type check (affected)
        run: pnpm nx affected -t typecheck --base=origin/main

      - name: Test (affected)
        run: pnpm nx affected -t test --base=origin/main --passWithNoTests

      - name: Build (affected)
        run: pnpm nx affected -t build --base=origin/main --configuration=production

      - name: Security audit
        run: pnpm audit --audit-level=high

  docker-build:
    runs-on: ubuntu-latest
    needs: lint-and-test
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4

      - name: Build API image
        run: docker build -f infra/docker/api.Dockerfile -t axon-admin-api:${{ github.sha }} .

      - name: Build Web image
        run: docker build -f infra/docker/web.Dockerfile -t axon-admin-web:${{ github.sha }} .
```

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    tags: ['v*']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Login to registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push images
        run: |
          TAG=${GITHUB_REF#refs/tags/}
          docker buildx build -f infra/docker/api.Dockerfile \
            -t ghcr.io/${{ github.repository }}/api:$TAG \
            -t ghcr.io/${{ github.repository }}/api:latest \
            --push .
          docker buildx build -f infra/docker/web.Dockerfile \
            -t ghcr.io/${{ github.repository }}/web:$TAG \
            -t ghcr.io/${{ github.repository }}/web:latest \
            --push .
```

## Step 7: Kubernetes Manifests (Production)

```yaml
# infra/k8s/api-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: axon-admin-api
  namespace: axon-admin
spec:
  replicas: 2
  selector:
    matchLabels: { app: axon-admin-api }
  template:
    metadata:
      labels: { app: axon-admin-api }
    spec:
      containers:
        - name: api
          image: ghcr.io/OWNER/REPO/api:latest
          ports: [{ containerPort: 3001 }]
          envFrom:
            - secretRef: { name: axon-admin-secrets }
            - configMapRef: { name: axon-admin-config }
          livenessProbe:
            httpGet: { path: /api/health, port: 3001 }
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet: { path: /api/health, port: 3001 }
            initialDelaySeconds: 10
            periodSeconds: 5
          resources:
            requests: { memory: "256Mi", cpu: "250m" }
            limits:   { memory: "512Mi", cpu: "500m" }
---
apiVersion: v1
kind: Service
metadata:
  name: axon-admin-api
  namespace: axon-admin
spec:
  selector: { app: axon-admin-api }
  ports: [{ port: 3001, targetPort: 3001 }]
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: axon-admin-api-hpa
  namespace: axon-admin
spec:
  scaleTargetRef: { apiVersion: apps/v1, kind: Deployment, name: axon-admin-api }
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource: { name: cpu, target: { type: Utilization, averageUtilization: 70 } }
```

## Common Commands

```bash
# Local dev (no Docker)
pnpm dev

# Local dev with Docker Compose
docker compose up -d redis
pnpm dev

# Full stack in Docker
docker compose up --build

# Production build test
docker compose -f docker-compose.yml up --build -d

# View logs
docker compose logs -f api
docker compose logs -f web

# Prisma migrate in container
docker compose exec api npx prisma migrate deploy

# Rebuild single service
docker compose up --build api

# K8s deploy
kubectl apply -f infra/k8s/

# Scale API
kubectl scale deployment axon-admin-api --replicas=4 -n axon-admin
```

## Rules

- Never use `docker compose` for production databases — PostgreSQL is external at 202.71.1.13:5435
- Multi-stage builds required — `node_modules` must not be in the final image (use `--prod deploy`)
- All secrets passed via environment variables — never baked into the image
- Next.js `output: 'standalone'` must be set for the runner stage to work
- WebSocket (`/socket.io/`) requires `Upgrade` and `Connection` headers in Nginx — always include them
- Health check endpoint `GET /api/health` must respond 200 within 10 seconds for container readiness
- CI uses `nx affected` to only build/test changed projects — never rebuild everything on every commit
- Docker images tagged with commit SHA for traceability, `latest` only for the newest release tag
