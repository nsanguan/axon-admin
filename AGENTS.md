# AXON Admin — Agent Instructions

This file configures AI coding agents (GitHub Copilot, Claude, etc.) for the
AXON Admin WebApp monorepo. Read this file in full before making any changes.

---

## Project Identity

**AXON Admin** is the production management platform for the AXON multi-agent
AI system. It manages MCP plugins, tools, tokens, users, HITL approval queues,
the Experience Ledger, and orchestrator pipeline testing through a Next.js +
NestJS monorepo.

- Implementation plan: `IMPLEMENT.md` — 15 phases, read before adding features
- Workspace root: `/u01/axon-admin`

---

## Monorepo Layout

```
apps/
  web/              # Next.js 15 (port 3000) — app router
  api/              # NestJS (port 3001) — REST + WebSocket + SSE
  ai-tester/        # Python FastAPI sidecar (port 8210) — Pydantic AI agent host
packages/
  types/            # @axon/types — all shared TypeScript interfaces
  ui/               # @axon/ui — shadcn/ui wrappers + design tokens
  config/           # @axon/config — ESLint, TS, Prettier shared configs
  mcp-sdk/          # @axon/mcp-sdk — JSON-RPC 2.0 MCP client
  shared/           # @axon/shared — Zod schemas, date utils, formatters
prisma/
  schema.prisma     # axon_admin schema (29 tables + 4 Phase 15 tables)
  migrations/
infra/
  docker/           # Multi-stage Dockerfiles
  k8s/              # Kubernetes manifests + HPA
  nginx/            # Reverse proxy config
.sixth/
  skills/           # VS Code agent skills (read before implementing)
```

---

## Tech Stack — Do Not Change Without Explicit Request

### Frontend (`apps/web`)
| Concern | Library |
|---|---|
| Framework | Next.js 15 (app router, React 19) |
| Styling | Tailwind CSS + CSS variables |
| Components | shadcn/ui (Radix primitives) |
| Animation | Framer Motion |
| Data fetching | TanStack Query v5 |
| Forms | React Hook Form + Zod |
| HTTP client | Axios (via `packages/shared/api-client.ts`) |
| Icons | Lucide React |
| Charts | Recharts |
| Code editor | Monaco Editor |
| State | Zustand (UI state only — server state via TanStack Query) |
| Auth | NextAuth.js (JWT session) |
| Realtime | Socket.io client + SSE (native `EventSource`) |
| Virtualised lists | TanStack Virtual |

### Backend (`apps/api`)
| Concern | Library |
|---|---|
| Framework | NestJS (Express adapter) |
| ORM | Prisma (primary: `axon_admin`; secondary read-only: AXON schemas) |
| Auth | Passport.js — JwtStrategy + GoogleStrategy + GitHubStrategy |
| Guards | `JwtAuthGuard` + `RolesGuard` — **every protected route must have both** |
| Validation | `class-validator` + `class-transformer` (DTOs) |
| Encryption | Node.js `crypto` — AES-256-GCM for secrets at rest |
| Password | bcrypt (rounds = 12) |
| Queue | BullMQ + ioredis |
| Realtime | Socket.io + Redis pub/sub |
| Docs | Swagger (`@nestjs/swagger`) at `/api/docs` |
| Throttling | `@nestjs/throttler` — 100 req/min per IP |
| Security headers | Helmet.js |

### Python Sidecar (`apps/ai-tester`)
| Concern | Library |
|---|---|
| Framework | FastAPI |
| AI agents | Pydantic AI (`pydantic-ai`) |
| Orchestration | LangGraph (`langgraph`) with `AsyncPostgresSaver` |
| DB checkpoints | `langgraph-checkpoint-postgres` |
| Testing | pytest + pytest-anyio |
| Observability | Pydantic Logfire |

---

## Environment & Ports

| Service | Port | Notes |
|---|---|---|
| Next.js frontend | 3000 | `nx serve web` |
| NestJS API | 3001 | `nx serve api` |
| Python AI sidecar | 8210 | `uvicorn main:app --port 8210` |
| AXON Control Tower | 8200 | External — do not modify |
| AXON MCP servers | 8000–8111 | External — do not modify |
| PostgreSQL | 5435 | Host: 202.71.1.13, user: axon, db: axon_admin |
| Redis | 6379 | Used for BullMQ queues + Socket.io adapter |

---

## Database Rules

- **Primary schema**: `axon_admin` — owned by this project, full read/write
- **Read-only schemas**: `axon_brain`, `axon_plan`, `axon_agents`, `axon_mcp`, `axon_board` — never run migrations against these
- Always use **Prisma parameterised queries** — never raw SQL with string interpolation
- Sensitive columns (`token_hash`, `value_encrypted`, `api_key_encrypted`, etc.) are **AES-256-GCM encrypted at application level** before storage — never store plaintext
- All tables have `created_at`, `updated_at`; soft-delete tables have `deleted_at`
- Run `pnpm prisma migrate dev` from the repo root to apply new migrations
- Run `pnpm prisma generate` after any schema change

---

## Available Skills

Read the relevant skill before implementing the corresponding feature. Skills
are in `.sixth/skills/<name>/SKILL.md`.

| Skill | When to use |
|---|---|
| `nx-monorepo-setup` | Initialising Nx workspace, adding apps/packages, configuring path aliases |
| `nestjs-api-module` | Creating NestJS modules, controllers, services, DTOs, guards |
| `nextjs-page-creation` | Creating Next.js pages, layouts, TanStack Query hooks, Axios calls |
| `prisma-schema-migration` | Adding Prisma models, running migrations, PrismaService patterns |
| `auth-implementation` | JWT, OAuth, RBAC, 2FA, NextAuth, middleware |
| `mcp-integration` | JSON-RPC 2.0, MCP connectivity, SSE streaming, HITL approval |
| `realtime-websocket` | Socket.io gateway, Redis pub/sub, BullMQ, SSE relay |
| `ui-component` | shadcn/ui, Sidebar, DataTable, KpiCard, Monaco editor |
| `security-hardening` | AES-256-GCM, Helmet, CSRF, throttling, audit, response sanitizer |
| `docker-deployment` | Multi-stage Dockerfiles, Nginx, docker-compose, CI/CD, K8s HPA |
| `shared-types` | `@axon/types` package, shared TypeScript interfaces, Zod schemas |
| `dashboard-analytics` | DashboardService, KpiGrid, UsageChart, real-time metrics |
| `langgraph-testing` | LangGraph production sessions, PostgreSQL checkpointer, HITL, streaming |
| `pydantic-ai-testing` | Pydantic AI agents, TestModel, FunctionModel, evals, Logfire |

---

## Coding Conventions

### TypeScript (Frontend & Backend)

- All new files **must be TypeScript** — no `.js` files
- Use `interface` for object shapes exported from `@axon/types`; use `type` for local unions/aliases
- Prefer `async/await` over `.then()` chains
- DTOs in NestJS: always use `class-validator` decorators + `@ApiProperty()` for Swagger
- Never use `any` — use `unknown` and narrow, or define a proper type in `@axon/types`
- Import from `@axon/*` package aliases, not relative `../../packages/`

### NestJS Backend

- Every module lives in `apps/api/src/<feature>/<feature>.module.ts`
- File naming: `<feature>.controller.ts`, `<feature>.service.ts`, `<feature>.module.ts`, `dto/<action>-<feature>.dto.ts`
- **Every protected controller or route must have `@UseGuards(JwtAuthGuard, RolesGuard)`**
- **Every state-changing endpoint must call `AuditService.log()`**
- Use `ResponseSanitizerInterceptor` globally — never return encrypted fields in API responses
- BullMQ jobs go in `<feature>/<feature>.processor.ts`
- All exceptions must use NestJS built-in HTTP exceptions (`NotFoundException`, `ForbiddenException`, etc.)

### Next.js Frontend

- All pages in `apps/web/src/app/<route>/page.tsx` (app router)
- Client components: `'use client'` at top of file; prefer Server Components by default
- Data fetching: use `useSuspenseQuery` / `useQuery` from TanStack Query — no `useEffect` for data
- Forms: React Hook Form + Zod resolver — no uncontrolled `<input>` elements
- All API calls go through `packages/shared/api-client.ts` (Axios instance with interceptors)
- CSS: Tailwind utility classes only — no inline `style={{}}` unless for dynamic values
- Component file naming: PascalCase (`PluginCard.tsx`); hook naming: camelCase (`usePlugins.ts`)
- shadcn/ui components are in `packages/ui/src/components/` — do not duplicate in `apps/web`

### Python Sidecar

- Python 3.12+; type hints on all function signatures
- `pydantic-ai` agents defined in `apps/ai-tester/agents/`; one file per agent
- Use `AsyncPostgresSaver` from `langgraph-checkpoint-postgres` for production LangGraph sessions
- Use `InMemorySaver` in all tests
- Set `models.ALLOW_MODEL_REQUESTS = False` in every test file
- All tests: `pytest` + `pytest-anyio`; async tests decorated with `@pytest.mark.anyio`

---

## Security Rules — Enforced, Never Bypass

1. **All secrets at rest** use AES-256-GCM via `CryptoService` — never `Buffer.from(val, 'base64')` as a substitute
2. **Passwords** always hashed with `bcrypt.hash(password, 12)` — never store plaintext
3. **JWT tokens** are 15-minute access tokens + 7-day rotating refresh tokens stored as HttpOnly cookies
4. **CSRF protection** — all state-changing routes require the `X-AXON-Request: 1` header
5. **Input validation** at every API boundary — `class-validator` on DTOs, Zod on frontend
6. **Encrypted fields** (tokens, API keys) must never appear in API responses — `ResponseSanitizerInterceptor` handles this
7. **Audit log** every create/update/delete operation via `AuditService.log()`
8. **Rate limits** — 100 req/min per IP, 1000 req/min per API token
9. **SQL injection** — only Prisma parameterised queries; never template-literal SQL
10. **Scope creep** — only query AXON read-only schemas; never write to them

---

## Build & Run Commands

```bash
# Install dependencies
pnpm install

# Start both apps in development
nx serve web        # Next.js on port 3000
nx serve api        # NestJS on port 3001

# Run tests
nx test web
nx test api
pytest apps/ai-tester/

# Lint
nx lint web
nx lint api

# Build for production
nx build web
nx build api

# Prisma
pnpm prisma migrate dev          # Apply pending migrations
pnpm prisma generate             # Regenerate Prisma client
pnpm prisma studio               # Open Prisma Studio GUI

# Docker
docker compose up -d             # Start all services
docker compose down              # Stop all services

# Python sidecar
cd apps/ai-tester
uvicorn main:app --reload --port 8210
```

---

## Phase Status (read before starting any phase)

| Phase | Title | Status |
|---|---|---|
| 1 | Foundation | Not started |
| 2 | Authentication System | Not started |
| 3 | Core UI Layout | Not started |
| 4 | Dashboard & Analytics | Not started |
| 5 | Plugin Management | Not started |
| 6 | Tools Management | Not started |
| 7 | MCP Testing Console | Not started |
| 8 | Token & Security Management | Not started |
| 9 | Logging & Monitoring | Not started |
| 10 | Notifications | Not started |
| 11 | Settings & Environment Management | Not started |
| 12 | User & Role Management | Not started |
| 13 | AXON System Integration | Not started |
| 14 | DevOps & CI/CD | Not started |
| 15 | Orchestrator & AI Testing Pages | Not started |

Always check `IMPLEMENT.md` for the full checklist of each phase before marking it done.

---

## Common Mistakes to Avoid

- Do **not** import from `apps/api` inside `apps/web` or vice versa — use `@axon/*` packages for shared code
- Do **not** call external AXON APIs (port 8200, 8000–8111) directly from the frontend — always proxy through `apps/api`
- Do **not** use `process.env` directly in frontend code — use `next.config.ts` `env` or `publicRuntimeConfig`
- Do **not** skip `JwtAuthGuard` + `RolesGuard` on any new NestJS endpoint that touches user data
- Do **not** return the full Prisma model from controllers — always use a response DTO
- Do **not** create a new shadcn/ui component in `apps/web` if it already exists in `packages/ui`
- Do **not** use `fetch()` directly in the frontend — always use the shared Axios client
- Do **not** write tests that hit real LLM APIs — use `TestModel` or `FunctionModel` from pydantic-ai
