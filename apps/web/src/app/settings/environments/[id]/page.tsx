'use client';

import { AppShell } from '../../../../components/layout/AppShell';
import { use, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../../lib/api';
import { Eye, EyeOff } from 'lucide-react';

interface EnvVar {
  id: string;
  key: string;
  isSecret: boolean;
  createdAt: string;
}

function SecretValue({ id }: { id: string }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <span className="flex items-center gap-1 font-mono text-xs">
      {revealed ? <span className="text-[var(--foreground)]">••••••••</span> : '••••••••'}
      <button
        onClick={() => setRevealed((v) => !v)}
        className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
      >
        {revealed ? <EyeOff size={12} /> : <Eye size={12} />}
      </button>
    </span>
  );
}

export default function EnvironmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const { data: vars = [], isLoading } = useQuery<EnvVar[]>({
    queryKey: ['env-vars', id],
    queryFn: (): Promise<EnvVar[]> =>
      apiClient.get(`/settings/environments/${id}/vars`).then((r) => r.data as EnvVar[]),
  });

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Environment Variables</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1 font-mono">{id}</p>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse h-12 bg-[var(--muted)] rounded-lg" />
            ))}
          </div>
        ) : vars.length === 0 ? (
          <div className="rounded-xl border border-[var(--border)] p-12 text-center text-[var(--muted-foreground)]">
            No variables in this environment.
          </div>
        ) : (
          <div className="rounded-xl border border-[var(--border)] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--muted)]/50">
                  <th className="text-left px-4 py-3 font-medium">Key</th>
                  <th className="text-left px-4 py-3 font-medium">Value</th>
                  <th className="text-left px-4 py-3 font-medium">Type</th>
                </tr>
              </thead>
              <tbody>
                {vars.map((v, i) => (
                  <tr key={v.id} className={i % 2 === 1 ? 'bg-[var(--muted)]/20' : ''}>
                    <td className="px-4 py-3 font-mono text-xs font-medium">{v.key}</td>
                    <td className="px-4 py-3">
                      {v.isSecret ? <SecretValue id={v.id} /> : <span className="font-mono text-xs">{'[encrypted]'}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${v.isSecret ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-[var(--muted)] text-[var(--muted-foreground)]'}`}>
                        {v.isSecret ? 'secret' : 'variable'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
