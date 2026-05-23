---
name: shared-types
description: Define and maintain shared TypeScript types, interfaces, Zod schemas, and constants for the AXON Admin monorepo. Use when adding new shared types used across the API and frontend, defining API response contracts, creating validation schemas, or establishing shared enums and constants.
---

# Shared Types — AXON Admin

## Package Location

All shared types live in `packages/types/src/` and are imported as `@axon/types`.

## File Structure

```
packages/types/src/
  index.ts          # Re-exports everything
  auth.ts           # Auth, User, Role, Session types
  plugin.ts         # Plugin, PluginGroup, PluginTag types
  tool.ts           # Tool, ToolVersion, ToolCategory types
  testing.ts        # TestCollection, TestRequest, TestExecution types
  token.ts          # ApiToken types
  log.ts            # SystemLog, AuditLog, ExecutionLog types
  notification.ts   # Notification, NotificationRule types
  settings.ts       # Setting, Environment, FeatureFlag types
  dashboard.ts      # KPI metrics, chart data types
  mcp.ts            # MCP protocol types
  common.ts         # Pagination, API response, common enums
  zod/              # Zod validation schemas (frontend forms + backend fallback)
    auth.schemas.ts
    plugin.schemas.ts
    tool.schemas.ts
```

## Step 1: Common Types

```typescript
// packages/types/src/common.ts

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T = void> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

export interface SelectOption {
  label: string;
  value: string;
  description?: string;
  disabled?: boolean;
}

export type SortOrder = 'asc' | 'desc';

export interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: SortOrder;
}

export type Status = 'active' | 'inactive' | 'healthy' | 'unhealthy' | 'degraded' | 'unknown' | 'pending' | 'error';
export type LogLevel = 'ERROR' | 'WARN' | 'INFO' | 'HTTP' | 'DEBUG';
export type Protocol = 'REST' | 'SSE' | 'WebSocket' | 'MCP';
```

## Step 2: Auth Types

```typescript
// packages/types/src/auth.ts

export enum Role {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  OPERATOR = 'operator',
  VIEWER = 'viewer',
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  isVerified: boolean;
  isActive: boolean;
  mfaEnabled: boolean;
  roles: Role[];
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: string;
  userId: string;
  ip: string | null;
  userAgent: string | null;
  expiresAt: string;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  user: User;
}

export interface LoginDto {
  email: string;
  password: string;
  rememberMe?: boolean;
  totpCode?: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  name: string;
}
```

## Step 3: Plugin Types

```typescript
// packages/types/src/plugin.ts
import type { Status } from './common';

export type AuthMethod = 'none' | 'bearer' | 'api_key' | 'basic' | 'custom';

export interface Plugin {
  id: string;
  name: string;
  description: string | null;
  endpoint: string;
  authMethod: AuthMethod;
  timeoutMs: number;
  retryPolicyJson: RetryPolicy;
  headersJson: Record<string, string>;
  status: Status;
  version: string;
  healthStatus: 'healthy' | 'unhealthy' | 'unknown';
  group: PluginGroup | null;
  tags: PluginTag[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface RetryPolicy {
  maxAttempts: number;
  backoffMs: number;
  backoffMultiplier: number;
}

export interface PluginGroup {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
}

export interface PluginTag {
  id: string;
  name: string;
}

export interface PluginHealthResult {
  status: 'healthy' | 'unhealthy';
  latencyMs: number;
  checkedAt: string;
}

export interface CreatePluginDto {
  name: string;
  description?: string;
  endpoint: string;
  authMethod?: AuthMethod;
  apiKey?: string;
  headersJson?: Record<string, string>;
  timeoutMs?: number;
  retryPolicyJson?: RetryPolicy;
  groupId?: string;
  tagIds?: string[];
}

export type UpdatePluginDto = Partial<CreatePluginDto> & { status?: 'active' | 'inactive' };
```

## Step 4: Tool Types

```typescript
// packages/types/src/tool.ts

export interface Tool {
  id: string;
  name: string;
  description: string | null;
  category: ToolCategory | null;
  plugin: { id: string; name: string } | null;
  inputSchemaJson: Record<string, unknown>;
  outputSchemaJson: Record<string, unknown>;
  activeVersionId: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ToolVersion {
  id: string;
  toolId: string;
  version: string;
  inputSchemaJson: Record<string, unknown>;
  outputSchemaJson: Record<string, unknown>;
  changelog: string | null;
  createdBy: string;
  createdAt: string;
}

export interface ToolCategory {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
}

export interface ToolExecutionLog {
  id: string;
  toolId: string;
  userId: string;
  inputJson: Record<string, unknown>;
  outputJson: Record<string, unknown> | null;
  status: 'success' | 'error';
  durationMs: number;
  errorMessage: string | null;
  createdAt: string;
}

export interface ExecuteToolDto {
  pluginId?: string;
  args: Record<string, unknown>;
}

export interface ToolExecutionResult {
  success: boolean;
  output: unknown;
  durationMs: number;
  error?: string;
}
```

## Step 5: Dashboard Types

```typescript
// packages/types/src/dashboard.ts

export interface KpiMetrics {
  totalPlugins: number;
  activePlugins: number;
  totalTools: number;
  requestVolume24h: number;
  failedRequests24h: number;
  errorRate: number;         // percentage
  avgLatencyMs: number;
  activeTokens: number;
  systemHealth: 'healthy' | 'degraded' | 'critical';
  activeUsers24h: number;
  trends: {
    requestVolume: number;   // % change vs previous 24h
    errorRate: number;
    latency: number;
  };
}

export interface TimeSeriesPoint {
  timestamp: string;         // ISO 8601
  value: number;
}

export interface ChartData {
  dailyUsage: TimeSeriesPoint[];
  toolExecutions: Array<{ category: string; count: number; successRate: number }>;
  latencyPercentiles: Array<{ timestamp: string; p50: number; p95: number; p99: number }>;
  errorBreakdown: Array<{ type: string; count: number; percentage: number }>;
}
```

## Step 6: MCP Types

```typescript
// packages/types/src/mcp.ts

export interface McpTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, McpProperty>;
    required?: string[];
  };
}

export interface McpProperty {
  type: string;
  description?: string;
  enum?: unknown[];
  default?: unknown;
  items?: McpProperty;
  properties?: Record<string, McpProperty>;
}

export interface McpServerInfo {
  name: string;
  version: string;
  tools: McpTool[];
}

export interface McpCallResult {
  content: Array<McpContent>;
  isError?: boolean;
}

export type McpContent =
  | { type: 'text'; text: string }
  | { type: 'image'; data: string; mimeType: string }
  | { type: 'resource'; uri: string; text?: string };

export interface AxonAgent {
  agentId: string;
  agentType: string;
  status: 'active' | 'idle' | 'error';
  lastActive: string;
  pendingProposals: number;
}

export interface HitlTask {
  id: string;
  taskType: string;
  payload: Record<string, unknown>;
  priority: number;
  createdAt: string;
}
```

## Step 7: Zod Validation Schemas

```typescript
// packages/types/src/zod/auth.schemas.ts
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
  totpCode: z.string().length(6, '2FA code must be 6 digits').optional(),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number')
    .regex(/[^a-zA-Z0-9]/, 'Must contain a special character'),
  name: z.string().min(1, 'Name is required').max(200),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
```

```typescript
// packages/types/src/zod/plugin.schemas.ts
import { z } from 'zod';

export const createPluginSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(1000).optional(),
  endpoint: z.string().url('Must be a valid URL'),
  authMethod: z.enum(['none', 'bearer', 'api_key', 'basic', 'custom']).default('none'),
  apiKey: z.string().optional(),
  timeoutMs: z.number().min(1000).max(300_000).default(10000),
  retryPolicyJson: z.object({
    maxAttempts: z.number().min(0).max(10).default(3),
    backoffMs: z.number().min(100).default(1000),
    backoffMultiplier: z.number().min(1).max(5).default(2),
  }).default({ maxAttempts: 3, backoffMs: 1000, backoffMultiplier: 2 }),
  groupId: z.string().optional(),
  tagIds: z.array(z.string()).default([]),
});

export type CreatePluginFormValues = z.infer<typeof createPluginSchema>;
```

## Step 8: index.ts Re-exports

```typescript
// packages/types/src/index.ts
export * from './common';
export * from './auth';
export * from './plugin';
export * from './tool';
export * from './testing';
export * from './token';
export * from './log';
export * from './notification';
export * from './settings';
export * from './dashboard';
export * from './mcp';
export * from './zod/auth.schemas';
export * from './zod/plugin.schemas';
export * from './zod/tool.schemas';
```

## Rules

- All types shared between `apps/api` and `apps/web` must live in `packages/types` — never define them twice
- DTOs in NestJS controllers use `class-validator` decorators; the same shape is expressed as Zod schemas in `packages/types/src/zod/` for frontend forms
- Never import from `apps/*` in `packages/types` — types package has zero dependencies on apps
- All date fields use `string` (ISO 8601) in shared types — never `Date` objects (they don't serialize cleanly via JSON)
- API response types never include sensitive fields (`passwordHash`, `mfaSecret`, `encryptedValue`, `tokenHash`) — define separate response types vs. DB models
- Enums are `const enum` or regular `enum` — never string literal unions for values used across the wire (they need runtime presence)
- Zod schemas are the single source of truth for frontend form validation — NestJS DTO class-validator decorators are separate but must match
