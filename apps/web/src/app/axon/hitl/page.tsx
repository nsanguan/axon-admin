'use client';

import { AppShell } from '../../../components/layout/AppShell';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Clock, MessageSquare, Loader2 } from 'lucide-react';

interface HitlRun {
  id: string;
  prompt?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  stages?: { id: string; name: string; status: string }[];
}

interface HitlResponse { data: HitlRun[]; total: number; page: number; pageSize: number }

type StatusFilter = 'hitl_pending' | 'approved' | 'rejected';

export default function HitlPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('hitl_pending');
  const [noteMap, setNoteMap] = useState<Record<string, string>>({});
  const [expandedNote, setExpandedNote] = useState<string | null>(null);

  const { data, isLoading } = useQuery<HitlResponse>({
    queryKey: ['hitl', statusFilter],
    queryFn: () => apiClient.get('/axon/hitl', { params: { status: statusFilter, page: 1, pageSize: 50 } }).then((r) => r.data),
    refetchInterval: 10000,
  });

  const approveMutation = useMutation({
    mutationFn: ({ runId, note }: { runId: string; note?: string }) =>
      apiClient.post(`/axon/hitl/${runId}/approve`, { note }).then((r) => r.data),
    onSuccess: () => { toast.success('Approved'); qc.invalidateQueries({ queryKey: ['hitl'] }); },
    onError: () => toast.error('Approval failed'),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ runId, note }: { runId: string; note?: string }) =>
      apiClient.post(`/axon/hitl/${runId}/reject`, { note }).then((r) => r.data),
    onSuccess: () => { toast.success('Rejected'); qc.invalidateQueries({ queryKey: ['hitl'] }); },
    onError: () => toast.error('Rejection failed'),
  });

  const tabs: { label: string; value: StatusFilter; icon: React.ReactNode }[] = [
    { label: 'Pending', value: 'hitl_pending', icon: <Clock size={14} /> },
    { label: 'Approved', value: 'approved', icon: <CheckCircle size={14} /> },
    { label: 'Rejected', value: 'rejected', icon: <XCircle size={14} /> },
  ];

  const runs = data?.data || [];

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">HITL Approval Queue</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">Human-in-the-loop decisions for paused orchestration runs</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-[var(--border)]">
          {tabs.map((t) => (
            <button
              key={t.value}
              onClick={() => setStatusFilter(t.value)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                statusFilter === t.value
                  ? 'border-[var(--primary)] text-[var(--primary)]'
                  : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              {t.icon} {t.label}
              {t.value === 'hitl_pending' && data?.total ? (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full">
                  {data.total}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center gap-2 text-[var(--muted-foreground)] text-sm"><Loader2 size={16} className="animate-spin" /> Loading…</div>
        ) : runs.length === 0 ? (
          <div className="py-16 text-center text-[var(--muted-foreground)] text-sm">No runs in this state</div>
        ) : (
          <div className="space-y-3">
            {runs.map((run) => {
              const pendingStage = run.stages?.find((s) => s.status === 'hitl_pending');
              return (
                <div key={run.id} className="rounded-xl border border-[var(--border)] p-5 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)] mb-1">
                        <span className="font-mono">{run.id.slice(0, 8)}…</span>
                        <span>·</span>
                        <span>{new Date(run.createdAt).toLocaleString()}</span>
                        {pendingStage && <span className="px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded text-xs">Stuck at: {pendingStage.name}</span>}
                      </div>
                      <p className="text-sm line-clamp-3">{run.prompt || '(no prompt)'}</p>
                    </div>

                    {statusFilter === 'hitl_pending' && (
                      <div className="flex flex-col gap-2 shrink-0">
                        <button
                          onClick={() => approveMutation.mutate({ runId: run.id, note: noteMap[run.id] })}
                          disabled={approveMutation.isPending}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                          <CheckCircle size={12} /> Approve
                        </button>
                        <button
                          onClick={() => rejectMutation.mutate({ runId: run.id, note: noteMap[run.id] })}
                          disabled={rejectMutation.isPending}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 disabled:opacity-50"
                        >
                          <XCircle size={12} /> Reject
                        </button>
                        <button
                          onClick={() => setExpandedNote(expandedNote === run.id ? null : run.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 border border-[var(--border)] text-xs rounded-lg hover:bg-[var(--muted)]"
                        >
                          <MessageSquare size={12} /> Note
                        </button>
                      </div>
                    )}
                  </div>

                  {expandedNote === run.id && (
                    <textarea
                      value={noteMap[run.id] || ''}
                      onChange={(e) => setNoteMap((m) => ({ ...m, [run.id]: e.target.value }))}
                      placeholder="Optional note for this decision…"
                      rows={2}
                      className="w-full text-xs border border-[var(--border)] rounded-lg px-3 py-2 bg-[var(--background)] resize-none"
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
