---
name: prisma-schema-migration
description: Manage Prisma schema changes, run migrations, and seed data for the AXON Admin axon_admin PostgreSQL schema. Use when adding new tables, modifying existing models, running migrations, generating the Prisma client, or seeding initial data.
---

# Prisma Schema & Migration — AXON Admin

## Database Connection

- **Host:** 202.71.1.13
- **Port:** 5435
- **User:** axon
- **Password:** axon
- **Schema:** axon_admin (the axon_admin Prisma schema)
- **Read-only schemas:** axon_brain, axon_plan, axon_agents, axon_mcp, axon_board (separate datasource)

## prisma/schema.prisma Structure

```prisma
generator client {
  provider        = "prisma-client-js"
  output          = "../node_modules/.prisma/client"
  previewFeatures = ["multiSchema"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  schemas  = ["axon_admin"]
}

// ───── AXON Read-only datasource (separate client) ─────
// Use a separate PrismaClient instance in AxonPrismaService
// DATABASE_URL_AXON=postgresql://axon:axon@202.71.1.13:5435/axon
```

## DATABASE_URL Format

```env
DATABASE_URL="postgresql://axon:axon@202.71.1.13:5435/axon?schema=axon_admin&sslmode=prefer"
DATABASE_URL_AXON="postgresql://axon:axon@202.71.1.13:5435/axon?schema=public&sslmode=prefer"
```

## Step 1: Core Model Conventions

```prisma
// Every table uses:
// - UUID primary key (cuid for NestJS compat)
// - created_at / updated_at timestamps
// - deleted_at for soft deletes

model Plugin {
  id          String    @id @default(cuid()) @map("id")
  name        String    @db.VarChar(200)
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")
  deletedAt   DateTime? @map("deleted_at")

  @@map("plugins")
  @@schema("axon_admin")
}
```

## Step 2: Full Schema Reference

```prisma
// ── Users & Auth ──────────────────────────────────────
model User {
  id           String    @id @default(cuid())
  email        String    @unique @db.VarChar(255)
  name         String?   @db.VarChar(200)
  avatar       String?
  passwordHash String?   @map("password_hash")
  isVerified   Boolean   @default(false) @map("is_verified")
  isActive     Boolean   @default(true) @map("is_active")
  mfaSecret    String?   @map("mfa_secret")
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")
  deletedAt    DateTime? @map("deleted_at")

  roles         UserRole[]
  sessions      Session[]
  refreshTokens RefreshToken[]
  apiTokens     ApiToken[]
  auditLogs     AuditLog[]

  @@map("users")
  @@schema("axon_admin")
}

model Role {
  id          String   @id @default(cuid())
  name        String   @unique @db.VarChar(50)
  description String?  @db.VarChar(500)

  users       UserRole[]
  permissions RolePermission[]

  @@map("roles")
  @@schema("axon_admin")
}

model Permission {
  id          String @id @default(cuid())
  resource    String @db.VarChar(100)
  action      String @db.VarChar(100)
  description String? @db.VarChar(500)

  roles RolePermission[]

  @@unique([resource, action])
  @@map("permissions")
  @@schema("axon_admin")
}

model UserRole {
  userId String @map("user_id")
  roleId String @map("role_id")
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  role   Role   @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@id([userId, roleId])
  @@map("user_roles")
  @@schema("axon_admin")
}

model RolePermission {
  roleId       String @map("role_id")
  permissionId String @map("permission_id")
  role         Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission   Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@id([roleId, permissionId])
  @@map("role_permissions")
  @@schema("axon_admin")
}

model Session {
  id        String   @id @default(cuid())
  userId    String   @map("user_id")
  tokenHash String   @map("token_hash")
  ip        String?  @db.VarChar(45)
  userAgent String?  @map("user_agent") @db.Text
  expiresAt DateTime @map("expires_at")
  createdAt DateTime @default(now()) @map("created_at")
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
  @@schema("axon_admin")
}

model RefreshToken {
  id        String    @id @default(cuid())
  userId    String    @map("user_id")
  tokenHash String    @map("token_hash")
  expiresAt DateTime  @map("expires_at")
  revokedAt DateTime? @map("revoked_at")
  createdAt DateTime  @default(now()) @map("created_at")
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("refresh_tokens")
  @@schema("axon_admin")
}

// ── API Tokens ─────────────────────────────────────────
model ApiToken {
  id             String    @id @default(cuid())
  userId         String    @map("user_id")
  name           String    @db.VarChar(200)
  tokenHash      String    @map("token_hash")
  tokenPrefix    String    @map("token_prefix") @db.VarChar(10)
  encryptedValue String    @map("encrypted_value") @db.Text
  expiresAt      DateTime? @map("expires_at")
  lastUsedAt     DateTime? @map("last_used_at")
  ipWhitelist    String[]  @map("ip_whitelist")
  scopesJson     Json      @default("[]") @map("scopes_json")
  createdAt      DateTime  @default(now()) @map("created_at")
  revokedAt      DateTime? @map("revoked_at")
  user           User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("api_tokens")
  @@schema("axon_admin")
}

// ── Plugins ────────────────────────────────────────────
model Plugin {
  id              String        @id @default(cuid())
  name            String        @db.VarChar(200)
  description     String?       @db.Text
  endpoint        String        @db.VarChar(500)
  authMethod      String        @default("none") @map("auth_method") @db.VarChar(50)
  apiKeyEncrypted String?       @map("api_key_encrypted") @db.Text
  headersJson     Json          @default("{}") @map("headers_json")
  timeoutMs       Int           @default(10000) @map("timeout_ms")
  retryPolicyJson Json          @default("{}") @map("retry_policy_json")
  status          String        @default("inactive") @db.VarChar(20)
  version         String        @default("1.0.0") @db.VarChar(50)
  healthStatus    String        @default("unknown") @map("health_status") @db.VarChar(20)
  groupId         String?       @map("group_id")
  createdBy       String        @map("created_by")
  createdAt       DateTime      @default(now()) @map("created_at")
  updatedAt       DateTime      @updatedAt @map("updated_at")
  deletedAt       DateTime?     @map("deleted_at")

  group   PluginGroup? @relation(fields: [groupId], references: [id])
  tags    PluginTagMap[]
  envVars PluginEnvVar[]
  tools   Tool[]

  @@map("plugins")
  @@schema("axon_admin")
}

model PluginGroup {
  id          String   @id @default(cuid())
  name        String   @db.VarChar(100)
  description String?  @db.Text
  color       String?  @db.VarChar(20)
  plugins     Plugin[]

  @@map("plugin_groups")
  @@schema("axon_admin")
}

model PluginTag {
  id   String @id @default(cuid())
  name String @unique @db.VarChar(50)
  plugins PluginTagMap[]

  @@map("plugin_tags")
  @@schema("axon_admin")
}

model PluginTagMap {
  pluginId String    @map("plugin_id")
  tagId    String    @map("tag_id")
  plugin   Plugin    @relation(fields: [pluginId], references: [id], onDelete: Cascade)
  tag      PluginTag @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([pluginId, tagId])
  @@map("plugin_tag_map")
  @@schema("axon_admin")
}

model PluginEnvVar {
  id             String  @id @default(cuid())
  pluginId       String  @map("plugin_id")
  key            String  @db.VarChar(200)
  valueEncrypted String  @map("value_encrypted") @db.Text
  isSecret       Boolean @default(false) @map("is_secret")
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")
  plugin         Plugin   @relation(fields: [pluginId], references: [id], onDelete: Cascade)

  @@unique([pluginId, key])
  @@map("plugin_env_vars")
  @@schema("axon_admin")
}

// ── Tools ──────────────────────────────────────────────
model Tool {
  id              String    @id @default(cuid())
  name            String    @db.VarChar(200)
  description     String?   @db.Text
  categoryId      String?   @map("category_id")
  pluginId        String?   @map("plugin_id")
  inputSchemaJson Json      @default("{}") @map("input_schema_json")
  outputSchemaJson Json     @default("{}") @map("output_schema_json")
  activeVersionId String?   @map("active_version_id")
  createdBy       String    @map("created_by")
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")
  deletedAt       DateTime? @map("deleted_at")

  category      ToolCategory?  @relation(fields: [categoryId], references: [id])
  plugin        Plugin?        @relation(fields: [pluginId], references: [id])
  versions      ToolVersion[]
  executionLogs ToolExecutionLog[]

  @@map("tools")
  @@schema("axon_admin")
}

model ToolVersion {
  id               String   @id @default(cuid())
  toolId           String   @map("tool_id")
  version          String   @db.VarChar(50)
  inputSchemaJson  Json     @map("input_schema_json")
  outputSchemaJson Json     @map("output_schema_json")
  changelog        String?  @db.Text
  createdBy        String   @map("created_by")
  createdAt        DateTime @default(now()) @map("created_at")
  tool             Tool     @relation(fields: [toolId], references: [id], onDelete: Cascade)

  @@map("tool_versions")
  @@schema("axon_admin")
}

model ToolCategory {
  id          String  @id @default(cuid())
  name        String  @db.VarChar(100)
  description String? @db.Text
  icon        String? @db.VarChar(50)
  color       String? @db.VarChar(20)
  tools       Tool[]

  @@map("tool_categories")
  @@schema("axon_admin")
}

model ToolExecutionLog {
  id           String   @id @default(cuid())
  toolId       String   @map("tool_id")
  versionId    String?  @map("version_id")
  userId       String   @map("user_id")
  inputJson    Json     @map("input_json")
  outputJson   Json?    @map("output_json")
  status       String   @db.VarChar(20)
  durationMs   Int      @map("duration_ms")
  errorMessage String?  @map("error_message") @db.Text
  createdAt    DateTime @default(now()) @map("created_at")
  tool         Tool     @relation(fields: [toolId], references: [id], onDelete: Cascade)

  @@map("tool_execution_logs")
  @@schema("axon_admin")
}

// ── Testing ────────────────────────────────────────────
model TestCollection {
  id          String   @id @default(cuid())
  name        String   @db.VarChar(200)
  description String?  @db.Text
  createdBy   String   @map("created_by")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  requests    TestRequest[]

  @@map("test_collections")
  @@schema("axon_admin")
}

model TestRequest {
  id           String   @id @default(cuid())
  collectionId String   @map("collection_id")
  name         String   @db.VarChar(200)
  protocol     String   @db.VarChar(20)
  url          String   @db.VarChar(1000)
  headersJson  Json     @default("{}") @map("headers_json")
  bodyJson     Json?    @map("body_json")
  sortOrder    Int      @default(0) @map("sort_order")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")
  collection   TestCollection @relation(fields: [collectionId], references: [id], onDelete: Cascade)
  executions   TestExecution[]

  @@map("test_requests")
  @@schema("axon_admin")
}

model TestExecution {
  id             String   @id @default(cuid())
  requestId      String   @map("request_id")
  userId         String   @map("user_id")
  responseStatus Int?     @map("response_status")
  responseBody   Json?    @map("response_body")
  durationMs     Int?     @map("duration_ms")
  errorMessage   String?  @map("error_message") @db.Text
  createdAt      DateTime @default(now()) @map("created_at")
  request        TestRequest @relation(fields: [requestId], references: [id], onDelete: Cascade)

  @@map("test_executions")
  @@schema("axon_admin")
}

// ── Logs & Audit ───────────────────────────────────────
model AuditLog {
  id           String   @id @default(cuid())
  userId       String?  @map("user_id")
  action       String   @db.VarChar(100)
  resourceType String   @map("resource_type") @db.VarChar(100)
  resourceId   String?  @map("resource_id")
  beforeJson   Json?    @map("before_json")
  afterJson    Json?    @map("after_json")
  ip           String?  @db.VarChar(45)
  userAgent    String?  @map("user_agent") @db.Text
  createdAt    DateTime @default(now()) @map("created_at")
  user         User?    @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@map("audit_logs")
  @@schema("axon_admin")
}

model SystemLog {
  id          String   @id @default(cuid())
  level       String   @db.VarChar(10)
  message     String   @db.Text
  contextJson Json?    @map("context_json")
  traceId     String?  @map("trace_id") @db.VarChar(64)
  spanId      String?  @map("span_id") @db.VarChar(16)
  createdAt   DateTime @default(now()) @map("created_at")

  @@map("system_logs")
  @@schema("axon_admin")
}

// ── Notifications ─────────────────────────────────────
model Notification {
  id        String    @id @default(cuid())
  userId    String    @map("user_id")
  type      String    @db.VarChar(50)
  title     String    @db.VarChar(300)
  message   String    @db.Text
  dataJson  Json?     @map("data_json")
  isRead    Boolean   @default(false) @map("is_read")
  readAt    DateTime? @map("read_at")
  createdAt DateTime  @default(now()) @map("created_at")

  @@map("notifications")
  @@schema("axon_admin")
}

model NotificationRule {
  id            String   @id @default(cuid())
  eventType     String   @map("event_type") @db.VarChar(100)
  conditionJson Json     @map("condition_json")
  channelsJson  Json     @map("channels_json")
  isActive      Boolean  @default(true) @map("is_active")
  createdBy     String   @map("created_by")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  @@map("notification_rules")
  @@schema("axon_admin")
}

// ── Settings ───────────────────────────────────────────
model Setting {
  id          String   @id @default(cuid())
  namespace   String   @db.VarChar(100)
  key         String   @db.VarChar(200)
  valueJson   Json     @map("value_json")
  updatedBy   String?  @map("updated_by")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@unique([namespace, key])
  @@map("settings")
  @@schema("axon_admin")
}

model Environment {
  id        String   @id @default(cuid())
  name      String   @db.VarChar(100)
  slug      String   @unique @db.VarChar(50)
  isActive  Boolean  @default(false) @map("is_active")
  createdAt DateTime @default(now()) @map("created_at")
  envVars   EnvVariable[]
  flagOverrides FeatureFlagOverride[]

  @@map("environments")
  @@schema("axon_admin")
}

model EnvVariable {
  id             String      @id @default(cuid())
  environmentId  String      @map("environment_id")
  key            String      @db.VarChar(200)
  valueEncrypted String      @map("value_encrypted") @db.Text
  isSecret       Boolean     @default(false) @map("is_secret")
  createdAt      DateTime    @default(now()) @map("created_at")
  updatedAt      DateTime    @updatedAt @map("updated_at")
  environment    Environment @relation(fields: [environmentId], references: [id], onDelete: Cascade)

  @@unique([environmentId, key])
  @@map("env_variables")
  @@schema("axon_admin")
}

model FeatureFlag {
  id               String   @id @default(cuid())
  name             String   @db.VarChar(200)
  key              String   @unique @db.VarChar(100)
  type             String   @db.VarChar(20)
  defaultValueJson Json     @map("default_value_json")
  isActive         Boolean  @default(true) @map("is_active")
  createdAt        DateTime @default(now()) @map("created_at")
  updatedAt        DateTime @updatedAt @map("updated_at")
  overrides        FeatureFlagOverride[]

  @@map("feature_flags")
  @@schema("axon_admin")
}

model FeatureFlagOverride {
  id            String      @id @default(cuid())
  flagId        String      @map("flag_id")
  environmentId String      @map("environment_id")
  valueJson     Json        @map("value_json")
  flag          FeatureFlag @relation(fields: [flagId], references: [id], onDelete: Cascade)
  environment   Environment @relation(fields: [environmentId], references: [id], onDelete: Cascade)

  @@unique([flagId, environmentId])
  @@map("feature_flag_overrides")
  @@schema("axon_admin")
}
```

## Migration Commands

```bash
# Create and apply a new migration
cd /u01/axon-admin
npx prisma migrate dev --name <migration-name> --schema=prisma/schema.prisma

# Apply pending migrations (production)
npx prisma migrate deploy --schema=prisma/schema.prisma

# Regenerate Prisma client after schema change
npx prisma generate --schema=prisma/schema.prisma

# Reset dev database (drops + recreates schema)
npx prisma migrate reset --schema=prisma/schema.prisma

# Open Prisma Studio
npx prisma studio --schema=prisma/schema.prisma

# Validate schema without migrating
npx prisma validate --schema=prisma/schema.prisma

# View migration status
npx prisma migrate status --schema=prisma/schema.prisma
```

## PrismaService (NestJS)

```typescript
// apps/api/src/prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

## Rules

- Always run `prisma generate` after any schema change
- Never use raw SQL (`$queryRaw`) unless Prisma cannot express the query
- Every model must have `@@schema("axon_admin")` and `@@map("snake_case_table_name")`
- Sensitive fields (encrypted values, secrets) must never be returned in API responses — always exclude them in service `select` clauses
- Soft deletes: set `deletedAt` to `new Date()` — never call `prisma.model.delete()`
- All foreign key relations use `onDelete: Cascade` for child records and `onDelete: SetNull` for optional references
