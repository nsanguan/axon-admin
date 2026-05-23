---
name: ui-component
description: Create reusable UI components for the AXON Admin WebApp using shadcn/ui, Tailwind CSS, Framer Motion, and Lucide Icons. Use when building data tables, dashboard widgets, Monaco editor panels, status badges, modals, sidebars, or any new shared UI component.
---

# UI Component Creation — AXON Admin

## Design System

- **Component library:** shadcn/ui (installed in `packages/ui/`)
- **Styling:** Tailwind CSS with CSS custom properties for theme tokens
- **Icons:** Lucide React (`lucide-react`)
- **Animations:** Framer Motion
- **Charts:** Recharts
- **Code editor:** Monaco Editor (`@monaco-editor/react`) — client-only via dynamic import
- **Theme:** Dark/light via `next-themes` + CSS variables

## Color Tokens (Tailwind CSS variables)

```css
/* Dark mode and light mode are handled via CSS vars — use semantic names only */
bg-background       /* page background */
bg-card             /* card/panel background */
bg-muted            /* subtle background (inputs, sidebars) */
text-foreground     /* primary text */
text-muted-foreground /* secondary text */
border-border       /* default border */
ring-ring           /* focus ring */
bg-primary          /* primary action color (indigo) */
text-primary-foreground
bg-destructive      /* red/danger */
bg-success          /* green (custom) */
bg-warning          /* amber (custom) */
```

## Step 1: shadcn/ui Installation

```bash
# In apps/web:
pnpm --filter web dlx shadcn@latest init
pnpm --filter web dlx shadcn@latest add button input label textarea select checkbox switch badge
pnpm --filter web dlx shadcn@latest add card dialog sheet dropdown-menu popover tooltip
pnpm --filter web dlx shadcn@latest add table form separator skeleton avatar
pnpm --filter web dlx shadcn@latest add tabs command alert-dialog progress
```

## Step 2: Sidebar Navigation

```typescript
// apps/web/components/layout/sidebar.tsx
'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Puzzle, Wrench, TestTube, Key, ScrollText,
  Bell, Settings, Users, BarChart3, Cpu, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/plugins', label: 'Plugins', icon: Puzzle },
  { href: '/tools', label: 'Tools', icon: Wrench },
  { href: '/testing', label: 'Testing Console', icon: TestTube },
  { href: '/tokens', label: 'API Tokens', icon: Key },
  { href: '/logs', label: 'Logs', icon: ScrollText },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/axon/agents', label: 'AXON Agents', icon: Cpu },
  { href: '/users', label: 'Users & Roles', icon: Users },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        animate={{ width: collapsed ? 64 : 240 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className={cn(
          'relative flex flex-col border-r bg-card overflow-hidden shrink-0',
          className,
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center px-4 border-b">
          <AnimatePresence mode="wait">
            {!collapsed ? (
              <motion.span
                key="full"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-lg font-bold text-foreground"
              >
                AXON Admin
              </motion.span>
            ) : (
              <motion.span
                key="icon"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-lg font-bold text-primary"
              >
                A
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-4 space-y-1 px-2">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            const item = (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{label}</span>}
              </Link>
            );
            return collapsed ? (
              <Tooltip key={href}>
                <TooltipTrigger asChild>{item}</TooltipTrigger>
                <TooltipContent side="right">{label}</TooltipContent>
              </Tooltip>
            ) : item;
          })}
        </nav>

        {/* Collapse toggle */}
        <div className="p-2 border-t">
          <Button
            variant="ghost" size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="w-full"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </motion.aside>
    </TooltipProvider>
  );
}
```

## Step 3: KPI Widget Card

```typescript
// apps/web/components/dashboard/kpi-card.tsx
import { cn } from '@/lib/utils';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface KpiCardProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: number;      // percentage change, positive = up
  icon: LucideIcon;
  iconColor?: string;
  isLoading?: boolean;
}

export function KpiCard({ title, value, unit, trend, icon: Icon, iconColor = 'text-primary', isLoading }: KpiCardProps) {
  if (isLoading) return (
    <Card>
      <CardContent className="p-6">
        <Skeleton className="h-4 w-24 mb-4" />
        <Skeleton className="h-8 w-16" />
      </CardContent>
    </Card>
  );

  const TrendIcon = trend === undefined ? Minus : trend > 0 ? TrendingUp : TrendingDown;
  const trendColor = trend === undefined ? 'text-muted-foreground' : trend > 0 ? 'text-emerald-500' : 'text-red-500';

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className={cn('p-2 rounded-lg bg-primary/10', iconColor)}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <div className="flex items-end gap-2">
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {unit && <span className="text-sm text-muted-foreground mb-0.5">{unit}</span>}
        </div>
        {trend !== undefined && (
          <div className={cn('flex items-center gap-1 mt-2 text-xs', trendColor)}>
            <TrendIcon className="h-3 w-3" />
            <span>{Math.abs(trend)}% vs last 24h</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

## Step 4: Data Table (TanStack Table)

```typescript
// apps/web/components/ui/data-table.tsx
'use client';
import {
  useReactTable, getCoreRowModel, getSortedRowModel,
  getFilteredRowModel, getPaginationRowModel,
  flexRender, type ColumnDef, type SortingState,
} from '@tanstack/react-table';
import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  isLoading?: boolean;
  searchPlaceholder?: string;
  searchColumn?: string;
}

export function DataTable<T>({ data, columns, isLoading, searchPlaceholder = 'Search...', searchColumn }: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    initialState: { pagination: { pageSize: 20 } },
  });

  return (
    <div className="space-y-4">
      {searchColumn && (
        <Input
          placeholder={searchPlaceholder}
          value={globalFilter}
          onChange={e => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
      )}
      <div className="rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(hg => (
              <TableRow key={hg.id} className="bg-muted/50">
                {hg.headers.map(header => (
                  <TableHead
                    key={header.id}
                    className="font-semibold cursor-pointer select-none"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {{ asc: ' ↑', desc: ' ↓' }[header.column.getIsSorted() as string] ?? ''}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground">
                  No results found.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map(row => (
                <TableRow key={row.id} className="hover:bg-muted/30 transition-colors">
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()} ({data.length} total)
        </p>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
```

## Step 5: Monaco Editor (Dynamic Import)

```typescript
// apps/web/components/ui/json-editor.tsx
'use client';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import { Skeleton } from './skeleton';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => <Skeleton className="h-64 w-full rounded-lg" />,
});

interface JsonEditorProps {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  height?: number | string;
  schema?: object;  // JSON Schema for validation/autocomplete
}

export function JsonEditor({ value, onChange, readOnly = false, height = 300, schema }: JsonEditorProps) {
  const { resolvedTheme } = useTheme();

  return (
    <div className="rounded-lg overflow-hidden border">
      <MonacoEditor
        height={height}
        language="json"
        theme={resolvedTheme === 'dark' ? 'vs-dark' : 'vs-light'}
        value={value}
        onChange={(v) => onChange?.(v ?? '')}
        options={{
          readOnly,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 13,
          lineNumbers: 'on',
          formatOnPaste: true,
          formatOnType: true,
          tabSize: 2,
        }}
        beforeMount={(monaco) => {
          if (schema) {
            monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
              validate: true,
              schemas: [{ uri: 'http://schema/current', fileMatch: ['*'], schema }],
            });
          }
        }}
      />
    </div>
  );
}
```

## Step 6: Status Badge

```typescript
// apps/web/components/ui/status-badge.tsx
import { Badge } from './badge';
import { cn } from '@/lib/utils';

type Status = 'active' | 'inactive' | 'healthy' | 'unhealthy' | 'degraded' | 'unknown' | 'pending' | 'error';

const statusConfig: Record<Status, { label: string; className: string }> = {
  active:    { label: 'Active',    className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
  inactive:  { label: 'Inactive',  className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  healthy:   { label: 'Healthy',   className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
  unhealthy: { label: 'Unhealthy', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  degraded:  { label: 'Degraded',  className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
  unknown:   { label: 'Unknown',   className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  pending:   { label: 'Pending',   className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  error:     { label: 'Error',     className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
};

export function StatusBadge({ status }: { status: Status }) {
  const config = statusConfig[status] ?? statusConfig.unknown;
  return (
    <Badge className={cn('text-xs font-medium border-0', config.className)}>
      <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-current" />
      {config.label}
    </Badge>
  );
}
```

## Step 7: Page Header Pattern

```typescript
// apps/web/components/ui/page-header.tsx
import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
```

## Animation Patterns (Framer Motion)

```typescript
// Page entrance
const pageVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};
<motion.div variants={pageVariants} initial="hidden" animate="visible">

// Staggered list
const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};
const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0 },
};

// Card hover
<motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
```

## Rules

- All components are in `apps/web/components/` — shared primitives in `packages/ui/src/`
- Monaco Editor always loaded with `dynamic(() => import(...), { ssr: false })` — never server-side
- Use `cn()` from `@/lib/utils` (clsx + tailwind-merge) for conditional classNames
- All icons from `lucide-react` only — never inline SVGs for icons
- Skeletons must match the shape of the content they replace — no generic full-width spinners
- Colors only via semantic Tailwind variables — never hardcode `text-indigo-500` for semantic UI elements
- All interactive cards: `hover:shadow-md transition-shadow` and `cursor-pointer`
- Forms always show validation errors inline via `FormMessage` — never `alert()` or `console.error()`
- Tables always wrapped in `rounded-xl border overflow-hidden` — never raw `<table>`
