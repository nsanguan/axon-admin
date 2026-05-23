'use client';

import { AppShell } from '../../components/layout/AppShell';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api';
import { toast } from 'sonner';

interface ApiToken {
  id: string;
  name: string;
  tokenPrefix: string;
  scopes: string | null;
  expiresAt: string | null;
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
}

export default function TokensPage() {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [createdToken, setCreatedToken] = useState<string | null>(null);

  const { data: tokens = [], isLoading } = useQuery<ApiToken[]>({
    queryKey: ['api-tokens'],
    queryFn: () => apiClient.get('/tokens').then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (n: string) => apiClient.post('/tokens', { name: n }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['api-tokens'] });
      setCreatedToken(res.data.rawToken);
      setName('');
      toast.success('Token created — copy it now, it will not be shown again');
    },
    onError: () => toast.error('Failed to create token'),
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/tokens/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['api-tokens'] }); toast.success('Token revoked'); },
    onError: () => toast.error('Failed to revoke token'),
  });

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">API Tokens</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">Manage personal API tokens for programmatic access</p>
        </div>

        {/* Create token */}
        <div className="rounded-xl border border-[var(--border)] p-5">
          <h2 className="font-semibold mb-3 text-sm">Create New Token</h2>
          <div className="flex gap-3">
            <input type="text" placeholder="Token name..." className="border border-[var(--border)] rounded-lg px-3 py-2 text-sm bg-[var(--background)] flex-1" value={name} onChange={(e) => setName(e.target.value)} />
            <button onClick={() => name && createMutation.mutate(name)} disabled={!name || createMutation.isPending} className="px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-sm font-medium disabled:opacity-50">
              {createMutation.isPending ? 'Creating...' : 'Create Token'}
            </button>
          </div>
          {createdToken && (
            <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <p className="text-xs font-medium text-yellow-800 dark:text-yellow-400 mb-1">Copy this token now — it will not be shown again</p>
              <div className="flex items-center gap-2">
                <code className="text-xs font-mono bg-white dark:bg-black/20 px-2 py-1 rounded border flex-1 break-all">{createdToken}</code>
                <button onClick={() => { navigator.clipboard.writeText(createdToken); toast.success('Copied!'); }} className="text-xs px-2 py-1 rounded border border-[var(--border)] hover:bg-[var(--muted)]">Copy</button>
              </div>
            </div>
          )}
        </div>

        {/* Token list */}
        <div className="rounded-xl border border-[var(--border)] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[var(--muted)] text-[var(--muted-foreground)] text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Prefix</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Last Used</th>
                <th className="px-4 py-3 text-left">Expires</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} className="border-t border-[var(--border)]">{Array.from({ length: 6 }).map((_, j) => (<td key={j} className="px-4 py-3"><div className="h-4 bg-[var(--muted)] rounded animate-pulse" /></td>))}</tr>
              )) : tokens.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-[var(--muted-foreground)]">No tokens yet</td></tr>
              ) : tokens.map((t) => (
                <tr key={t.id} className="border-t border-[var(--border)] hover:bg-[var(--muted)]/40 transition-colors">
                  <td className="px-4 py-3 font-medium">{t.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-[var(--muted-foreground)]">{t.tokenPrefix}...</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${t.revokedAt ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {t.revokedAt ? 'Revoked' : 'Active'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)] text-xs">{t.lastUsedAt ? new Date(t.lastUsedAt).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)] text-xs">{t.expiresAt ? new Date(t.expiresAt).toLocaleDateString() : 'Never'}</td>
                  <td className="px-4 py-3 text-right">
                    {!t.revokedAt && (
                      <button onClick={() => { if (confirm('Revoke this token?')) revokeMutation.mutate(t.id); }} className="text-xs px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 transition-colors">Revoke</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
