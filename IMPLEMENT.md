# AXON Admin WebApp — Implementation Plan

## Decisions

| Decision | Choice |
|---|---|
| Monorepo | Nx |
| Backend | NestJS + TypeScript + Prisma |
| Frontend | Next.js 15 + React 19 + TypeScript + Tailwind CSS + shadcn/ui |
| Database | PostgreSQL @ 202.71.1.13:5435 / user: axon / password: axon / schema: axon_admin |
| Cache / Queue | Redis + BullMQ |
| Auth | JWT + Refresh Tokens + Google/GitHub OAuth + RBAC |
| Integration | Admin platform for the AXON system (manages AXON agents, MCP servers, tools) |
| Build Strategy | Full build in parallel phases |
| Workspace Root | /u01/axon-admin |

---

## AXON System Context

- Existing PostgreSQL schemas: `axon_brain`, `axon_plan`, `axon_agents`, `axon_mcp`, `axon_board`
- Existing Control Tower: FastAPI (port 8200) + Next.js (port 3010) — basic, to be superseded
- 10 MCP domain agents, 10+ MCP servers, 100+ tools
- HITL (Human-in-the-Loop) approval workflows via `axon_board.hitl_queue`
- Experience Ledger (self-learning) via `axon_brain.experience_records`

---

## Folder Structure

```
/u01/axon-admin/
  apps/
    web/          # Next.js 15 frontend (port 3000)
    api/          # NestJS backend (port 3001)
  packages/
    ui/           # shadcn/ui component library
    types/        # Shared TypeScript types
    config/       # Shared ESLint + TS configs
    mcp-sdk/      # MCP protocol client wrapper
    shared/       # Shared utilities / validators
  infra/
    docker/       # Dockerfiles (multi-stage)
    k8s/          # Kubernetes manifests
    nginx/        # Reverse proxy config
  prisma/
    schema.prisma # axon_admin schema
    migrations/
  .github/
    workflows/    # CI/CD pipelines
  docker-compose.yml
  .env.example
  nx.json
  package.json
```

---

## Phase 1 — Foundation *(all steps can run in parallel)*

- [ ] Initialize Nx workspace with `@nx/next` + `@nx/nest` generators
- [ ] Scaffold `apps/api` — NestJS with AppModule, health endpoint, Swagger (`/api/docs`), Helmet, CORS, Throttler
- [ ] Scaffold `apps/web` — Next.js 15 (app router), Tailwind CSS, shadcn/ui init, next-themes
- [ ] Create `packages/types` — shared TypeScript interfaces (Plugin, Tool, Token, Log, User, Role, etc.)
- [ ] Create `packages/ui` — shadcn/ui component wrappers + custom design tokens
- [ ] Create `packages/config` — shared ESLint + TypeScript + Prettier configs
- [ ] Create `packages/mcp-sdk` — wraps `@modelcontextprotocol/sdk` for type-safe tool invocation (HTTP, SSE, WebSocket)
- [ ] Create `packages/shared` — shared validators (Zod schemas), date utils, formatting helpers
- [ ] Create `prisma/schema.prisma` with full `axon_admin` schema (all tables listed below)
- [ ] Create `docker-compose.yml` — Redis + API + Web + Nginx (PostgreSQL is remote)
- [ ] Create root `.env.example` and per-app env templates

**Deliverable:** `nx serve api` runs; `nx serve web` runs; Swagger accessible at `http://localhost:3001/api/docs`; Prisma connects to `axon_admin` schema.

---

## Phase 2 — Authentication System *(depends on Phase 1)*

### Backend (NestJS)
- [ ] `AuthModule` — JWT access token (15min TTL) + refresh token rotation (7d TTL), Passport.js strategies
- [ ] `UsersModule` — CRUD, password hashing (bcrypt), email verification
- [ ] `RolesModule` — Super Admin / Admin / Operator / Viewer
- [ ] `PermissionsModule` — fine-grained resource+action permissions
- [ ] Passport.js `GoogleStrategy` + `GitHubStrategy` (OAuth 2.0)
- [ ] TOTP-based 2FA (authenticator app) — `speakeasy` library
- [ ] `@UseGuards(JwtAuthGuard, RolesGuard)` decorators on all protected endpoints
- [ ] Session management — active sessions list, remote revoke

### Frontend (Next.js)
- [ ] NextAuth.js config — Google + GitHub providers, JWT session strategy
- [ ] Login page — React Hook Form + Zod, "Remember me", OAuth buttons
- [ ] Register page — email/password with strength meter
- [ ] Forgot Password page — email OTP reset flow
- [ ] Auth middleware (`middleware.ts`) — protect all non-public routes
- [ ] `usePermission(action, resource)` hook for conditional UI rendering
- [ ] `useRole()` hook for role-based component visibility

### Prisma Tables
- `users` (id uuid, email, name, avatar, password_hash, is_verified, is_active, mfa_secret, created_at, updated_at, deleted_at)
- `roles` (id, name, description)
- `permissions` (id, resource, action, description)
- `user_roles` (user_id, role_id)
- `role_permissions` (role_id, permission_id)
- `sessions` (id, user_id, token_hash, ip, user_agent, expires_at, created_at)
- `refresh_tokens` (id, user_id, token_hash, expires_at, revoked_at, created_at)

---

## Phase 3 — Core UI Layout *(can run parallel with Phase 2)*

- [ ] Sidebar navigation — collapsible (icon-only mode), route highlighting, Lucide icons, nested items
- [ ] Mobile drawer — shadcn/ui `Sheet`, hamburger toggle, swipe gesture support
- [ ] Header — user avatar dropdown, notifications bell with badge count, dark/light theme toggle
- [ ] Dark/light mode — `next-themes`, CSS variables for all color tokens
- [ ] Breadcrumb system — auto-generated from app router segment structure
- [ ] Global toast notifications — `sonner` library
- [ ] Loading skeletons — per-page shimmer placeholders
- [ ] Error boundaries — per-section with retry button
- [ ] Responsive grid layout — sidebar pinned on desktop, collapsed on tablet, drawer on mobile

---

## Phase 4 — Dashboard & Analytics *(depends on Phase 3)*

### Backend (NestJS)
- [ ] `DashboardModule` — metrics endpoint aggregating from `axon_board`, `axon_mcp`, `axon_plan`, `axon_admin`
- [ ] Read-only Prisma client for existing AXON schemas (second datasource)
- [ ] WebSocket gateway — broadcast live metric updates every 5s via Redis pub/sub

### Frontend (Next.js)
- [ ] 9 KPI widgets: plugins count, active tools, request volume, failed requests, token usage, system health, response time, error rate, user activity
- [ ] TanStack Query polling (30s interval) for KPI data
- [ ] Recharts panels:
  - Daily usage — line chart (7-day window)
  - Tool execution — grouped bar chart (by category)
  - API latency — area chart with P50/P95/P99 bands
  - Error analytics — donut chart by error type
- [ ] Real-time WebSocket hook (`useLiveMetrics`) for instant widget refresh
- [ ] AXON system status banner — shows health of all 10 domain agents

---

## Phase 5 — Plugin Management *(depends on Phase 2)*

### Backend (NestJS)
- [ ] `PluginsModule` — CRUD, pagination, filtering, sorting
- [ ] Health check endpoint — proxy to plugin MCP server `/health`
- [ ] Restart trigger — sends restart command to plugin process
- [ ] Import/export config — JSON serialization of plugin + env + headers
- [ ] Plugin group + tag management

### Frontend (Next.js)
- [ ] Plugins list page — TanStack Table with column sorting, search, group/tag filters, status badge
- [ ] Plugin detail/edit page:
  - Form: name, description, endpoint URL, auth method, timeout, retry policy
  - Monaco editor for headers (JSON) and environment variables (JSON)
  - Health status badge with last-check timestamp
  - Version history list with rollback button
  - Enable/disable toggle
- [ ] Import config modal (JSON upload) + export button
- [ ] Bulk actions: enable/disable/delete selected

### Prisma Tables
- `plugins` (id, name, description, endpoint, auth_method, api_key_encrypted, headers_json, timeout_ms, retry_policy_json, status, version, health_status, group_id, created_by, created_at, updated_at, deleted_at)
- `plugin_groups` (id, name, description, color)
- `plugin_tags` (id, name)
- `plugin_tag_map` (plugin_id, tag_id)
- `plugin_env_vars` (id, plugin_id, key, value_encrypted, is_secret)

---

## Phase 6 — Tools Management *(can run parallel with Phase 5)*

### Backend (NestJS)
- [ ] `ToolsModule` — tool registry CRUD, JSON schema validation (Ajv), execution proxy
- [ ] Tool versioning — immutable version records, active version pointer
- [ ] Execution proxy — calls target MCP server tool, captures input/output
- [ ] Execution log storage — timestamped, searchable

### Frontend (Next.js)
- [ ] Tools list — category chips, tag filter, search, sortable TanStack Table
- [ ] Tool detail page:
  - Monaco editor (JSON) for input schema + output schema with live Ajv validation
  - Execution test panel — fill inputs, run, see output (same page, no navigation)
  - Version history with diff viewer (side-by-side Monaco diff)
  - Permission settings (which roles can execute)
- [ ] Tool categories management page

### Prisma Tables
- `tools` (id, name, description, category_id, plugin_id, input_schema_json, output_schema_json, active_version_id, created_by, created_at, updated_at, deleted_at)
- `tool_versions` (id, tool_id, version, input_schema_json, output_schema_json, changelog, created_by, created_at)
- `tool_categories` (id, name, description, icon, color)
- `tool_execution_logs` (id, tool_id, version_id, user_id, input_json, output_json, status, duration_ms, error_message, created_at)

---

## Phase 7 — MCP Testing Console *(depends on Phase 6)*

### Backend (NestJS)
- [ ] `TestingModule` — execution proxy supporting REST, SSE, WebSocket, MCP protocol
- [ ] Streaming relay — SSE and WebSocket responses piped to client in real time
- [ ] Test collection storage — save named collections with multiple requests
- [ ] Execution history — paginated, filterable by date/status/tool

### Frontend (Next.js)
- [ ] Request builder panel:
  - Protocol selector (REST / SSE / WebSocket / MCP)
  - URL input with variable interpolation (`{{base_url}}`)
  - Headers editor (key-value table)
  - Body editor (Monaco JSON with schema autocomplete)
- [ ] Response viewer panel:
  - Formatted JSON with syntax highlighting
  - SSE streaming: events appear as they arrive
  - WebSocket: message log with send/receive indicators
  - Status, duration, size metadata
- [ ] Test collections sidebar — create, rename, delete, drag-and-drop order
- [ ] Execution history timeline — click to replay any past execution
- [ ] Retry button with configurable delay

### Prisma Tables
- `test_collections` (id, name, description, created_by, created_at, updated_at)
- `test_requests` (id, collection_id, name, protocol, url, headers_json, body_json, sort_order, created_at, updated_at)
- `test_executions` (id, request_id, user_id, response_status, response_body, duration_ms, error_message, created_at)

---

## Phase 8 — Token & Security Management *(depends on Phase 2)*

### Backend (NestJS)
- [ ] `TokensModule` — CRUD for API tokens with AES-256-GCM encryption (Node.js `crypto`)
- [ ] Token values never returned in plaintext after creation — masked as `sk-****...****`
- [ ] Token rotation scheduler — BullMQ job, configurable rotation interval
- [ ] IP restriction list per token — enforced in `JwtAuthGuard`
- [ ] Rate limiting — NestJS `@nestjs/throttler` per-IP and per-user-token
- [ ] Audit middleware — logs every state-changing request (actor, action, resource, before/after, IP)

### Frontend (Next.js)
- [ ] Token vault page — masked display, copy-to-clipboard (one-time reveal on creation), rotation button, expiry countdown badge
- [ ] Create token modal — name, expiry, IP whitelist, permission scope selector
- [ ] Audit trail table — actor, action, resource, IP, timestamp; filter by date range, actor, action type; export CSV
- [ ] Security overview widgets — token expiry warnings, failed auth attempts, blocked IPs

### Prisma Tables
- `api_tokens` (id, user_id, name, token_hash, token_prefix, encrypted_value, expires_at, last_used_at, ip_whitelist, scopes_json, created_at, revoked_at)
- `audit_logs` (id, user_id, action, resource_type, resource_id, before_json, after_json, ip, user_agent, created_at)

---

## Phase 9 — Logging & Monitoring *(can run parallel with Phase 8)*

### Backend (NestJS)
- [ ] `LogsModule` — Winston/Pino structured logging; logs stored to DB + console + file
- [ ] Log levels: ERROR, WARN, INFO, HTTP, DEBUG
- [ ] WebSocket gateway — Redis pub/sub → BullMQ → WebSocket broadcast for real-time log stream
- [ ] OpenTelemetry exporter — traces and metrics in OTLP format
- [ ] Log export endpoint — filtered CSV/JSON download

### Frontend (Next.js)
- [ ] Real-time log viewer:
  - TanStack Virtual for virtualized infinite scroll (millions of rows, no lag)
  - Level filter chips (ERROR / WARN / INFO / HTTP / DEBUG)
  - Text search (debounced, highlights matches)
  - Date range picker
  - WebSocket toggle (live vs. historical)
  - Auto-scroll-to-bottom toggle
  - Export filtered logs button
- [ ] Audit log page — same viewer with audit-specific filters (actor, action, resource)
- [ ] User activity page — per-user session timeline

### Prisma Tables
- `system_logs` (id, level, message, context_json, trace_id, span_id, created_at)
- `execution_logs` (id, plugin_id, tool_id, user_id, status, input_json, output_json, duration_ms, error_message, created_at)

---

## Phase 10 — Notifications *(can run parallel with Phase 9)*

### Backend (NestJS)
- [ ] `NotificationsModule` — in-app, email (Nodemailer + SMTP), Slack webhook, Discord webhook, Telegram bot
- [ ] BullMQ queues per channel for async delivery with retries
- [ ] Notification rules engine — configurable trigger conditions per event type
- [ ] Trigger events: plugin failure, MCP disconnect, auth failure, high latency (> threshold), token expiry (< 7d), security alert

### Frontend (Next.js)
- [ ] Notification dropdown — bell icon in header, realtime count via WebSocket, "Mark all read" button
- [ ] Full notifications page — list with type icon, message, timestamp, read/unread state, delete
- [ ] Notification rules settings — add/edit/delete rules, per-rule channel + threshold configuration
- [ ] Channel config page — SMTP credentials, Slack webhook URL, Discord webhook URL, Telegram bot token

### Prisma Tables
- `notifications` (id, user_id, type, title, message, data_json, is_read, read_at, created_at)
- `notification_rules` (id, event_type, condition_json, channels_json, is_active, created_by, created_at, updated_at)

---

## Phase 11 — Settings & Environment Management *(depends on Phase 2)*

### Backend (NestJS)
- [ ] `SettingsModule` — typed settings CRUD with namespace isolation
- [ ] `EnvironmentsModule` — dev/staging/production environment configs
- [ ] `FeatureFlagsModule` — boolean/string/number flags with per-environment overrides

### Frontend (Next.js)
- [ ] Settings page (tabbed):
  - **General** — app name, logo, timezone, date format
  - **Security** — CORS origins, session timeout, 2FA enforcement, password policy
  - **API Gateway** — base URLs, global timeout, default retry policy
  - **MCP** — default MCP server URL, protocol preferences
  - **Notifications** — global on/off, channel defaults
  - **Branding** — primary color, logo upload, custom CSS
  - **Feature Flags** — toggle list with environment overrides
- [ ] Environment manager — create/edit/delete environments, switch active context, encrypted variable store
- [ ] Environment variable editor — key/value table with secret masking toggle

### Prisma Tables
- `settings` (id, namespace, key, value_json, updated_by, updated_at)
- `environments` (id, name, slug, is_active, created_at)
- `env_variables` (id, environment_id, key, value_encrypted, is_secret, created_at, updated_at)
- `feature_flags` (id, name, key, type, default_value_json, is_active, created_at, updated_at)
- `feature_flag_overrides` (id, flag_id, environment_id, value_json)

---

## Phase 12 — User & Role Management *(depends on Phase 2)*

### Frontend (Next.js)
- [ ] Users table — search, filter by role/status, invite by email, role assignment dropdown, status toggle, 2FA indicator
- [ ] Invite user modal — email input, role selector, custom message
- [ ] User detail page — profile info, role history, active sessions list with remote revoke button
- [ ] Role management page — create/edit roles, permission matrix (checkbox grid: resource × action)
- [ ] User profile page — own profile, password change, 2FA setup (QR code modal), active sessions

---

## Phase 13 — AXON System Integration *(depends on Phase 4)*

### Backend (NestJS)
- [ ] `AxonModule` — read-only datasource for existing AXON schemas
- [ ] Agent status endpoint — aggregates from `axon_agents`, `axon_brain.orchestrator_logs`
- [ ] HITL approval endpoint — reads `axon_board.hitl_queue`, proxies approve/reject to Control Tower API
- [ ] Experience Ledger endpoint — reads `axon_brain.experience_records` with pagination + search

### Frontend (Next.js)
- [ ] AXON Agents page — 10 domain agent cards with health status, last activity, pending proposals count
- [ ] HITL Approval Queue page — pending decisions table, approve/reject buttons, escalation history
- [ ] Experience Ledger viewer — searchable record list, semantic similarity score, replay button
- [ ] Supply Chain Plan viewer — reads `axon_plan` for demand/supply/allocation overview

---

## Phase 14 — DevOps & CI/CD *(start early, build incrementally)*

- [ ] `apps/api/Dockerfile` — multi-stage: builder (tsc) → runner (node:alpine)
- [ ] `apps/web/Dockerfile` — multi-stage: builder (next build) → runner (standalone output)
- [ ] `docker-compose.yml` — services: redis, api, web, nginx (postgres is remote)
- [ ] `infra/nginx/nginx.conf` — `/ → web:3000`, `/api → api:3001`, WebSocket upgrade headers
- [ ] `.github/workflows/ci.yml` — lint → test → build → docker push (on merge to main)
- [ ] `.github/workflows/deploy.yml` — pull new image + restart (on release tag)
- [ ] `infra/k8s/` — Deployment, Service, ConfigMap, Secret, HPA for api + web
- [ ] `.env.example` — all required environment variables with descriptions

---

## Phase 15 — Orchestrator & AI Testing Pages *(depends on Phases 7 and 13)*

### Overview

Two new full-stack pages purpose-built for testing and observing the AXON AI pipelines:

| Page | Route | Purpose |
|---|---|---|
| Orchestrator Pipeline Tester | `/testing/orchestrator` | Send a request through the AXON orchestrator and see each stage's input/output in real time |
| Pydantic AI Agent Tester | `/testing/pydantic-ai` | Run Pydantic AI agents in TestModel / FunctionModel / Real mode with full message inspection |

---

### Page 1 — Orchestrator Pipeline Tester (`/testing/orchestrator`)

#### What It Tests

The AXON orchestrator processes a user request through **6 sequential stages**, each delegated to a Pydantic AI agent or LangGraph node. This page drives the orchestrator's main entrypoint (`POST /api/orchestrator/run`) and streams back each stage's input payload, output payload, timing, and token usage.

#### Stage Pipeline (Input → Output Detail)

| # | Stage | Input | Output |
|---|---|---|---|
| 1 | **Intent Analysis** | `{ "prompt": str, "context": obj, "user_id": str }` | `{ "intent": str, "entities": [...], "confidence": float, "language": str }` |
| 2 | **Plan Generation** | `{ "intent": str, "entities": [...], "available_agents": [...], "available_tools": [...] }` | `{ "plan_id": str, "steps": [{ "agent": str, "tool": str, "params": obj, "depends_on": [] }], "estimated_tokens": int }` |
| 3 | **Tool Selection & Validation** | `{ "plan": obj, "tool_schemas": { "tool_id": { "input_schema": obj } } }` | `{ "resolved_tools": [{ "tool_id": str, "plugin_id": str, "endpoint": str, "validated_params": obj }], "skipped": [] }` |
| 4 | **MCP Execution** | `{ "resolved_tools": [...], "thread_id": str, "hitl_required": bool }` | `{ "results": [{ "tool_id": str, "status": "ok\|error\|hitl_pending", "output": obj, "duration_ms": int }] }` |
| 5 | **Output Validation** | `{ "results": [...], "plan": obj, "retry_budget": int }` | `{ "valid": bool, "score": float, "issues": [...], "retry_step": int\|null, "final_results": [...] }` |
| 6 | **Response Assembly** | `{ "final_results": [...], "intent": str, "plan_id": str }` | `{ "response": str, "structured_output": obj\|null, "token_usage": { "input": int, "output": int, "total": int }, "duration_ms": int }` |

#### Backend (NestJS)

- [ ] `OrchestratorModule` — `POST /api/orchestrator/run` accepts input and returns a `run_id`
- [ ] `GET /api/orchestrator/runs/:id` — full run record with all stage snapshots
- [ ] `GET /api/orchestrator/runs/:id/stream` — SSE endpoint; emits one JSON event per stage as it completes
- [ ] `GET /api/orchestrator/runs` — paginated run history with status, duration, token totals
- [ ] `DELETE /api/orchestrator/runs/:id` — delete a run record
- [ ] Stage execution — delegates to Python microservice at Control Tower (port 8200) via HTTP, receiving stage snapshots
- [ ] HITL intercept — if Stage 4 returns `hitl_pending`, pause run and insert into `axon_board.hitl_queue`; resume on approval via websocket signal
- [ ] Run metadata attached to each stage: `started_at`, `ended_at`, `duration_ms`, `token_usage`

#### Frontend (Next.js)

**Left Panel — Request Builder**
- [ ] Model selector dropdown (GPT-5.2 / Claude Sonnet / Gemini / etc.)
- [ ] Prompt textarea (multi-line, resizable)
- [ ] Context JSON editor (Monaco, collapsible, pre-filled with `{}`)
- [ ] Thread ID field (auto-generated UUID, editable for session continuity)
- [ ] Options toggles: HITL enabled, dry-run mode, verbose mode
- [ ] Run button → calls `POST /api/orchestrator/run` → opens SSE stream for `run_id`
- [ ] Clear / Reset button

**Right Panel — Pipeline Stage Viewer**
- [ ] Vertical timeline of 6 stage cards, each containing:
  - Stage number badge + stage name
  - Status chip: `pending` (grey) → `running` (blue pulse) → `done` (green) → `error` (red) → `hitl_pending` (amber)
  - Duration badge (ms) and token count badge — appear on completion
  - **Input accordion** (collapsed by default): Monaco read-only JSON viewer showing exact input payload sent to this stage
  - **Output accordion** (collapsed by default): Monaco read-only JSON viewer showing exact output payload returned
  - **Error accordion** (only on error): stack trace / error message
- [ ] Stages animate open one-by-one as SSE events arrive (Framer Motion `AnimatePresence`)
- [ ] HITL intercept UI:
  - Stage 4 card shows amber "Awaiting Approval" badge
  - Inline approve / reject buttons with optional note field
  - On approve → sends `POST /api/mcp/hitl/:id/approve` → pipeline resumes, card turns green
- [ ] Bottom summary bar: total duration, total tokens (input + output), plan_id, run_id copy button

**Toolbar**
- [ ] Run history dropdown — last 20 runs with status dot, click to reload any past run's stage data
- [ ] Export button — downloads full run JSON (all 6 stage inputs + outputs + metadata)

#### Prisma Tables
- `orchestrator_runs` (id uuid PK, user_id, prompt, context_json, model, thread_id, status, total_duration_ms, total_input_tokens, total_output_tokens, plan_id, created_at, updated_at)
- `orchestrator_stages` (id uuid PK, run_id FK, stage_number int, stage_name, status, input_json, output_json, error_message, started_at, ended_at, duration_ms, input_tokens, output_tokens)

---

### Page 2 — Pydantic AI Agent Tester (`/testing/pydantic-ai`)

#### What It Tests

Allows developers to select any registered Pydantic AI agent, configure the test mode (TestModel, FunctionModel, or real model), send a prompt with dependencies, and inspect the full message exchange — UserPromptParts, ToolCallParts, ToolReturnParts, and the final structured or text output.

#### Backend (NestJS)

- [ ] `PydanticAiModule` — bridges to a Python sidecar (FastAPI, port 8210) that hosts registered agent definitions
- [ ] `GET /api/pydantic-ai/agents` — list all registered agents (name, deps_type, output_type, tools)
- [ ] `GET /api/pydantic-ai/agents/:name` — agent schema: tool names, input schemas, output schema, instructions
- [ ] `POST /api/pydantic-ai/runs` — body: `{ agent, model_mode, prompt, deps_json, usage_limits, model_settings }` → executes on Python sidecar → returns `run_id`
- [ ] `GET /api/pydantic-ai/runs/:id/stream` — SSE stream; emits one event per message in the exchange as they complete
- [ ] `GET /api/pydantic-ai/runs/:id` — full run record with all messages and output
- [ ] `GET /api/pydantic-ai/runs` — paginated history, filterable by agent + mode + status
- [ ] Python sidecar (`apps/ai-tester/main.py`) — FastAPI; loads agent registry, executes with `capture_run_messages()`, streams via SSE

**Model Modes Supported**

| Mode | Behaviour |
|---|---|
| `test_model` | Uses `TestModel` — zero cost, auto-generates valid tool args from schema |
| `function_model` | User supplies a Python snippet that acts as the model function |
| `real_model` | Uses the actual model specified — incurs token cost |

#### Frontend (Next.js)

**Left Panel — Agent & Run Configuration**
- [ ] **Agent selector** — searchable dropdown listing all registered agents from `GET /api/pydantic-ai/agents`
- [ ] **Agent info card** (loads on selection):
  - Output type schema (pretty-printed JSON)
  - Registered tools list (name + description chips)
  - Instructions preview (truncated, expandable)
- [ ] **Model mode radio** — `TestModel` / `FunctionModel` / `Real Model`
- [ ] **Model picker** (shown when mode = Real Model) — dropdown (GPT-5.2, Claude, Gemini…)
- [ ] **Temperature slider** (0.0–1.0, step 0.1; shown for Real/FunctionModel)
- [ ] **Prompt textarea** — multi-line
- [ ] **Dependencies JSON** — Monaco editor pre-filled with `{}`, schema-aware if deps_type is known
- [ ] **FunctionModel snippet editor** — Monaco Python editor (shown when mode = FunctionModel):
  - Pre-filled with template: `def model_fn(messages, info): return ModelResponse(parts=[TextPart("hello")])`
  - Sent to Python sidecar for execution
- [ ] **Usage limits panel** (collapsible):
  - `request_limit` number input (default 10)
  - `response_tokens_limit` number input (default 2000)
  - `tool_calls_limit` number input (default 20)
- [ ] **Run button** + **Cancel button**

**Right Panel — Message Exchange Viewer**

Displays every message in the exchange as SSE events arrive, building the list top-to-bottom in real time:

| Message Part | Card Style | Fields Shown |
|---|---|---|
| `UserPromptPart` | Blue left-border | `content`, `timestamp`, `run_id`, `conversation_id` |
| `ModelRequest` | Neutral | `instructions` (if present), list of parts inside |
| `ToolCallPart` | Purple left-border | `tool_name`, `args` (Monaco JSON), `tool_call_id` |
| `ToolReturnPart` | Teal left-border | `tool_name`, `content`, `tool_call_id`, `timestamp` |
| `ModelResponse` | Dark border | `model_name`, `usage` (input/output tokens), list of parts inside |
| `TextPart` | Green left-border | `content` text |

- [ ] Each card is a collapsible accordion — collapsed shows type badge + summary; expanded shows all fields
- [ ] Real-time streaming: cards animate in one-by-one as SSE events arrive (`AnimatePresence`)
- [ ] **Final Output card** — always at bottom; shows:
  - Structured output (Monaco read-only JSON for Pydantic model output)
  - Plain text output (for `output_type=str`)
  - `usage.requests`, `usage.input_tokens`, `usage.output_tokens`
  - Total run `duration_ms`
- [ ] **Error card** — appears if `UnexpectedModelBehavior` raised; shows error message + cause + captured messages up to that point

**Top Toolbar**
- [ ] Run history dropdown — last 20 runs per agent, click to reload full exchange
- [ ] Copy run JSON button — downloads all messages + output as JSON
- [ ] `ALLOW_MODEL_REQUESTS` safety indicator badge — shows "TestModel Safe" (green) vs "Real Model" (amber)

#### Prisma Tables
- `ai_agent_runs` (id uuid PK, user_id, agent_name, model_mode, model_name, prompt, deps_json, usage_limits_json, model_settings_json, status, output_json, error_message, total_duration_ms, input_tokens, output_tokens, created_at)
- `ai_agent_messages` (id uuid PK, run_id FK, sequence_order int, message_kind, part_kind, content_json, tool_name, tool_call_id, model_name, input_tokens, output_tokens, timestamp)

---

## API Routes (Phase 15 additions)

| Method | Route | Description |
|---|---|---|
| POST | /api/orchestrator/run | Start an orchestrator pipeline run |
| GET | /api/orchestrator/runs | Paginated run history |
| GET | /api/orchestrator/runs/:id | Full run with all stage snapshots |
| GET | /api/orchestrator/runs/:id/stream | SSE — stage completion events |
| DELETE | /api/orchestrator/runs/:id | Delete run record |
| GET | /api/pydantic-ai/agents | List all registered agents |
| GET | /api/pydantic-ai/agents/:name | Agent schema (tools, output type, instructions) |
| POST | /api/pydantic-ai/runs | Start an agent test run |
| GET | /api/pydantic-ai/runs | Paginated agent run history |
| GET | /api/pydantic-ai/runs/:id | Full run with all messages |
| GET | /api/pydantic-ai/runs/:id/stream | SSE — message exchange events |

---

## Database Schema Summary (axon_admin)

| Table | Purpose |
|---|---|
| users | Admin user accounts |
| roles | Super Admin / Admin / Operator / Viewer |
| permissions | Resource × Action permission records |
| user_roles | M:N user-to-role assignment |
| role_permissions | M:N role-to-permission assignment |
| sessions | Active login sessions |
| refresh_tokens | Refresh token rotation store |
| api_tokens | Encrypted API key vault |
| audit_logs | Full audit trail of state changes |
| plugins | MCP plugin registry |
| plugin_groups | Plugin grouping |
| plugin_tags | Plugin tagging |
| plugin_tag_map | M:N plugin-to-tag |
| plugin_env_vars | Per-plugin encrypted env vars |
| tools | MCP tool registry |
| tool_versions | Immutable tool version history |
| tool_categories | Tool categorization |
| tool_execution_logs | Tool run history |
| test_collections | Named test suites |
| test_requests | Individual test requests |
| test_executions | Execution history |
| notifications | In-app notification inbox |
| notification_rules | Trigger rules per event type |
| system_logs | Structured application logs |
| execution_logs | Plugin/tool execution records |
| settings | Namespaced key-value config store |
| environments | dev/staging/production environments |
| env_variables | Per-environment encrypted variables |
| feature_flags | Feature flag definitions |
| feature_flag_overrides | Per-environment flag overrides |
| orchestrator_runs | Orchestrator pipeline run records |
| orchestrator_stages | Per-stage input/output snapshots for each run |
| ai_agent_runs | Pydantic AI agent test run records |
| ai_agent_messages | Full message exchange for each agent run |

---

## API Routes

| Method | Route | Description |
|---|---|---|
| POST | /api/auth/login | Email/password login |
| POST | /api/auth/register | New account |
| POST | /api/auth/refresh | Refresh access token |
| POST | /api/auth/logout | Revoke session |
| GET | /api/auth/google | OAuth redirect |
| GET | /api/auth/github | OAuth redirect |
| GET/PUT | /api/users/me | Own profile |
| GET/POST/PUT/DELETE | /api/users | User management |
| GET/POST/PUT/DELETE | /api/roles | Role management |
| GET/POST/PUT/DELETE | /api/plugins | Plugin CRUD |
| POST | /api/plugins/:id/restart | Restart plugin |
| GET | /api/plugins/:id/health | Health check |
| GET/POST/PUT/DELETE | /api/tools | Tool CRUD |
| POST | /api/tools/:id/execute | Execute tool |
| GET | /api/tools/:id/versions | Version history |
| GET/POST/DELETE | /api/tokens | API token management |
| POST | /api/tokens/:id/rotate | Rotate token |
| GET | /api/logs | Paginated log query |
| GET | /api/logs/export | Export logs (CSV/JSON) |
| GET | /api/dashboard/metrics | KPI metrics |
| GET | /api/dashboard/charts | Chart data |
| GET/POST/PUT/DELETE | /api/notifications | Notification management |
| GET/POST/PUT/DELETE | /api/settings | Settings CRUD |
| GET/POST/PUT/DELETE | /api/environments | Environment management |
| POST | /api/testing/execute | Execute test request |
| GET/POST | /api/testing/collections | Test collections |
| GET | /api/mcp/agents | AXON agent status |
| GET/POST | /api/mcp/hitl | HITL approval queue |
| POST | /api/orchestrator/run | Start an orchestrator pipeline run |
| GET | /api/orchestrator/runs | Paginated run history |
| GET | /api/orchestrator/runs/:id | Full run with all stage snapshots |
| GET | /api/orchestrator/runs/:id/stream | SSE — stage completion events |
| DELETE | /api/orchestrator/runs/:id | Delete run record |
| GET | /api/pydantic-ai/agents | List all registered agents |
| GET | /api/pydantic-ai/agents/:name | Agent schema (tools, output type, instructions) |
| POST | /api/pydantic-ai/runs | Start an agent test run |
| GET | /api/pydantic-ai/runs | Paginated agent run history |
| GET | /api/pydantic-ai/runs/:id | Full run with all messages |
| GET | /api/pydantic-ai/runs/:id/stream | SSE — message exchange events |
| WS | ws://host/ws | Real-time: logs, metrics, notifications |
| GET | /api/docs | Swagger UI |

---

## Security Checklist

- [ ] Helmet.js — security headers on all NestJS responses
- [ ] NestJS Throttler — rate limiting per IP (100 req/min) and per token (1000 req/min)
- [ ] AES-256-GCM encryption — all tokens, API keys, secrets at rest
- [ ] bcrypt (rounds=12) — password hashing
- [ ] Prisma parameterized queries — no raw SQL injection risk
- [ ] HttpOnly + SameSite=Strict cookies — refresh token storage
- [ ] CSRF token — custom header check on state-changing routes
- [ ] class-validator + Zod — input validation at API boundary and frontend forms
- [ ] `@Roles()` + `@Permissions()` guards — every protected endpoint decorated
- [ ] Secret masking — encrypted values never returned in plaintext after creation
- [ ] HTTPS-only — enforced in Nginx + HSTS header
- [ ] Content Security Policy — configured via Helmet
- [ ] Dependency scanning — npm audit in CI pipeline

---

## Verification Checklist

- [ ] `nx build all` — zero TypeScript errors across all apps and packages
- [ ] `nx test all` — Jest unit tests pass (Auth, Plugins, Tools, Tokens modules)
- [ ] `npx prisma migrate dev` — clean migration applies to `axon_admin` schema
- [ ] `docker-compose up` — all services healthy; Nginx routes correctly
- [ ] Browser: Google/GitHub OAuth login → lands on Dashboard with live KPI widgets
- [ ] Browser: Create plugin → appears in list → edit JSON config → save → health check shows green
- [ ] Browser: MCP Testing Console → execute tool → response rendered → entry in history
- [ ] Browser: Real-time log viewer shows new entries without page refresh
- [ ] Browser: Create API token → masked display → rotation works → revocation works
- [ ] API: `GET /api/docs` — Swagger UI shows all endpoints with schemas
- [ ] WebSocket: `wscat -c ws://localhost:3001/ws` — logs stream after authentication
- [ ] Security: `npm audit` — zero high/critical vulnerabilities
