'use client';

import { AppShell } from '../../components/layout/AppShell';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api';
import { toast } from 'sonner';

interface Plugin {
  id: string;
  name: string;
  endpoint: string;
  status: string;
  healthStatus: string;
  description?: string;
  group?: { name: string };
}

interface PaginatedPlugins {
  data: Plugin[];
  total: number;
  page: number;
  totalPages: number;
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  inactive: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  error: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  healthy: 'bg-green-100 text-green-800',
  unreachable: 'bg-red-100 text-red-700',
  degraded: 'bg-yellow-100 text-yellow-700',
};

export default function PluginsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery<PaginatedPlugins>({
    queryKey: ['plugins', search, status, page],
    queryFn: () =>
      apiClient
        .get('/plugins', { params: { search: search || undefined, status: status || undefined, page } })
        .then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/plugins/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['plugins'] }); toast.success('Plugin deleted'); },
    onError: () => toast.error('Failed to delete plugin'),
  });

  const healthMutation = useMutation({
    mutationFn: (id: string) => apiClient.get(`/plugins/${id}/health`),
    onSuccess: (res) => { qc.invalidateQueries({ queryKey: ['plugins'] }); toast.success(`Health: ${res.data.status}`); },
    onError: () => toast.error('Health check failed'),
  });

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Plugin Management</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">Manage MCP plugin registrations</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <input type="text" placeholder="Search plugins..." className="border border-[var(--border)] rounded-lg px-3 py-2 text-sm bg-[var(--background)] w-60" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          <select className="border border-[var(--border)] rounded-lg px-3 py-2 text-sm bg-[var(--background)]" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="error">Error</option>
          </select>
        </div>
        <div className="rounded-xl border border-[var(--border)] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[var(--muted)] text-[var(--muted-foreground)] text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Endpoint</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Health</th>
                <th className="px-4 py-3 text-left">Group</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-t border-[var(--border)]">{Array.from({ length: 6 }).map((_, j) => (<td key={j} className="px-4 py-3"><div className="h-4 bg-[var(--muted)] rounded animate-pulse" /></td>))}</tr>
              )) : data?.data.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-[var(--muted-foreground)]">No plugins found</td></tr>
              ) : data?.data.map((p) => (
                <tr key={p.id} className="border-t border-[var(--border)] hover:bg-[var(--muted)]/40 transition-colors">
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-[var(--muted-foreground)] truncate max-w-[180px]">{p.endpoint}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[p.status] || ''}`}>{p.status}</span></td>
                  <td className="px-4 py-3">{p.healthStatus && <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[p.healthStatus] || ''}`}>{p.healthStatus}</span>}</td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">{p.group?.name || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => healthMutation.mutate(p.id)} className="text-xs px-2 py-1 rounded border border-[var(--border)] hover:bg-[var(--muted)] transition-colors">Health</button>
                      <button onClick={() => { if (confirm('Delete this plugin?')) deleteMutation.mutate(p.id); }} className="text-xs px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 transition-colors">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between text-sm text-[var(--muted-foreground)]">
            <span>{data.total} total</span>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 rounded border border-[var(--border)] disabled:opacity-40">Prev</button>
              <span className="px-3 py-1">{page} / {data.totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))} disabled={page === data.totalPages} className="px-3 py-1 rounded border border-[var(--border)] disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
