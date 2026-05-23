'use client';

import { AppShell } from '../../components/layout/AppShell';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api';
import { toast } from 'sonner';
import { useState } from 'react';

interface FeatureFlag {
  id: string;
  name: string;
  key: string;
  type: string;
  defaultValueJson: string;
  isActive: boolean;
}

interface Environment {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  _count: { envVariables: number };
}

export default function SettingsPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'flags' | 'environments'>('flags');

  const { data: flags = [], isLoading: flagsLoading } = useQuery<FeatureFlag[]>({
    queryKey: ['feature-flags'],
    queryFn: () => apiClient.get('/settings/feature-flags').then((r) => r.data),
  });

  const { data: envs = [], isLoading: envsLoading } = useQuery<Environment[]>({
    queryKey: ['environments'],
    queryFn: () => apiClient.get('/settings/environments').then((r) => r.data),
  });

  const toggleFlagMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiClient.patch(`/settings/feature-flags/${id}/toggle`, { isActive }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['feature-flags'] }); toast.success('Flag updated'); },
    onError: () => toast.error('Failed to update flag'),
  });

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">Feature flags, environments, and system configuration</p>
        </div>

        <div className="flex gap-2 border-b border-[var(--border)]">
          {(['flags', 'environments'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${ tab === t ? 'border-[var(--primary)] text-[var(--primary)]' : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]' }`}>{t.replace('-', ' ')}</button>
          ))}
        </div>

        {tab === 'flags' && (
          <div className="rounded-xl border border-[var(--border)] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[var(--muted)] text-[var(--muted-foreground)] text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left">Flag</th>
                  <th className="px-4 py-3 text-left">Key</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Default</th>
                  <th className="px-4 py-3 text-right">Enabled</th>
                </tr>
              </thead>
              <tbody>
                {flagsLoading ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-t border-[var(--border)]">{Array.from({ length: 5 }).map((_, j) => (<td key={j} className="px-4 py-3"><div className="h-4 bg-[var(--muted)] rounded animate-pulse" /></td>))}</tr>
                )) : flags.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-[var(--muted-foreground)]">No feature flags</td></tr>
                ) : flags.map((f) => (
                  <tr key={f.id} className="border-t border-[var(--border)] hover:bg-[var(--muted)]/40">
                    <td className="px-4 py-3 font-medium">{f.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-[var(--muted-foreground)]">{f.key}</td>
                    <td className="px-4 py-3 text-[var(--muted-foreground)]">{f.type}</td>
                    <td className="px-4 py-3 font-mono text-xs">{f.defaultValueJson}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => toggleFlagMutation.mutate({ id: f.id, isActive: !f.isActive })} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${ f.isActive ? 'bg-[var(--primary)]' : 'bg-[var(--muted-foreground)]/30' }`}>
                        <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${ f.isActive ? 'translate-x-6' : 'translate-x-1' }`} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'environments' && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {envsLoading ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-[var(--border)] p-5 animate-pulse h-28" />
            )) : envs.length === 0 ? (
              <p className="text-[var(--muted-foreground)] col-span-3">No environments configured</p>
            ) : envs.map((e) => (
              <div key={e.id} className="rounded-xl border border-[var(--border)] p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{e.name}</p>
                    <p className="text-xs text-[var(--muted-foreground)] mt-0.5 font-mono">{e.slug}</p>
                  </div>
                  {e.isActive && <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">Active</span>}
                </div>
                <p className="mt-3 text-xs text-[var(--muted-foreground)]">{e._count.envVariables} variables</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
      <p className="text-[var(--muted-foreground)]">Coming soon — Phase implementation in progress.</p>
    </AppShell>
  );
}
