'use client';

import { AppShell } from '../../../components/layout/AppShell';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api';
import { ChevronDown, ChevronUp, Search, Clock, Cpu, Loader2 } from 'lucide-react';

interface ExperienceRun {
  id: string;
  prompt?: string;
  model?: string;
  status: string;
  durationMs?: number;
  tokensUsed?: number;
  createdAt: string;
  completedAt?: string;
  stages?: { id: string; name: string; status: string }[];
}

interface ExperienceResponse { data: ExperienceRun[]; total: number; page: number; pageSize: number }

function fmt(ms?: number) {
  if (!ms) return '—';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export default function ExperienceLedgerPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery<ExperienceResponse>({
    queryKey: ['experience', page, search],
    queryFn: (): Promise<ExperienceResponse> =>
      apiClient.get('/axon/experience', { params: { page, pageSize: 20, search: search || undefined } }).then((r) => r.data as ExperienceResponse),
    placeholderData: (prev) => prev,
  });

  const runs = data?.data || [];
  const total = data?.total || 0;
  const pageCount = Math.ceil(total / 20);

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Experience Ledger</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">Completed orchestration runs — the AXON system&apos;s learned experiences</p>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 border border-[var(--border)] rounded-xl px-4 py-2 bg-[var(--background)] max-w-sm">
          <Search size={14} className="text-[var(--muted-foreground)] shrink-0" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search prompts…"
            className="flex-1 text-sm bg-transparent outline-none"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total records', value: total },
            { label: 'This page', value: runs.length },
            { label: 'Pages', value: pageCount || 1 },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-[var(--border)] p-4">
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex items-center gap-2 text-[var(--muted-foreground)] text-sm"><Loader2 size={16} className="animate-spin" /> Loading…</div>
        ) : runs.length === 0 ? (
          <div className="py-16 text-center text-[var(--muted-foreground)] text-sm">No records found</div>
        ) : (
          <div className="space-y-2">
            {runs.map((run) => {
              const expanded = expandedId === run.id;
              return (
                <div key={run.id} className="rounded-xl border border-[var(--border)] overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setExpandedId(expanded ? null : run.id)}
                    className="w-full flex items-start justify-between gap-4 p-4 hover:bg-[var(--muted)] transition-colors text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm line-clamp-2">{run.prompt || '(no prompt)'}</p>
                      <div className="flex gap-3 mt-1 text-xs text-[var(--muted-foreground)] flex-wrap">
                        <span className="flex items-center gap-1"><Clock size={10} />{new Date(run.createdAt).toLocaleString()}</span>
                        {run.model && <span className="flex items-center gap-1"><Cpu size={10} />{run.model}</span>}
                        <span>Duration: {fmt(run.durationMs)}</span>
                        {run.tokensUsed != null && <span>Tokens: {run.tokensUsed.toLocaleString()}</span>}
                        <span className="px-1.5 py-0.5 bg-[var(--muted)] rounded font-mono">{run.status}</span>
                      </div>
                    </div>
                    {expanded ? <ChevronUp size={14} className="shrink-0 mt-1" /> : <ChevronDown size={14} className="shrink-0 mt-1" />}
                  </button>

                  {expanded && (
                    <div className="border-t border-[var(--border)] p-4 bg-[var(--muted)] space-y-3 text-xs">
                      <div className="grid grid-cols-2 gap-2">
                        <div><span className="text-[var(--muted-foreground)]">Run ID </span><span className="font-mono">{run.id}</span></div>
                        <div><span className="text-[var(--muted-foreground)]">Completed </span><span>{run.completedAt ? new Date(run.completedAt).toLocaleString() : '—'}</span></div>
                      </div>
                      {run.stages && run.stages.length > 0 && (
                        <div>
                          <p className="text-[var(--muted-foreground)] mb-1">Stages</p>
                          <div className="flex flex-wrap gap-2">
                            {run.stages.map((s) => (
                              <span key={s.id} className="px-2 py-1 bg-[var(--background)] rounded border border-[var(--border)]">
                                {s.name} · <span className={s.status === 'done' ? 'text-green-600' : 'text-amber-600'}>{s.status}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pageCount > 1 && (
          <div className="flex items-center gap-2 justify-end">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-xs border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] disabled:opacity-40">
              Previous
            </button>
            <span className="text-xs text-[var(--muted-foreground)]">Page {page} of {pageCount}</span>
            <button onClick={() => setPage((p) => Math.min(pageCount, p + 1))} disabled={page === pageCount} className="px-3 py-1.5 text-xs border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] disabled:opacity-40">
              Next
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
