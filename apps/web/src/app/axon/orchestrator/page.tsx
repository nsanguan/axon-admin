'use client';

import { AppShell } from '../../../components/layout/AppShell';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { apiClient } from '../../../lib/api';

const STATUS_COLORS: Record<string, string> = {
  done: 'bg-green-100 text-green-700 border-green-300',
  running: 'bg-blue-100 text-blue-700 border-blue-300',
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  error: 'bg-red-100 text-red-700 border-red-300',
  hitl_pending: 'bg-purple-100 text-purple-700 border-purple-300',
};

const STATUS_LINE: Record<string, string> = {
  done: 'bg-green-400',
  running: 'bg-blue-400 animate-pulse',
  pending: 'bg-gray-300',
  error: 'bg-red-400',
  hitl_pending: 'bg-purple-400',
};

interface Stage {
  id: string;
  stageNumber: number;
  stageName: string;
  status: string;
  inputJson?: string;
  outputJson?: string;
  errorMessage?: string;
  startedAt?: string;
  endedAt?: string;
}

interface RunDetail {
  id: string;
  prompt: string;
  model?: string;
  status: string;
  totalDurationMs?: number;
  totalInputTokens?: number;
  totalOutputTokens?: number;
  createdAt: string;
  stages: Stage[];
  user?: { email: string };
}

export default function OrchestratorDetailPage() {
  const params = useSearchParams();
  const id = params.get('id');

  const { data: run, isLoading } = useQuery<RunDetail>({
    queryKey: ['orch-detail', id],
    queryFn: () => apiClient.get(`/axon/orchestrator-runs/${id}`).then((r) => r.data),
    enabled: !!id,
    refetchInterval: (q) => q.state.data?.status === 'running' ? 3000 : false,
  });

  if (!id) return (
    <AppShell>
      <p className="text-[var(--muted-foreground)]">No run ID provided.</p>
    </AppShell>
  );

  if (isLoading) return (
    <AppShell>
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-[var(--muted)] rounded w-64" />
        <div className="h-4 bg-[var(--muted)] rounded w-96" />
        <div className="space-y-3 mt-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 bg-[var(--muted)] rounded-xl" />
          ))}
        </div>
      </div>
    </AppShell>
  );

  if (!run) return (
    <AppShell>
      <p className="text-[var(--muted-foreground)]">Run not found.</p>
    </AppShell>
  );

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Orchestrator Run</h1>
            <span className={`px-2 py-0.5 rounded-full text-xs border ${STATUS_COLORS[run.status] || 'bg-gray-100'}`}>{run.status}</span>
          </div>
          <p className="text-sm text-[var(--muted-foreground)] mt-1 font-mono">{run.id}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-[var(--border)] p-4">
            <p className="text-xs text-[var(--muted-foreground)] uppercase">Model</p>
            <p className="font-semibold mt-0.5">{run.model || '—'}</p>
          </div>
          <div className="rounded-xl border border-[var(--border)] p-4">
            <p className="text-xs text-[var(--muted-foreground)] uppercase">Duration</p>
            <p className="font-semibold mt-0.5">{run.totalDurationMs != null ? `${(run.totalDurationMs / 1000).toFixed(2)}s` : '—'}</p>
          </div>
          <div className="rounded-xl border border-[var(--border)] p-4">
            <p className="text-xs text-[var(--muted-foreground)] uppercase">Tokens In/Out</p>
            <p className="font-semibold mt-0.5">{run.totalInputTokens != null ? `${run.totalInputTokens} / ${run.totalOutputTokens}` : '—'}</p>
          </div>
          <div className="rounded-xl border border-[var(--border)] p-4">
            <p className="text-xs text-[var(--muted-foreground)] uppercase">User</p>
            <p className="font-semibold mt-0.5 truncate">{run.user?.email || '—'}</p>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--border)] p-4">
          <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wide mb-2">Prompt</p>
          <p className="text-sm whitespace-pre-wrap">{run.prompt}</p>
        </div>

        {/* Pipeline visualization */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Pipeline Stages ({run.stages.length})</h2>
          <div className="relative">
            {run.stages.map((stage, idx) => (
              <div key={stage.id} className="flex gap-4 mb-1">
                {/* connector line */}
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full border-2 mt-4 flex-shrink-0 ${STATUS_COLORS[stage.status]?.includes('green') ? 'bg-green-500 border-green-500' : STATUS_COLORS[stage.status]?.includes('blue') ? 'bg-blue-500 border-blue-500' : STATUS_COLORS[stage.status]?.includes('red') ? 'bg-red-500 border-red-500' : STATUS_COLORS[stage.status]?.includes('purple') ? 'bg-purple-500 border-purple-500' : 'bg-gray-300 border-gray-300'}`} />
                  {idx < run.stages.length - 1 && <div className={`w-0.5 flex-1 mt-1 ${STATUS_LINE[stage.status]}`} style={{ minHeight: '2rem' }} />}
                </div>
                <div className={`flex-1 rounded-xl border p-4 mb-3 ${STATUS_COLORS[stage.status] ? 'border-current' : 'border-[var(--border)]'}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <span className="text-xs text-[var(--muted-foreground)] mr-2">Stage {stage.stageNumber}</span>
                      <span className="font-semibold">{stage.stageName}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs border ${STATUS_COLORS[stage.status] || 'bg-gray-100'}`}>{stage.status}</span>
                  </div>
                  {stage.errorMessage && (
                    <p className="mt-2 text-xs text-red-600 bg-red-50 rounded p-2">{stage.errorMessage}</p>
                  )}
                  {(stage.startedAt || stage.endedAt) && (
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                      {stage.startedAt ? `Started: ${new Date(stage.startedAt).toLocaleTimeString()}` : ''}
                      {stage.startedAt && stage.endedAt ? ' · ' : ''}
                      {stage.endedAt && stage.startedAt ? `${((new Date(stage.endedAt).getTime() - new Date(stage.startedAt).getTime()) / 1000).toFixed(2)}s` : ''}
                    </p>
                  )}
                  {stage.outputJson && stage.status === 'done' && (
                    <details className="mt-2">
                      <summary className="text-xs text-[var(--muted-foreground)] cursor-pointer hover:text-[var(--foreground)]">Output JSON</summary>
                      <pre className="mt-1 text-xs bg-[var(--muted)] rounded p-2 overflow-auto max-h-40">{JSON.stringify(JSON.parse(stage.outputJson), null, 2)}</pre>
                    </details>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
