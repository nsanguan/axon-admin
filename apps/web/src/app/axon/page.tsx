'use client';

import { AppShell } from '../../components/layout/AppShell';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/api';
import Link from 'next/link';

const STATUS_COLORS: Record<string, string> = {
  done: 'bg-green-100 text-green-700',
  running: 'bg-blue-100 text-blue-700',
  pending: 'bg-yellow-100 text-yellow-700',
  error: 'bg-red-100 text-red-700',
  hitl_pending: 'bg-purple-100 text-purple-700',
};

interface OrchRun {
  id: string;
  prompt: string;
  model?: string;
  status: string;
  totalDurationMs?: number;
  totalInputTokens?: number;
  totalOutputTokens?: number;
  createdAt: string;
  user?: { email: string };
}

interface AgentRun {
  id: string;
  agentName: string;
  modelMode: string;
  modelName?: string;
  prompt: string;
  status: string;
  totalDurationMs?: number;
  inputTokens?: number;
  outputTokens?: number;
  errorMessage?: string;
  createdAt: string;
  user?: { email: string };
}

interface Paginated<T> { data: T[]; total: number; page: number; totalPages: number; }

export default function AxonPage() {
  const [tab, setTab] = useState<'orchestrator' | 'agents'>('orchestrator');
  const [orchPage, setOrchPage] = useState(1);
  const [agentPage, setAgentPage] = useState(1);

  const { data: stats } = useQuery({
    queryKey: ['axon-stats'],
    queryFn: () => apiClient.get('/axon/stats').then((r) => r.data),
    refetchInterval: 30000,
  });

  const { data: orchData, isLoading: orchLoading } = useQuery<Paginated<OrchRun>>({
    queryKey: ['axon-orch', orchPage],
    queryFn: () => apiClient.get('/axon/orchestrator-runs', { params: { page: orchPage } }).then((r) => r.data),
    enabled: tab === 'orchestrator',
  });

  const { data: agentData, isLoading: agentLoading } = useQuery<Paginated<AgentRun>>({
    queryKey: ['axon-agents', agentPage],
    queryFn: () => apiClient.get('/axon/ai-agent-runs', { params: { page: agentPage } }).then((r) => r.data),
    enabled: tab === 'agents',
  });

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">AXON System</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">Orchestrator runs and AI agent activity</p>
        </div>

        {stats && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-[var(--border)] p-5">
              <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wide">Orchestrator Runs</p>
              <p className="text-3xl font-bold mt-1">{stats.orchTotal}</p>
            </div>
            <div className="rounded-xl border border-[var(--border)] p-5">
              <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wide">AI Agent Runs</p>
              <p className="text-3xl font-bold mt-1">{stats.agentTotal}</p>
            </div>
            {stats.orchByStatus?.map((s: { status: string; _count: { id: number } }) => (
              <div key={s.status} className="rounded-xl border border-[var(--border)] p-5">
                <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wide">Orch {s.status}</p>
                <p className="text-3xl font-bold mt-1">{s._count.id}</p>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 border-b border-[var(--border)]">
          {(['orchestrator', 'agents'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${ tab === t ? 'border-[var(--primary)] text-[var(--primary)]' : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]' }`}>{t === 'orchestrator' ? 'Orchestrator Runs' : 'AI Agent Runs'}</button>
          ))}
        </div>

        {tab === 'orchestrator' && (
          <div className="space-y-3">
            <div className="rounded-xl border border-[var(--border)] overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-[var(--muted)] text-[var(--muted-foreground)] text-xs uppercase tracking-wide">
                  <tr>
                    <th className="px-4 py-3 text-left">Prompt</th>
                    <th className="px-4 py-3 text-left">Model</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Tokens</th>
                    <th className="px-4 py-3 text-left">Duration</th>
                    <th className="px-4 py-3 text-left">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {orchLoading ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-t border-[var(--border)]">{Array.from({ length: 6 }).map((_, j) => (<td key={j} className="px-4 py-3"><div className="h-4 bg-[var(--muted)] rounded animate-pulse" /></td>))}</tr>
                  )) : orchData?.data.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-10 text-center text-[var(--muted-foreground)]">No orchestrator runs</td></tr>
                  ) : orchData?.data.map((r) => (
                    <tr key={r.id} className="border-t border-[var(--border)] hover:bg-[var(--muted)]/40">
                      <td className="px-4 py-3 max-w-xs truncate" title={r.prompt}>
                        <Link href={`/axon/orchestrator?id=${r.id}`} className="hover:underline text-[var(--primary)]">{r.prompt.slice(0, 60)}{r.prompt.length > 60 ? '…' : ''}</Link>
                      </td>
                      <td className="px-4 py-3 text-[var(--muted-foreground)] font-mono text-xs">{r.model || '—'}</td>
                      <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_COLORS[r.status] || 'bg-gray-100 text-gray-600'}`}>{r.status}</span></td>
                      <td className="px-4 py-3 text-[var(--muted-foreground)] text-xs">{r.totalInputTokens != null ? `${r.totalInputTokens}↑ ${r.totalOutputTokens}↓` : '—'}</td>
                      <td className="px-4 py-3 text-[var(--muted-foreground)] text-xs">{r.totalDurationMs != null ? `${(r.totalDurationMs / 1000).toFixed(1)}s` : '—'}</td>
                      <td className="px-4 py-3 text-[var(--muted-foreground)] text-xs">{new Date(r.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {orchData && orchData.totalPages > 1 && (
              <div className="flex items-center justify-between text-sm text-[var(--muted-foreground)]">
                <span>{orchData.total} total</span>
                <div className="flex gap-2">
                  <button onClick={() => setOrchPage((p) => Math.max(1, p - 1))} disabled={orchPage === 1} className="px-3 py-1 rounded border border-[var(--border)] disabled:opacity-40">Prev</button>
                  <span className="px-3 py-1">{orchPage} / {orchData.totalPages}</span>
                  <button onClick={() => setOrchPage((p) => Math.min(orchData.totalPages, p + 1))} disabled={orchPage === orchData.totalPages} className="px-3 py-1 rounded border border-[var(--border)] disabled:opacity-40">Next</button>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'agents' && (
          <div className="space-y-3">
            <div className="rounded-xl border border-[var(--border)] overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-[var(--muted)] text-[var(--muted-foreground)] text-xs uppercase tracking-wide">
                  <tr>
                    <th className="px-4 py-3 text-left">Agent</th>
                    <th className="px-4 py-3 text-left">Mode</th>
                    <th className="px-4 py-3 text-left">Prompt</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Tokens</th>
                    <th className="px-4 py-3 text-left">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {agentLoading ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-t border-[var(--border)]">{Array.from({ length: 6 }).map((_, j) => (<td key={j} className="px-4 py-3"><div className="h-4 bg-[var(--muted)] rounded animate-pulse" /></td>))}</tr>
                  )) : agentData?.data.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-10 text-center text-[var(--muted-foreground)]">No AI agent runs</td></tr>
                  ) : agentData?.data.map((r) => (
                    <tr key={r.id} className="border-t border-[var(--border)] hover:bg-[var(--muted)]/40">
                      <td className="px-4 py-3 font-medium">{r.agentName}</td>
                      <td className="px-4 py-3 text-xs font-mono text-[var(--muted-foreground)]">{r.modelMode}</td>
                      <td className="px-4 py-3 max-w-xs truncate text-[var(--muted-foreground)]" title={r.prompt}>{r.prompt.slice(0, 50)}{r.prompt.length > 50 ? '…' : ''}</td>
                      <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_COLORS[r.status] || 'bg-gray-100 text-gray-600'}`}>{r.status}</span></td>
                      <td className="px-4 py-3 text-[var(--muted-foreground)] text-xs">{r.inputTokens != null ? `${r.inputTokens}↑ ${r.outputTokens}↓` : '—'}</td>
                      <td className="px-4 py-3 text-[var(--muted-foreground)] text-xs">{new Date(r.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {agentData && agentData.totalPages > 1 && (
              <div className="flex items-center justify-between text-sm text-[var(--muted-foreground)]">
                <span>{agentData.total} total</span>
                <div className="flex gap-2">
                  <button onClick={() => setAgentPage((p) => Math.max(1, p - 1))} disabled={agentPage === 1} className="px-3 py-1 rounded border border-[var(--border)] disabled:opacity-40">Prev</button>
                  <span className="px-3 py-1">{agentPage} / {agentData.totalPages}</span>
                  <button onClick={() => setAgentPage((p) => Math.min(agentData.totalPages, p + 1))} disabled={agentPage === agentData.totalPages} className="px-3 py-1 rounded border border-[var(--border)] disabled:opacity-40">Next</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}

