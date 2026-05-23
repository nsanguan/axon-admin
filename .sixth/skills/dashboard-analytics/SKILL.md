---
name: dashboard-analytics
description: Build dashboard KPI widgets, Recharts analytics panels, and real-time metric displays for the AXON Admin platform. Use when creating dashboard pages, adding new chart types, wiring up the metrics API, implementing the KPI summary cards, or integrating live WebSocket metrics updates.
---

# Dashboard & Analytics — AXON Admin

## Dashboard Page Architecture

```
app/(dashboard)/page.tsx
  └── DashboardPage (server component — fetches initial data)
        ├── KpiGrid          (9 KPI cards — TanStack Query polling)
        ├── UsageChart       (daily usage line chart — Recharts)
        ├── ToolChart        (execution bar chart — Recharts)
        ├── LatencyChart     (P50/P95/P99 area chart — Recharts)
        ├── ErrorChart       (donut chart — Recharts)
        ├── AxonStatusBanner (AXON agent health row)
        └── RecentActivity   (latest 10 audit log entries)
```

## Step 1: NestJS Dashboard Module

```typescript
// apps/api/src/dashboard/dashboard.module.ts
import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AxonModule } from '../axon/axon.module';

@Module({
  imports: [PrismaModule, AxonModule],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
```

```typescript
// apps/api/src/dashboard/dashboard.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AxonService } from '../axon/axon.service';
import type { KpiMetrics, ChartData } from '@axon/types';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly axon: AxonService,
  ) {}

  async getKpiMetrics(): Promise<KpiMetrics> {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    const [
      totalPlugins, activePlugins, totalTools,
      logs24h, logsPrev24h, activeTokens, activeUsers24h,
      kpis,
    ] = await Promise.all([
      this.prisma.plugin.count({ where: { deletedAt: null } }),
      this.prisma.plugin.count({ where: { deletedAt: null, status: 'active' } }),
      this.prisma.tool.count({ where: { deletedAt: null } }),
      this.prisma.systemLog.findMany({
        where: { createdAt: { gte: yesterday } },
        select: { level: true, contextJson: true, createdAt: true },
      }),
      this.prisma.systemLog.findMany({
        where: { createdAt: { gte: twoDaysAgo, lt: yesterday } },
        select: { level: true },
      }),
      this.prisma.apiToken.count({ where: { revokedAt: null, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] } }),
      this.prisma.auditLog.findMany({
        where: { createdAt: { gte: yesterday } },
        select: { userId: true },
        distinct: ['userId'],
      }),
      this.axon.getKpis().catch(() => []),
    ]);

    const errorLogs = logs24h.filter(l => l.level === 'ERROR');
    const prevErrorLogs = logsPrev24h.filter(l => l.level === 'ERROR');

    // Compute avg latency from execution logs context
    const latencies = logs24h
      .filter(l => (l.contextJson as any)?.durationMs)
      .map(l => (l.contextJson as any).durationMs as number);
    const avgLatencyMs = latencies.length
      ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
      : 0;

    const requestVolume = logs24h.filter(l => l.level === 'HTTP').length;
    const prevVolume = logsPrev24h.filter(l => l.level === 'HTTP').length;
    const errorRate = requestVolume ? Math.round((errorLogs.length / requestVolume) * 100) : 0;

    return {
      totalPlugins,
      activePlugins,
      totalTools,
      requestVolume24h: requestVolume,
      failedRequests24h: errorLogs.length,
      errorRate,
      avgLatencyMs,
      activeTokens,
      systemHealth: errorRate > 10 ? 'critical' : errorRate > 5 ? 'degraded' : 'healthy',
      activeUsers24h: activeUsers24h.length,
      trends: {
        requestVolume: prevVolume ? Math.round(((requestVolume - prevVolume) / prevVolume) * 100) : 0,
        errorRate: prevErrorLogs.length ? Math.round(((errorLogs.length - prevErrorLogs.length) / prevErrorLogs.length) * 100) : 0,
        latency: 0, // computed similarly if stored
      },
    };
  }

  async getChartData(days = 7): Promise<ChartData> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const logs = await this.prisma.systemLog.findMany({
      where: { createdAt: { gte: since }, level: 'HTTP' },
      select: { createdAt: true, level: true, contextJson: true },
      orderBy: { createdAt: 'asc' },
    });

    // Group by day
    const byDay = new Map<string, number>();
    for (const log of logs) {
      const day = log.createdAt.toISOString().slice(0, 10);
      byDay.set(day, (byDay.get(day) ?? 0) + 1);
    }

    const dailyUsage = Array.from(byDay.entries()).map(([timestamp, value]) => ({ timestamp, value }));

    // Tool execution breakdown
    const executions = await this.prisma.toolExecutionLog.groupBy({
      by: ['toolId'],
      where: { createdAt: { gte: since } },
      _count: { toolId: true },
    });

    const toolIds = executions.map(e => e.toolId);
    const tools = await this.prisma.tool.findMany({
      where: { id: { in: toolIds } },
      include: { category: true },
    });
    const toolMap = new Map(tools.map(t => [t.id, t]));

    const toolExecutions = executions.map(e => ({
      category: toolMap.get(e.toolId)?.category?.name ?? 'Uncategorized',
      count: e._count.toolId,
      successRate: 100, // simplified — join with status for real value
    }));

    return {
      dailyUsage,
      toolExecutions,
      latencyPercentiles: [], // populated from execution logs
      errorBreakdown: [],    // populated from error logs
    };
  }
}
```

## Step 2: Dashboard Controller

```typescript
// apps/api/src/dashboard/dashboard.controller.ts
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('metrics')
  @Roles('viewer', 'operator', 'admin', 'super_admin')
  getMetrics() {
    return this.service.getKpiMetrics();
  }

  @Get('charts')
  @Roles('viewer', 'operator', 'admin', 'super_admin')
  getCharts(@Query('days') days = '7') {
    return this.service.getChartData(Number(days));
  }
}
```

## Step 3: Frontend — KPI Grid

```typescript
// apps/web/components/dashboard/kpi-grid.tsx
'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { KpiCard } from './kpi-card';
import { useLiveMetrics } from '@/hooks/use-live-metrics';
import {
  Puzzle, Wrench, Activity, AlertCircle, Key,
  Heart, Timer, TrendingUp, Users,
} from 'lucide-react';
import type { KpiMetrics } from '@axon/types';

export function KpiGrid() {
  const { data, isLoading } = useQuery<KpiMetrics>({
    queryKey: ['dashboard', 'metrics'],
    queryFn: () => api.get('/dashboard/metrics').then(r => r.data),
    refetchInterval: 30_000,
  });

  const live = useLiveMetrics(); // WebSocket overrides
  const metrics = { ...data, ...live } as KpiMetrics;

  const cards = [
    { title: 'Total Plugins',     value: metrics.totalPlugins ?? 0,         icon: Puzzle,     trend: undefined },
    { title: 'Active Plugins',    value: metrics.activePlugins ?? 0,        icon: Wrench,     trend: undefined },
    { title: 'Request Volume',    value: metrics.requestVolume24h ?? 0,     icon: Activity,   trend: metrics.trends?.requestVolume, unit: '/24h' },
    { title: 'Failed Requests',   value: metrics.failedRequests24h ?? 0,    icon: AlertCircle,trend: metrics.trends?.errorRate },
    { title: 'Active Tokens',     value: metrics.activeTokens ?? 0,         icon: Key,        trend: undefined },
    { title: 'System Health',     value: metrics.systemHealth ?? 'unknown', icon: Heart,      trend: undefined },
    { title: 'Avg Latency',       value: metrics.avgLatencyMs ?? 0,         icon: Timer,      unit: 'ms', trend: metrics.trends?.latency },
    { title: 'Error Rate',        value: `${metrics.errorRate ?? 0}%`,      icon: TrendingUp, trend: metrics.trends?.errorRate },
    { title: 'Active Users',      value: metrics.activeUsers24h ?? 0,       icon: Users,      unit: '/24h', trend: undefined },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {cards.map(card => (
        <KpiCard key={card.title} {...card} isLoading={isLoading} />
      ))}
    </div>
  );
}
```

## Step 4: Charts with Recharts

```typescript
// apps/web/components/dashboard/usage-chart.tsx
'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { ChartData } from '@axon/types';
import { format, parseISO } from 'date-fns';

export function UsageChart() {
  const { data, isLoading } = useQuery<ChartData>({
    queryKey: ['dashboard', 'charts'],
    queryFn: () => api.get('/dashboard/charts?days=7').then(r => r.data),
    refetchInterval: 60_000,
  });

  if (isLoading) return <Skeleton className="h-80 w-full rounded-xl" />;

  const chartData = (data?.dailyUsage ?? []).map(p => ({
    date: format(parseISO(p.timestamp), 'MMM dd'),
    requests: p.value,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Daily Request Volume</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="date" className="text-xs text-muted-foreground" tick={{ fill: 'currentColor' }} />
            <YAxis className="text-xs text-muted-foreground" tick={{ fill: 'currentColor' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                borderColor: 'hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Legend />
            <Line
              type="monotone" dataKey="requests" name="Requests"
              stroke="hsl(var(--primary))" strokeWidth={2}
              dot={{ fill: 'hsl(var(--primary))', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
```

```typescript
// apps/web/components/dashboard/error-chart.tsx
'use client';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const COLORS = ['hsl(var(--destructive))', 'hsl(220 70% 60%)', 'hsl(40 80% 60%)', 'hsl(160 60% 50%)'];

export function ErrorChart({ data }: { data: Array<{ type: string; count: number; percentage: number }> }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Error Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={90}
              dataKey="count" nameKey="type" paddingAngle={3}
            >
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip formatter={(value, name) => [`${value} errors`, name]} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
```

## Step 5: AXON Status Banner

```typescript
// apps/web/components/dashboard/axon-status-banner.tsx
'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Cpu } from 'lucide-react';
import type { AxonAgent } from '@axon/types';

export function AxonStatusBanner() {
  const { data: agents = [] } = useQuery<AxonAgent[]>({
    queryKey: ['axon', 'agents'],
    queryFn: () => api.get('/mcp/agents').then(r => r.data),
    refetchInterval: 30_000,
  });

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Cpu className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">AXON Domain Agents</span>
        </div>
        <div className="flex flex-wrap gap-3">
          {agents.map(agent => (
            <div key={agent.agentId} className="flex items-center gap-2">
              <StatusBadge status={agent.status as any} />
              <span className="text-xs text-muted-foreground">{agent.agentType}</span>
            </div>
          ))}
          {agents.length === 0 && (
            <p className="text-xs text-muted-foreground">No agents available</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

## Step 6: Full Dashboard Page

```typescript
// apps/web/app/(dashboard)/page.tsx
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { KpiGrid } from '@/components/dashboard/kpi-grid';
import { UsageChart } from '@/components/dashboard/usage-chart';
import { ErrorChart } from '@/components/dashboard/error-chart';
import { AxonStatusBanner } from '@/components/dashboard/axon-status-banner';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata: Metadata = { title: 'Dashboard' };

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Real-time overview of your AXON MCP platform"
      />

      {/* KPI Cards */}
      <Suspense fallback={<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5"><Skeleton className="h-32" /></div>}>
        <KpiGrid />
      </Suspense>

      {/* AXON Agents */}
      <Suspense fallback={<Skeleton className="h-20 rounded-xl" />}>
        <AxonStatusBanner />
      </Suspense>

      {/* Charts — 2-column grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Suspense fallback={<Skeleton className="h-80 rounded-xl" />}>
          <UsageChart />
        </Suspense>
        <Suspense fallback={<Skeleton className="h-80 rounded-xl" />}>
          {/* ToolExecutionChart, LatencyChart, ErrorChart */}
        </Suspense>
      </div>
    </div>
  );
}
```

## Recharts Common Patterns

```typescript
// Always use CSS variable colors so they work in dark mode:
stroke="hsl(var(--primary))"
fill="hsl(var(--primary))"

// Always set explicit tick fill for axis labels:
tick={{ fill: 'hsl(var(--muted-foreground))' }}

// Tooltip style for dark mode:
contentStyle={{
  backgroundColor: 'hsl(var(--card))',
  borderColor: 'hsl(var(--border))',
  borderRadius: '8px',
}}

// Always wrap in ResponsiveContainer with height:
<ResponsiveContainer width="100%" height={280}>
```

## Rules

- Dashboard KPI data polls every 30s via TanStack Query `refetchInterval`
- WebSocket live metrics from `useLiveMetrics()` overlay on top of polled data — merged with spread
- Chart components are always client components (`'use client'`) — Recharts doesn't SSR
- All charts use CSS variable colors (`hsl(var(--primary))`) — never hardcoded hex values
- Dashboard page is a server component — suspense boundaries wrap each client section
- Recharts `ResponsiveContainer` always has explicit `height` (not `100%`) to avoid infinite resize loops
