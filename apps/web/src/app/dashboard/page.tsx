'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/api';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';

interface Metrics {
  plugins: { active: number };
  tools: { total: number };
  requests: { total: number; failed: number; errorRate: number };
  system: { errors: number };
  users: { active: number };
  updatedAt: string;
}

interface DailyUsage {
  date: string;
  total: number;
  errors: number;
}

function KpiCard({
  label,
  value,
  color = 'text-[var(--foreground)]',
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
        {label}
      </p>
      <p className={`mt-2 text-3xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)] p-5 animate-pulse h-28" />
  );
}

export default function DashboardPage() {
  const { data: metrics, isLoading: metricsLoading } = useQuery<Metrics>({
    queryKey: ['dashboard-metrics'],
    queryFn: () => apiClient.get('/dashboard/metrics').then((r) => r.data),
    refetchInterval: 30_000,
  });

  const { data: dailyUsage = [] } = useQuery<DailyUsage[]>({
    queryKey: ['dashboard-daily-usage'],
    queryFn: () => apiClient.get('/dashboard/daily-usage').then((r) => r.data),
    refetchInterval: 60_000,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-[var(--muted-foreground)] text-sm mt-1">AXON System Overview</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-5">
        {metricsLoading ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} />)
        ) : metrics ? (
          <>
            <KpiCard label="Active Plugins" value={metrics.plugins.active} />
            <KpiCard label="Total Tools" value={metrics.tools.total} />
            <KpiCard label="Total Requests" value={metrics.requests.total} />
            <KpiCard
              label="Error Rate"
              value={`${metrics.requests.errorRate}%`}
              color={metrics.requests.errorRate > 10 ? 'text-red-500' : 'text-green-500'}
            />
            <KpiCard label="Active Users" value={metrics.users.active} />
          </>
        ) : null}
      </div>

      {dailyUsage.length > 0 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-5">
            <h2 className="text-sm font-semibold mb-4">Daily Request Volume (7d)</h2>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={dailyUsage}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="total" stroke="var(--primary)" strokeWidth={2} dot={false} name="Total" />
                <Line type="monotone" dataKey="errors" stroke="#ef4444" strokeWidth={2} dot={false} name="Errors" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-5">
            <h2 className="text-sm font-semibold mb-4">Requests vs Errors (7d)</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dailyUsage}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" fill="var(--primary)" name="Total" radius={[4, 4, 0, 0]} />
                <Bar dataKey="errors" fill="#ef4444" name="Errors" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
