# AXON Admin WebApp

Production management platform for the **AXON multi-agent AI system** — built
with Next.js 15 + NestJS + Nx monorepo, Pydantic AI, LangGraph, and a full
MCP integration layer.

---

## What Is AXON Admin?

AXON Admin supersedes the basic AXON Control Tower (port 3010) with a
production-grade management platform that covers every operational concern of
the AXON AI system:

- **Plugin & Tool Registry** — manage 10+ MCP domain agents and 100+ tools
- **Orchestrator Pipeline Tester** — run requests through the 6-stage AXON pipeline and inspect each stage's input/output in real time
- **Pydantic AI Agent Tester** — test Pydantic AI agents in TestModel / FunctionModel / real mode with full message exchange inspection
- **MCP Testing Console** — REST, SSE, WebSocket, and JSON-RPC 2.0 test runner
- **HITL Approval Queue** — human-in-the-loop decision management for `axon_board.hitl_queue`
- **Experience Ledger** — browse and replay `axon_brain.experience_records`
- **Token Vault** — AES-256-GCM encrypted API key management with rotation scheduler
- **User & RBAC** — JWT + OAuth + 2FA with fine-grained resource × action permissions
- **Real-time Dashboard** — 9 KPI widgets, 4 chart panels, live WebSocket metrics
- **Audit Trail** — every state-changing action logged and searchable
- **Notification Engine** — email, Slack, Discord, Telegram with rule-based triggers

---

## Architecture

```
┌─────────────────────────────────────────────┐
│              Browser (port 3000)            │
│         Next.js 15  •  React 19             │
│  TanStack Query  •  shadcn/ui  •  Recharts  │
└───────────────────┬─────────────────────────┘
                    │ REST / WebSocket / SSE
┌───────────────────▼─────────────────────────┐
│             NestJS API (port 3001)          │
│   Prisma ORM  •  BullMQ  •  Socket.io      │
│   JwtAuthGuard  •  RolesGuard  •  Helmet   │
└───┬───────────────┬───────────────┬─────────┘
    │               │               │
    ▼               ▼               ▼
PostgreSQL       Redis        Python AI Sidecar
(axon_admin +    BullMQ +     FastAPI (port 8210)
 AXON schemas)   pub/sub      Pydantic AI • LangGraph
 port 5435
                               │
                               ▼
                    AXON Control Tower (port 8200)
                    MCP Servers (ports 8000–8111)
```

---

## Tech Stack

### Frontend
| | |
|---|---|
| Framework | Next.js 15 (app router) + React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui (Radix) |
| Animation | Framer Motion |
| Data fetching | TanStack Query v5 |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Code editor | Monaco Editor |
| Auth | NextAuth.js |
| Realtime | Socket.io + SSE |

### Backend
| | |
|---|---|
| Framework | NestJS (Express) |
| Language | TypeScript |
| ORM | Prisma |
| Auth | Passport.js — JWT + Google + GitHub |
| Cache / Queue | Redis + BullMQ |
| Encryption | AES-256-GCM (Node.js crypto) |
| Realtime | Socket.io + Redis pub/sub |
| Docs | Swagger at `/api/docs` |

### Python AI Sidecar
| | |
|---|---|
| Framework | FastAPI |
| AI agents | Pydantic AI |
| Orchestration | LangGraph + AsyncPostgresSaver |
| Observability | Pydantic Logfire |
| Testing | pytest + pytest-anyio |

---

## Prerequisites

| Requirement | Version |
|---|---|
| Node.js | ≥ 22 |
| pnpm | ≥ 9 |
| Python | ≥ 3.12 |
| PostgreSQL | ≥ 15 (remote at `202.71.1.13:5435`) |
| Redis | ≥ 7 |
| Docker + Compose | Optional (for local services) |

---

## Quick Start

### 1. Clone and install

```bash
git clone <repo-url> /u01/axon-admin
cd /u01/axon-admin
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env — fill in database credentials, JWT secrets, OAuth keys
```

Key variables:

```bash
# Database (remote — already running)
DATABASE_URL="postgresql://axon:axon@202.71.1.13:5435/axon_admin"

# Redis (local)
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="<32-char random string>"
JWT_REFRESH_SECRET="<32-char random string>"

# Encryption key for secrets at rest (32-byte hex)
AES_KEY="<64-char hex string>"

# OAuth (optional for local dev)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""

# AXON Control Tower
AXON_CONTROL_TOWER_URL="http://localhost:8200"

# Python AI sidecar
AI_SIDECAR_URL="http://localhost:8210"

# Logfire (optional)
LOGFIRE_TOKEN=""
```

### 3. Set up the database

```bash
pnpm prisma migrate dev    # Apply all migrations to axon_admin schema
pnpm prisma generate       # Generate Prisma client
```

### 4. Start development servers

```bash
# Terminal 1 — API
nx serve api

# Terminal 2 — Frontend
nx serve web

# Terminal 3 — Python AI sidecar
cd apps/ai-tester
pip install -r requirements.txt
uvicorn main:app --reload --port 8210
```

Open:
- Frontend: http://localhost:3000
- API Swagger: http://localhost:3001/api/docs
- Prisma Studio: `pnpm prisma studio`

### 5. Docker (alternative)

```bash
docker compose up -d
```

Services started: Redis, NestJS API, Next.js, Nginx reverse proxy.
PostgreSQL is remote — no local container needed.

---

## Project Structure

```
/u01/axon-admin/
├── apps/
│   ├── web/              # Next.js 15 frontend
│   ├── api/              # NestJS backend
│   └── ai-tester/        # Python FastAPI + Pydantic AI sidecar
├── packages/
│   ├── types/            # @axon/types — shared TypeScript types
│   ├── ui/               # @axon/ui — shared component library
│   ├── config/           # @axon/config — ESLint, TS, Prettier configs
│   ├── mcp-sdk/          # @axon/mcp-sdk — MCP protocol client
│   └── shared/           # @axon/shared — Zod schemas, API client, utils
├── prisma/
│   ├── schema.prisma     # 33 table axon_admin schema
│   └── migrations/
├── infra/
│   ├── docker/           # Multi-stage Dockerfiles
│   ├── k8s/              # Kubernetes manifests
│   └── nginx/            # Reverse proxy config
├── .sixth/
│   └── skills/           # AI agent skills (14 skills)
├── .github/
│   └── workflows/        # CI/CD — lint → test → build → deploy
├── AGENTS.md             # AI coding agent instructions
├── IMPLEMENT.md          # 15-phase implementation plan
├── docker-compose.yml
├── nx.json
└── package.json
```

---

## Common Commands

```bash
# Development
nx serve web                     # Next.js dev server (port 3000)
nx serve api                     # NestJS dev server (port 3001)

# Build
nx build web                     # Production Next.js build
nx build api                     # Production NestJS build

# Test
nx test web                      # Jest tests for frontend
nx test api                      # Jest tests for backend
cd apps/ai-tester && pytest      # Python tests

# Lint & type-check
nx lint web
nx lint api
nx run web:type-check
nx run api:type-check

# Prisma
pnpm prisma migrate dev          # Create and apply migration
pnpm prisma migrate deploy       # Apply migrations in CI/prod
pnpm prisma generate             # Regenerate client after schema changes
pnpm prisma studio               # GUI at http://localhost:5555

# Docker
docker compose up -d             # Start all containerised services
docker compose down              # Stop services
docker compose logs -f api       # Follow API logs

# Graph — visualise task dependencies
nx graph
```

---

## Pages & Routes

| Route | Description |
|---|---|
| `/` | Redirect → `/dashboard` |
| `/dashboard` | KPI widgets, charts, AXON system status |
| `/plugins` | Plugin registry — list, search, filter |
| `/plugins/[id]` | Plugin detail, Monaco env editor, health, versions |
| `/tools` | Tool registry — categories, tags, search |
| `/tools/[id]` | Tool schema editor, execution panel, version diff |
| `/testing` | MCP Testing Console — REST / SSE / WS / MCP |
| `/testing/orchestrator` | 6-stage orchestrator pipeline tester |
| `/testing/pydantic-ai` | Pydantic AI agent tester (TestModel / real) |
| `/tokens` | API token vault — masked, rotation, expiry |
| `/logs` | Real-time virtualised log viewer |
| `/audit` | Audit trail — actor, action, resource, IP |
| `/notifications` | Notification inbox + rule engine |
| `/settings` | General, security, API gateway, MCP, branding |
| `/environments` | Dev / staging / production config manager |
| `/users` | User table — invite, roles, 2FA status |
| `/roles` | Role management — permission matrix |
| `/profile` | Own profile, password, 2FA, sessions |
| `/axon/agents` | AXON domain agent health cards |
| `/axon/hitl` | HITL approval queue — approve / reject |
| `/axon/ledger` | Experience Ledger — browse, replay |
| `/axon/supply-chain` | Supply Chain Plan viewer |
| `/auth/login` | Login — email/password + OAuth |
| `/auth/register` | Registration |
| `/auth/forgot-password` | Password reset via OTP |

---

## API Overview

The NestJS API runs at `http://localhost:3001`. Full interactive docs at
`/api/docs` (Swagger UI).

Key endpoint groups:

| Prefix | Description |
|---|---|
| `/api/auth/*` | Login, register, refresh, OAuth, 2FA |
| `/api/users/*` | User management |
| `/api/roles/*` | Role + permission management |
| `/api/plugins/*` | Plugin CRUD, health, restart |
| `/api/tools/*` | Tool CRUD, execution, versioning |
| `/api/tokens/*` | API token vault + rotation |
| `/api/logs/*` | Log query + export |
| `/api/dashboard/*` | KPI metrics + chart data |
| `/api/notifications/*` | Inbox + notification rules |
| `/api/settings/*` | App settings + feature flags |
| `/api/environments/*` | Environment + encrypted variable management |
| `/api/testing/*` | MCP test execution + collections |
| `/api/orchestrator/*` | Orchestrator pipeline runs + SSE streaming |
| `/api/pydantic-ai/*` | Pydantic AI agent registry + test runs |
| `/api/mcp/*` | AXON agent status + HITL queue |
| `ws://host/ws` | WebSocket — metrics, logs, notifications |

---

## Security

- **Encryption at rest** — AES-256-GCM for all secrets, tokens, and API keys
- **Password hashing** — bcrypt (rounds = 12)
- **Auth** — 15-minute JWT access tokens + 7-day rotating refresh tokens (HttpOnly cookies)
- **2FA** — TOTP via authenticator apps
- **RBAC** — Super Admin / Admin / Operator / Viewer with fine-grained permissions
- **Rate limiting** — 100 req/min per IP, 1000 req/min per API token
- **CSRF** — `X-AXON-Request: 1` header required on all state-changing requests
- **Security headers** — Helmet.js (HSTS, CSP, X-Frame-Options, etc.)
- **Input validation** — class-validator on all DTOs, Zod on all frontend forms
- **Audit logging** — every create / update / delete action recorded with actor, IP, before/after

---

## Implementation Plan

See [IMPLEMENT.md](IMPLEMENT.md) for the full 15-phase plan, checklist, all 33
Prisma table definitions, and complete API route table.

| Phase | Title |
|---|---|
| 1 | Foundation — Nx monorepo, NestJS scaffold, Next.js scaffold, Prisma |
| 2 | Authentication System — JWT, OAuth, RBAC, 2FA |
| 3 | Core UI Layout — Sidebar, Header, Dark mode, Responsive grid |
| 4 | Dashboard & Analytics — KPIs, charts, WebSocket live updates |
| 5 | Plugin Management — CRUD, Monaco env editor, health, versions |
| 6 | Tools Management — Schema editor, execution panel, version diff |
| 7 | MCP Testing Console — REST / SSE / WebSocket / MCP tester |
| 8 | Token & Security Management — Vault, rotation, audit trail |
| 9 | Logging & Monitoring — Real-time virtualised log viewer, OTLP |
| 10 | Notifications — In-app, email, Slack, Discord, Telegram, rules |
| 11 | Settings & Environment Management — Feature flags, env vars |
| 12 | User & Role Management — Invite, permission matrix |
| 13 | AXON System Integration — Agents, HITL, Ledger, Supply Chain |
| 14 | DevOps & CI/CD — Docker, Nginx, GitHub Actions, Kubernetes |
| 15 | Orchestrator & AI Testing Pages — Pipeline tester, Pydantic AI tester |

---

## AI Agent Skills

This project ships 14 VS Code agent skills in `.sixth/skills/`. Read the
relevant skill before implementing any feature:

| Skill | Coverage |
|---|---|
| `nx-monorepo-setup` | Nx workspace, app generators, path aliases |
| `nestjs-api-module` | Module/controller/service/DTO, guards, Swagger |
| `nextjs-page-creation` | App router, TanStack Query, forms, Axios client |
| `prisma-schema-migration` | All 33 models, migrations, PrismaService |
| `auth-implementation` | JWT, OAuth, RBAC, 2FA, NextAuth, middleware |
| `mcp-integration` | JSON-RPC 2.0, AXON connectivity, HITL, SSE |
| `realtime-websocket` | Socket.io gateway, Redis pub/sub, BullMQ, SSE |
| `ui-component` | shadcn/ui, Sidebar, DataTable, KpiCard, Monaco |
| `security-hardening` | AES-256-GCM, Helmet, CSRF, throttling, audit |
| `docker-deployment` | Dockerfiles, Nginx, docker-compose, CI/CD, K8s |
| `shared-types` | `@axon/types` package, TypeScript interfaces, Zod |
| `dashboard-analytics` | DashboardService, KpiGrid, UsageChart, live metrics |
| `langgraph-testing` | Production sessions, PostgreSQL checkpointer, HITL |
| `pydantic-ai-testing` | Agents, TestModel, FunctionModel, evals, Logfire |

---

## Contributing

1. Read `AGENTS.md` — coding conventions, security rules, and common pitfalls
2. Check `IMPLEMENT.md` — pick an unchecked item from the current phase
3. Read the relevant skill in `.sixth/skills/` before writing code
4. Follow the TypeScript and NestJS conventions in `AGENTS.md`
5. All PRs must pass `nx lint` + `nx test` before merge

---

## License

Private — AXON Systems. All rights reserved.
