---
name: nextjs-page-creation
description: Create Next.js 15 pages and layouts for the AXON Admin WebApp. Use when adding new UI pages, building page components with shadcn/ui and Tailwind CSS, implementing forms with React Hook Form + Zod, or connecting pages to the API with TanStack Query.
---

# Next.js Page Creation — AXON Admin

## App Router File Conventions

```
apps/web/app/
  (auth)/                    # Route group — no layout (unauthenticated)
    login/page.tsx
    register/page.tsx
    forgot-password/page.tsx
  (dashboard)/               # Route group — uses DashboardLayout
    layout.tsx               # sidebar + header wrapper
    page.tsx                 # Dashboard home
    plugins/
      page.tsx               # Plugins list
      [id]/page.tsx          # Plugin detail
      new/page.tsx           # Create plugin
    tools/
      page.tsx
      [id]/page.tsx
    testing/page.tsx
    logs/page.tsx
    tokens/page.tsx
    notifications/page.tsx
    settings/page.tsx
    users/page.tsx
    analytics/page.tsx
    profile/page.tsx
    axon/
      agents/page.tsx
      hitl/page.tsx
      ledger/page.tsx
  api/                       # Next.js route handlers
    auth/[...nextauth]/route.ts
  layout.tsx                 # Root layout (providers)
  not-found.tsx
  error.tsx
```

## Step 1: Root Layout

```typescript
// app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '@/components/providers';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: { default: 'AXON Admin', template: '%s | AXON Admin' },
  description: 'MCP Management Platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

## Step 2: Providers Component

```typescript
// components/providers.tsx
'use client';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
  }));

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
```

## Step 3: Dashboard Layout

```typescript
// app/(dashboard)/layout.tsx
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { MobileDrawer } from '@/components/layout/mobile-drawer';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar className="hidden lg:flex" />
      <MobileDrawer />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

## Step 4: Standard List Page Pattern

```typescript
// app/(dashboard)/plugins/page.tsx
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PluginsTable } from '@/components/plugins/plugins-table';
import { PluginsHeader } from '@/components/plugins/plugins-header';
import { TableSkeleton } from '@/components/ui/skeletons';

export const metadata: Metadata = { title: 'Plugins' };

export default function PluginsPage() {
  return (
    <div className="space-y-6">
      <PluginsHeader />
      <Suspense fallback={<TableSkeleton />}>
        <PluginsTable />
      </Suspense>
    </div>
  );
}
```

## Step 5: TanStack Query Data Fetching

```typescript
// hooks/use-plugins.ts
'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { Plugin, PaginatedResponse, CreatePluginDto } from '@axon/types';
import { toast } from 'sonner';

export function usePlugins(params?: Record<string, unknown>) {
  return useQuery<PaginatedResponse<Plugin>>({
    queryKey: ['plugins', params],
    queryFn: () => api.get('/plugins', { params }).then(r => r.data),
  });
}

export function usePlugin(id: string) {
  return useQuery<Plugin>({
    queryKey: ['plugins', id],
    queryFn: () => api.get(`/plugins/${id}`).then(r => r.data),
    enabled: !!id,
  });
}

export function useCreatePlugin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreatePluginDto) => api.post('/plugins', dto).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plugins'] });
      toast.success('Plugin created');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to create plugin'),
  });
}

export function useDeletePlugin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/plugins/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plugins'] });
      toast.success('Plugin deleted');
    },
  });
}
```

## Step 6: Form with React Hook Form + Zod

```typescript
// components/plugins/create-plugin-form.tsx
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCreatePlugin } from '@/hooks/use-plugins';

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(1000).optional(),
  endpoint: z.string().url('Must be a valid URL'),
  timeout: z.number().min(1000).max(60000).default(10000),
});

type FormValues = z.infer<typeof schema>;

export function CreatePluginForm({ onSuccess }: { onSuccess?: () => void }) {
  const { mutate, isPending } = useCreatePlugin();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { timeout: 10000 },
  });

  const onSubmit = (values: FormValues) => {
    mutate(values, { onSuccess });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel>Plugin Name</FormLabel>
            <FormControl><Input placeholder="my-mcp-plugin" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="endpoint" render={({ field }) => (
          <FormItem>
            <FormLabel>MCP Endpoint</FormLabel>
            <FormControl><Input placeholder="http://localhost:8100" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <Button type="submit" disabled={isPending}>
          {isPending ? 'Creating...' : 'Create Plugin'}
        </Button>
      </form>
    </Form>
  );
}
```

## Step 7: API Client (Axios)

```typescript
// lib/api-client.ts
import axios from 'axios';
import { getSession } from 'next-auth/react';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api',
  withCredentials: true,
});

api.interceptors.request.use(async (config) => {
  const session = await getSession();
  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);
```

## Tailwind CSS Conventions

- Use semantic color variables: `bg-background`, `text-foreground`, `border-border`
- Cards: `rounded-xl border bg-card shadow-sm`
- Section spacing: `space-y-6` between major sections, `space-y-4` within forms
- Page header: `flex items-center justify-between` with title (`text-2xl font-bold`) left, actions right
- Tables: always wrap in `<div className="rounded-xl border overflow-hidden">`
- Loading states: always show skeletons (never spinners alone) for content areas
- Dark mode: rely on CSS variables; never use `dark:` utilities for color — only for shadow/opacity

## Rules

- All pages in `(dashboard)/` are server components by default — only add `'use client'` when using hooks
- All forms are client components with React Hook Form + Zod
- Never `fetch()` in client components — use TanStack Query hooks
- Never call the API directly in server components — use server actions or keep data fetching in client hooks
- All mutations show `toast.success` on success and `toast.error` on failure
- All list pages support URL-based filters (searchParams) for shareable links
- All detail pages handle 404 gracefully with `notFound()` from `next/navigation`
