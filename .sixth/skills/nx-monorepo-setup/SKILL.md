---
name: nx-monorepo-setup
description: Initialize and manage the AXON Admin Nx monorepo. Use when adding new apps or packages, updating Nx configuration, running builds/tests, or troubleshooting workspace issues.
---

# Nx Monorepo Setup — AXON Admin

## Project Structure

```
/u01/axon-admin/
  apps/
    web/          # Next.js 15 (port 3000)
    api/          # NestJS (port 3001)
  packages/
    ui/           # shadcn/ui component library
    types/        # Shared TypeScript types/interfaces
    config/       # Shared ESLint + TS + Prettier configs
    mcp-sdk/      # MCP protocol client wrapper
    shared/       # Shared validators, utilities, constants
  prisma/
    schema.prisma
    migrations/
  .github/workflows/
  docker-compose.yml
  nx.json
  package.json   # root (pnpm workspace)
```

## Step 1: Initialize Workspace

```bash
cd /u01/axon-admin
npx create-nx-workspace@latest . --preset=empty --packageManager=pnpm --nxCloud=skip
```

## Step 2: Add Apps

```bash
# Next.js frontend
pnpm nx g @nx/next:app web --directory=apps/web --style=tailwind --appRouter=true --src=false

# NestJS backend
pnpm nx g @nx/nest:app api --directory=apps/api
```

## Step 3: Add Packages

```bash
# Shared TypeScript library (no framework)
pnpm nx g @nx/js:lib types --directory=packages/types --bundler=tsc
pnpm nx g @nx/js:lib shared --directory=packages/shared --bundler=tsc
pnpm nx g @nx/js:lib mcp-sdk --directory=packages/mcp-sdk --bundler=tsc
pnpm nx g @nx/js:lib config --directory=packages/config --bundler=tsc

# UI component library (React)
pnpm nx g @nx/react:lib ui --directory=packages/ui --bundler=vite --style=css
```

## Step 4: nx.json Configuration

```json
{
  "$schema": "./node_modules/nx/schemas/nx-schema.json",
  "defaultBase": "main",
  "namedInputs": {
    "default": ["{projectRoot}/**/*", "sharedGlobals"],
    "production": [
      "default",
      "!{projectRoot}/**/*.spec.*",
      "!{projectRoot}/jest.config.*"
    ],
    "sharedGlobals": ["{workspaceRoot}/tsconfig.base.json"]
  },
  "targetDefaults": {
    "build": { "dependsOn": ["^build"], "inputs": ["production", "^production"], "cache": true },
    "test": { "inputs": ["default", "^production"], "cache": true },
    "lint": { "inputs": ["default"], "cache": true }
  },
  "plugins": [
    "@nx/next/plugin",
    "@nx/nest/plugin"
  ]
}
```

## Step 5: Root package.json

```json
{
  "name": "axon-admin",
  "private": true,
  "scripts": {
    "dev": "nx run-many -t serve -p api web --parallel",
    "build": "nx run-many -t build --all",
    "test": "nx run-many -t test --all",
    "lint": "nx run-many -t lint --all",
    "typecheck": "nx run-many -t typecheck --all"
  },
  "workspaces": ["apps/*", "packages/*"]
}
```

## Common Nx Commands

```bash
# Run all apps in dev mode
pnpm dev

# Build specific app
pnpm nx build web
pnpm nx build api

# Test specific project
pnpm nx test api

# Lint all
pnpm nx run-many -t lint --all

# Generate new module in api
pnpm nx g @nx/nest:module plugins --project=api

# Show project dependency graph
pnpm nx graph

# Run affected builds only (CI)
pnpm nx affected -t build

# Cache status
pnpm nx reset  # clear cache
```

## tsconfig.base.json Path Aliases

```json
{
  "compilerOptions": {
    "paths": {
      "@axon/types": ["packages/types/src/index.ts"],
      "@axon/ui": ["packages/ui/src/index.ts"],
      "@axon/shared": ["packages/shared/src/index.ts"],
      "@axon/mcp-sdk": ["packages/mcp-sdk/src/index.ts"],
      "@axon/config/*": ["packages/config/*"]
    }
  }
}
```

## Rules

- Always use `pnpm` as package manager (workspace-aware)
- All inter-package imports use `@axon/*` path aliases
- Never import from `apps/*` in `packages/*` — packages are consumed by apps, not vice versa
- Run `pnpm nx graph` to verify dependency graph is acyclic before adding new package deps
- Use `pnpm nx affected` in CI to only build/test what changed
