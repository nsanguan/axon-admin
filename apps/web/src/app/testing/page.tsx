'use client';

import { AppShell } from '../../components/layout/AppShell';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api';
import { toast } from 'sonner';

interface TestRequest {
  id: string;
  name: string;
  protocol: string;
  endpoint?: string;
  method?: string;
  collection?: { name: string };
}

interface PaginatedRequests {
  data: TestRequest[];
  total: number;
  totalPages: number;
  page: number;
}

const PROTO_COLORS: Record<string, string> = {
  mcp: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  http: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  sse: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
};

export default function TestingPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [executing, setExecuting] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<Record<string, unknown> | null>(null);

  const { data, isLoading } = useQuery<PaginatedRequests>({
    queryKey: ['test-requests', search, page],
    queryFn: () =>
      apiClient.get('/testing/requests', { params: { search: search || undefined, page } }).then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/testing/requests/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['test-requests'] }); toast.success('Deleted'); },
    onError: () => toast.error('Delete failed'),
  });

  const execute = async (id: string) => {
    setExecuting(id);
    setLastResult(null);
    try {
      const res = await apiClient.post(`/testing/requests/${id}/execute`, {});
      setLastResult(res.data);
      toast.success(`Execution: ${res.data.status}`);
    } catch {
      toast.error('Execution failed');
    } finally {
      setExecuting(null);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">MCP Testing Console</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">Create and run API/MCP test requests</p>
        </div>
        <div className="flex gap-3">
          <input type="text" placeholder="Search requests..." className="border border-[var(--border)] rounded-lg px-3 py-2 text-sm bg-[var(--background)] w-60" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <div className="rounded-xl border border-[var(--border)] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[var(--muted)] text-[var(--muted-foreground)] text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Protocol</th>
                <th className="px-4 py-3 text-left">Method</th>
                <th className="px-4 py-3 text-left">Endpoint</th>
                <th className="px-4 py-3 text-left">Collection</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-t border-[var(--border)]">{Array.from({ length: 6 }).map((_, j) => (<td key={j} className="px-4 py-3"><div className="h-4 bg-[var(--muted)] rounded animate-pulse" /></td>))}</tr>
              )) : data?.data.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-[var(--muted-foreground)]">No test requests yet</td></tr>
              ) : data?.data.map((r) => (
                <tr key={r.id} className="border-t border-[var(--border)] hover:bg-[var(--muted)]/40 transition-colors">
                  <td className="px-4 py-3 font-medium">{r.name}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PROTO_COLORS[r.protocol] || ''}`}>{r.protocol}</span></td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">{r.method || '—'}</td>
                  <td className="px-4 py-3 font-mono text-xs text-[var(--muted-foreground)] truncate max-w-[180px]">{r.endpoint || '—'}</td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">{r.collection?.name || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => execute(r.id)} disabled={executing === r.id} className="text-xs px-2 py-1 rounded border border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-40">
                        {executing === r.id ? 'Running...' : 'Run'}
                      </button>
                      <button onClick={() => { if (confirm('Delete?')) deleteMutation.mutate(r.id); }} className="text-xs px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 transition-colors">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {lastResult && (
          <div className="rounded-xl border border-[var(--border)] p-4">
            <h3 className="font-semibold mb-2 text-sm">Last Execution Result</h3>
            <pre className="text-xs bg-[var(--muted)] rounded p-3 overflow-auto max-h-60">{JSON.stringify(lastResult, null, 2)}</pre>
          </div>
        )}
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
