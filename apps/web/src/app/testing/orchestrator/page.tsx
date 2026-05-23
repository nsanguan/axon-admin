'use client';

import { AppShell } from '../../../components/layout/AppShell';
import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api';
import { toast } from 'sonner';
import { Play, Square, Download, ChevronDown, ChevronRight, Clock, Zap, Copy } from 'lucide-react';

interface Stage {
  id: string;
  stageNumber: number;
  stageName: string;
  status: 'pending' | 'running' | 'done' | 'error' | 'hitl_pending';
  inputJson?: string;
  outputJson?: string;
  errorMessage?: string;
  durationMs?: number;
  inputTokens?: number;
  outputTokens?: number;
}

interface RunDetail {
  id: string;
  prompt: string;
  model?: string;
  status: string;
  totalDurationMs?: number;
  totalInputTokens?: number;
  totalOutputTokens?: number;
  stages: Stage[];
  createdAt: string;
}

interface HistoryRun {
  id: string;
  prompt: string;
  status: string;
  createdAt: string;
  totalDurationMs?: number;
}

const STATUS_CONFIG: Record<string, { color: string; dot: string; label: string }> = {
  pending: { color: 'border-gray-300 bg-gray-50 dark:bg-gray-900', dot: 'bg-gray-400', label: 'Pending' },
  running: { color: 'border-blue-400 bg-blue-50 dark:bg-blue-950', dot: 'bg-blue-400 animate-pulse', label: 'Running' },
  done: { color: 'border-green-400 bg-green-50 dark:bg-green-950', dot: 'bg-green-500', label: 'Done' },
  error: { color: 'border-red-400 bg-red-50 dark:bg-red-950', dot: 'bg-red-500', label: 'Error' },
  hitl_pending: { color: 'border-amber-400 bg-amber-50 dark:bg-amber-950', dot: 'bg-amber-500', label: 'Awaiting Approval' },
};

function JsonViewer({ json, label }: { json?: string; label: string }) {
  const [open, setOpen] = useState(false);
  if (!json) return null;

  let formatted = json;
  try { formatted = JSON.stringify(JSON.parse(json), null, 2); } catch { /* keep raw */ }

  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
      >
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        {label}
      </button>
      {open && (
        <pre className="mt-1 text-xs rounded-lg bg-[var(--muted)] p-3 overflow-auto max-h-48 font-mono leading-relaxed">
          {formatted}
        </pre>
      )}
    </div>
  );
}

function StageCard({ stage }: { stage: Stage }) {
  const config = STATUS_CONFIG[stage.status] || STATUS_CONFIG.pending;

  return (
    <div className={`rounded-xl border-2 p-4 transition-all duration-500 ${config.color}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[var(--background)] border border-[var(--border)] text-xs font-bold flex items-center justify-center">
            {stage.stageNumber}
          </span>
          <div>
            <p className="font-medium text-sm">{stage.stageName}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`inline-block w-2 h-2 rounded-full ${config.dot}`} />
              <span className="text-xs text-[var(--muted-foreground)]">{config.label}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
          {stage.durationMs != null && (
            <span className="flex items-center gap-1"><Clock size={10} /> {stage.durationMs}ms</span>
          )}
          {stage.inputTokens != null && (
            <span className="flex items-center gap-1"><Zap size={10} /> {(stage.inputTokens || 0) + (stage.outputTokens || 0)} tk</span>
          )}
        </div>
      </div>
      <JsonViewer json={stage.inputJson} label="Input" />
      <JsonViewer json={stage.outputJson} label="Output" />
      {stage.errorMessage && (
        <div className="mt-2 rounded p-2 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-xs font-mono">
          {stage.errorMessage}
        </div>
      )}
    </div>
  );
}

export default function OrchestratorTesterPage() {
  const [prompt, setPrompt] = useState('Analyze the latest sales data and summarize key trends');
  const [model, setModel] = useState('gpt-4o');
  const [contextJson, setContextJson] = useState('{}');
  const [hitlEnabled, setHitlEnabled] = useState(false);
  const [dryRun, setDryRun] = useState(false);
  const [running, setRunning] = useState(false);
  const [stages, setStages] = useState<Stage[]>([]);
  const [runMeta, setRunMeta] = useState<Partial<RunDetail> | null>(null);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const { data: history } = useQuery<{ data: HistoryRun[] }>({
    queryKey: ['orch-history'],
    queryFn: () => apiClient.get('/orchestrator/runs', { params: { pageSize: 20 } }).then((r) => r.data),
    refetchInterval: 10000,
  });

  const { data: historyDetail } = useQuery<RunDetail>({
    queryKey: ['orch-detail', selectedHistoryId],
    queryFn: () => apiClient.get(`/orchestrator/runs/${selectedHistoryId}`).then((r) => r.data),
    enabled: !!selectedHistoryId,
  });

  useEffect(() => {
    if (historyDetail) {
      setStages(historyDetail.stages || []);
      setRunMeta(historyDetail);
    }
  }, [historyDetail]);

  const stopStream = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  };

  const handleRun = async () => {
    if (!prompt.trim()) { toast.error('Prompt is required'); return; }
    setRunning(true);
    setStages([]);
    setRunMeta(null);
    stopStream();

    try {
      const res = await apiClient.post('/orchestrator/run', {
        prompt,
        model,
        contextJson,
        hitlEnabled,
        dryRun,
      });
      const { runId } = res.data;
      setRunMeta({ id: runId, status: 'running', prompt, model });

      const token = localStorage.getItem('accessToken');
      const es = new EventSource(
        `/api/orchestrator/runs/${runId}/stream${token ? `?token=${token}` : ''}`,
      );
      eventSourceRef.current = es;

      es.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === 'snapshot') {
          setStages(data.run?.stages || []);
          setRunMeta(data.run);
        } else if (data.type === 'stage_start') {
          setStages((prev) =>
            prev.map((s) => s.stageNumber === data.stageNumber ? { ...s, status: 'running' } : s),
          );
        } else if (data.type === 'stage_complete') {
          setStages((prev) =>
            prev.map((s) =>
              s.stageNumber === data.stageNumber
                ? { ...s, status: data.status, outputJson: data.outputJson, durationMs: data.durationMs, inputTokens: data.inputTokens, outputTokens: data.outputTokens }
                : s,
            ),
          );
        } else if (data.type === 'complete') {
          setRunMeta((prev) => prev ? { ...prev, status: 'done', totalDurationMs: data.totalDurationMs, totalInputTokens: data.totalInputTokens, totalOutputTokens: data.totalOutputTokens } : prev);
          setRunning(false);
          es.close();
          toast.success('Pipeline complete!');
        } else if (data.type === 'error') {
          toast.error('Pipeline error: ' + data.message);
          setRunning(false);
          es.close();
        }
      };

      es.onerror = () => {
        setRunning(false);
        es.close();
      };
    } catch {
      toast.error('Failed to start run');
      setRunning(false);
    }
  };

  const handleApprove = async (approve: boolean) => {
    if (!runMeta?.id) return;
    try {
      await apiClient.post(`/axon/hitl/${runMeta.id}/${approve ? 'approve' : 'reject'}`);
      toast.success(approve ? 'Approved — pipeline resuming' : 'Rejected');
    } catch {
      toast.error('HITL action failed');
    }
  };

  const downloadJson = () => {
    const blob = new Blob([JSON.stringify({ run: runMeta, stages }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orchestrator-run-${runMeta?.id || 'export'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Orchestrator Pipeline Tester</h1>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              Submit a prompt and watch each pipeline stage execute in real time
            </p>
          </div>
          <div className="flex items-center gap-2">
            {stages.length > 0 && (
              <button onClick={downloadJson} className="flex items-center gap-2 px-3 py-2 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)]">
                <Download size={14} /> Export JSON
              </button>
            )}
            {/* History dropdown */}
            <select
              className="text-sm border border-[var(--border)] rounded-lg px-3 py-2 bg-[var(--background)] max-w-48"
              onChange={(e) => setSelectedHistoryId(e.target.value || null)}
              defaultValue=""
            >
              <option value="">Recent runs…</option>
              {history?.data?.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.status === 'done' ? '✓' : r.status === 'error' ? '✗' : '○'} {r.prompt.slice(0, 30)}…
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left — Request Builder */}
          <div className="space-y-4">
            <div className="rounded-xl border border-[var(--border)] p-5 space-y-4">
              <h2 className="font-semibold text-sm uppercase tracking-wide text-[var(--muted-foreground)]">Request Builder</h2>

              <div>
                <label className="block text-xs font-medium mb-1">Model</label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full text-sm border border-[var(--border)] rounded-lg px-3 py-2 bg-[var(--background)]"
                >
                  <option value="gpt-4o">GPT-4o</option>
                  <option value="gpt-4o-mini">GPT-4o Mini</option>
                  <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
                  <option value="gemini-pro">Gemini Pro</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Prompt</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                  className="w-full text-sm border border-[var(--border)] rounded-lg px-3 py-2 bg-[var(--background)] resize-y font-mono"
                  placeholder="Enter your prompt…"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Context JSON</label>
                <textarea
                  value={contextJson}
                  onChange={(e) => setContextJson(e.target.value)}
                  rows={3}
                  className="w-full text-sm border border-[var(--border)] rounded-lg px-3 py-2 bg-[var(--background)] resize-y font-mono"
                />
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={hitlEnabled} onChange={(e) => setHitlEnabled(e.target.checked)} className="rounded" />
                  HITL enabled
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={dryRun} onChange={(e) => setDryRun(e.target.checked)} className="rounded" />
                  Dry run
                </label>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleRun}
                  disabled={running}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 disabled:opacity-50"
                >
                  <Play size={14} /> {running ? 'Running…' : 'Run Pipeline'}
                </button>
                {running && (
                  <button onClick={() => { stopStream(); setRunning(false); }} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--border)] text-sm hover:bg-[var(--muted)]">
                    <Square size={14} /> Stop
                  </button>
                )}
              </div>
            </div>

            {/* Run summary */}
            {runMeta && (
              <div className="rounded-xl border border-[var(--border)] p-4 text-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--muted-foreground)]">Run ID</span>
                  <button
                    onClick={() => { navigator.clipboard.writeText(runMeta.id || ''); toast.success('Copied'); }}
                    className="flex items-center gap-1 font-mono text-xs hover:text-[var(--primary)]"
                  >
                    {runMeta.id?.slice(0, 8)}… <Copy size={10} />
                  </button>
                </div>
                {runMeta.totalDurationMs && (
                  <div className="flex justify-between"><span className="text-[var(--muted-foreground)]">Duration</span><span>{runMeta.totalDurationMs}ms</span></div>
                )}
                {runMeta.totalInputTokens != null && (
                  <div className="flex justify-between"><span className="text-[var(--muted-foreground)]">Tokens</span><span>{(runMeta.totalInputTokens || 0) + (runMeta.totalOutputTokens || 0)} ({runMeta.totalInputTokens}↑ {runMeta.totalOutputTokens}↓)</span></div>
                )}
              </div>
            )}
          </div>

          {/* Right — Pipeline Stage Viewer */}
          <div className="space-y-3">
            <h2 className="font-semibold text-sm uppercase tracking-wide text-[var(--muted-foreground)]">Pipeline Stages</h2>

            {stages.length === 0 && !running && (
              <div className="rounded-xl border-2 border-dashed border-[var(--border)] p-12 text-center text-[var(--muted-foreground)] text-sm">
                Run the pipeline to see stage-by-stage execution
              </div>
            )}

            {stages.map((stage) => (
              <StageCard key={stage.id || stage.stageNumber} stage={stage} />
            ))}

            {/* HITL approval */}
            {runMeta?.status === 'hitl_pending' && (
              <div className="rounded-xl border-2 border-amber-400 bg-amber-50 dark:bg-amber-950 p-4">
                <p className="font-medium text-sm text-amber-800 dark:text-amber-200">Awaiting Human Approval</p>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">Stage 4 (MCP Execution) requires approval before continuing.</p>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => handleApprove(true)} className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700">
                    Approve
                  </button>
                  <button onClick={() => handleApprove(false)} className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700">
                    Reject
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
