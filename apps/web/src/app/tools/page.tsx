'use client';

import { AppShell } from '../../components/layout/AppShell';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api';
import { toast } from 'sonner';

interface Tool {
  id: string;
  name: string;
  description?: string;
  status: string;
  category?: { name: string };
  plugin?: { name: string };
}

interface PaginatedTools {
  data: Tool[];
  total: number;
  page: number;
  totalPages: number;
}

export default function ToolsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery<PaginatedTools>({
    queryKey: ['tools', search, page],
    queryFn: () =>
      apiClient.get('/tools', { params: { search: search || undefined, page } }).then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/tools/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tools'] }); toast.success('Tool deleted'); },
    onError: () => toast.error('Failed to delete tool'),
  });

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Tools Management</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">Browse and manage MCP tools</p>
        </div>
        <div className="flex gap-3">
          <input type="text" placeholder="Search tools..." className="border border-[var(--border)] rounded-lg px-3 py-2 text-sm bg-[var(--background)] w-60" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <div className="rounded-xl border border-[var(--border)] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[var(--muted)] text-[var(--muted-foreground)] text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Description</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-left">Plugin</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-t border-[var(--border)]">{Array.from({ length: 5 }).map((_, j) => (<td key={j} className="px-4 py-3"><div className="h-4 bg-[var(--muted)] rounded animate-pulse" /></td>))}</tr>
              )) : data?.data.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-[var(--muted-foreground)]">No tools found</td></tr>
              ) : data?.data.map((t) => (
                <tr key={t.id} className="border-t border-[var(--border)] hover:bg-[var(--muted)]/40 transition-colors">
                  <td className="px-4 py-3 font-medium">{t.name}</td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)] truncate max-w-[220px]">{t.description || '—'}</td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">{t.category?.name || '—'}</td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">{t.plugin?.name || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => { if (confirm('Delete this tool?')) deleteMutation.mutate(t.id); }} className="text-xs px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 transition-colors">Delete</button>
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
