'use client';

import { AppShell } from '../../../components/layout/AppShell';
import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api';
import { toast } from 'sonner';
import { Play, Square, Download, ChevronDown, ChevronRight, Zap, Clock } from 'lucide-react';

interface AgentInfo {
  name: string;
  description?: string;
  outputType?: string;
  tools?: { name: string; description?: string }[];
  instructions?: string;
}

interface AgentMessage {
  id: string;
  sequenceOrder: number;
  messageKind: string;
  partKind: string;
  contentJson?: string;
  toolName?: string;
  toolCallId?: string;
  modelName?: string;
  inputTokens?: number;
  outputTokens?: number;
}

interface AiRunDetail {
  id: string;
  agentName: string;
  modelMode: string;
  status: string;
  outputJson?: string;
  errorMessage?: string;
  totalDurationMs?: number;
  inputTokens?: number;
  outputTokens?: number;
  messages: AgentMessage[];
}

interface HistoryRun {
  id: string;
  agentName: string;
  modelMode: string;
  status: string;
  createdAt: string;
  prompt: string;
}

const PART_CONFIG: Record<string, { border: string; label: string; icon: string }> = {
  'user-prompt': { border: 'border-l-4 border-blue-400', label: 'User Prompt', icon: '👤' },
  'tool-call': { border: 'border-l-4 border-purple-400', label: 'Tool Call', icon: '🔧' },
  'tool-return': { border: 'border-l-4 border-teal-400', label: 'Tool Return', icon: '↩' },
  'text': { border: 'border-l-4 border-green-400', label: 'Text Response', icon: '💬' },
  'retry-prompt': { border: 'border-l-4 border-orange-400', label: 'Retry Prompt', icon: '🔄' },
};

function MessageCard({ msg }: { msg: AgentMessage }) {
  const [open, setOpen] = useState(true);
  const config = PART_CONFIG[msg.partKind] || { border: 'border-l-4 border-gray-300', label: msg.partKind, icon: '•' };

  let content = '';
  try {
    const parsed = msg.contentJson ? JSON.parse(msg.contentJson) : null;
    content = parsed?.content || parsed?.result || JSON.stringify(parsed, null, 2) || '';
  } catch { content = msg.contentJson || ''; }

  return (
    <div className={`rounded-lg border border-[var(--border)] bg-[var(--background)] ${config.border} overflow-hidden`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 hover:bg-[var(--muted)] text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-base">{config.icon}</span>
          <span className="text-xs font-medium">{config.label}</span>
          {msg.toolName && <span className="text-xs text-[var(--muted-foreground)] font-mono">{msg.toolName}</span>}
        </div>
        <div className="flex items-center gap-2">
          {(msg.inputTokens || msg.outputTokens) && (
            <span className="text-xs text-[var(--muted-foreground)] flex items-center gap-1">
              <Zap size={10} /> {(msg.inputTokens || 0) + (msg.outputTokens || 0)}tk
            </span>
          )}
          {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </div>
      </button>
      {open && content && (
        <div className="px-3 pb-3">
          <pre className="text-xs bg-[var(--muted)] rounded p-2 overflow-auto max-h-40 font-mono leading-relaxed whitespace-pre-wrap">
            {content}
          </pre>
        </div>
      )}
    </div>
  );
}

export default function PydanticAiTesterPage() {
  const [selectedAgent, setSelectedAgent] = useState('');
  const [modelMode, setModelMode] = useState<'test_model' | 'function_model' | 'real_model'>('test_model');
  const [modelName, setModelName] = useState('gpt-4o');
  const [prompt, setPrompt] = useState('Analyze the dataset and provide key insights');
  const [depsJson, setDepsJson] = useState('{}');
  const [functionSnippet, setFunctionSnippet] = useState('def model_fn(messages, info):\n    return ModelResponse(parts=[TextPart("Hello from FunctionModel")])');
  const [requestLimit, setRequestLimit] = useState(10);
  const [responseTokensLimit, setResponseTokensLimit] = useState(2000);
  const [running, setRunning] = useState(false);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [runMeta, setRunMeta] = useState<Partial<AiRunDetail> | null>(null);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const { data: agents = [] } = useQuery<AgentInfo[]>({
    queryKey: ['ai-agents'],
    queryFn: () => apiClient.get('/pydantic-ai/agents').then((r) => r.data),
  });

  const { data: agentInfo } = useQuery<AgentInfo>({
    queryKey: ['ai-agent-info', selectedAgent],
    queryFn: () => apiClient.get(`/pydantic-ai/agents/${selectedAgent}`).then((r) => r.data),
    enabled: !!selectedAgent,
  });

  const { data: history } = useQuery<{ data: HistoryRun[] }>({
    queryKey: ['ai-run-history', selectedAgent],
    queryFn: () => apiClient.get('/pydantic-ai/runs', { params: { agentName: selectedAgent || undefined, pageSize: 20 } }).then((r) => r.data),
    refetchInterval: 15000,
  });

  const { data: historyDetail } = useQuery<AiRunDetail>({
    queryKey: ['ai-run-detail', selectedHistoryId],
    queryFn: () => apiClient.get(`/pydantic-ai/runs/${selectedHistoryId}`).then((r) => r.data),
    enabled: !!selectedHistoryId,
  });

  useEffect(() => {
    if (historyDetail) {
      setMessages(historyDetail.messages || []);
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
    if (!selectedAgent) { toast.error('Select an agent first'); return; }
    if (!prompt.trim()) { toast.error('Prompt is required'); return; }
    setRunning(true);
    setMessages([]);
    setRunMeta(null);
    stopStream();

    try {
      const res = await apiClient.post('/pydantic-ai/runs', {
        agentName: selectedAgent,
        modelMode,
        modelName: modelMode === 'real_model' ? modelName : undefined,
        prompt,
        depsJson,
        usageLimitsJson: JSON.stringify({ request_limit: requestLimit, response_tokens_limit: responseTokensLimit }),
        functionSnippet: modelMode === 'function_model' ? functionSnippet : undefined,
      });

      const { runId } = res.data;
      setRunMeta({ id: runId, agentName: selectedAgent, modelMode, status: 'running' });

      const token = localStorage.getItem('accessToken');
      const es = new EventSource(
        `/api/pydantic-ai/runs/${runId}/stream${token ? `?token=${token}` : ''}`,
      );
      eventSourceRef.current = es;

      es.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === 'snapshot') {
          setMessages(data.run?.messages || []);
          setRunMeta(data.run);
        } else if (data.type === 'message') {
          setMessages((prev) => [...prev, data.message]);
        } else if (data.type === 'complete') {
          setRunMeta((prev) => prev ? { ...prev, status: 'done', totalDurationMs: data.totalDurationMs, inputTokens: data.inputTokens, outputTokens: data.outputTokens } : prev);
          setRunning(false);
          es.close();
          toast.success('Agent run complete!');
        } else if (data.type === 'error') {
          toast.error('Run error: ' + data.message);
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

  const downloadJson = () => {
    const blob = new Blob([JSON.stringify({ run: runMeta, messages }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-run-${runMeta?.id || 'export'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Pydantic AI Agent Tester</h1>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              Run Pydantic AI agents in TestModel / FunctionModel / Real mode with full message inspection
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Safety badge */}
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${modelMode === 'test_model' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
              {modelMode === 'test_model' ? '✓ TestModel Safe' : '⚠ Real Model'}
            </span>
            {messages.length > 0 && (
              <button onClick={downloadJson} className="flex items-center gap-2 px-3 py-2 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)]">
                <Download size={14} /> Export JSON
              </button>
            )}
            <select
              className="text-sm border border-[var(--border)] rounded-lg px-3 py-2 bg-[var(--background)] max-w-48"
              onChange={(e) => setSelectedHistoryId(e.target.value || null)}
              defaultValue=""
            >
              <option value="">Recent runs…</option>
              {history?.data?.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.status === 'done' ? '✓' : '✗'} {r.agentName} — {r.prompt.slice(0, 25)}…
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left — Configuration */}
          <div className="space-y-4">
            <div className="rounded-xl border border-[var(--border)] p-5 space-y-4">
              <h2 className="font-semibold text-sm uppercase tracking-wide text-[var(--muted-foreground)]">Agent & Run Configuration</h2>

              <div>
                <label className="block text-xs font-medium mb-1">Agent</label>
                <select
                  value={selectedAgent}
                  onChange={(e) => setSelectedAgent(e.target.value)}
                  className="w-full text-sm border border-[var(--border)] rounded-lg px-3 py-2 bg-[var(--background)]"
                >
                  <option value="">Select an agent…</option>
                  {agents.map((a) => (
                    <option key={a.name} value={a.name}>{a.name}</option>
                  ))}
                </select>
              </div>

              {/* Agent info card */}
              {agentInfo && (
                <div className="rounded-lg bg-[var(--muted)] p-3 text-xs space-y-2">
                  {agentInfo.description && <p className="text-[var(--muted-foreground)]">{agentInfo.description}</p>}
                  {agentInfo.tools && agentInfo.tools.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {agentInfo.tools.map((t) => (
                        <span key={t.name} title={t.description} className="bg-[var(--background)] border border-[var(--border)] rounded px-2 py-0.5 font-mono">
                          {t.name}
                        </span>
                      ))}
                    </div>
                  )}
                  {agentInfo.outputType && (
                    <p className="font-mono text-[var(--muted-foreground)]">Output: {agentInfo.outputType}</p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium mb-1">Model Mode</label>
                <div className="grid grid-cols-3 gap-1">
                  {(['test_model', 'function_model', 'real_model'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setModelMode(m)}
                      className={`text-xs py-1.5 rounded-lg border transition-colors ${modelMode === m ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]' : 'border-[var(--border)] hover:bg-[var(--muted)]'}`}
                    >
                      {m === 'test_model' ? 'TestModel' : m === 'function_model' ? 'FunctionModel' : 'Real Model'}
                    </button>
                  ))}
                </div>
              </div>

              {modelMode === 'real_model' && (
                <div>
                  <label className="block text-xs font-medium mb-1">Model</label>
                  <select
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    className="w-full text-sm border border-[var(--border)] rounded-lg px-3 py-2 bg-[var(--background)]"
                  >
                    <option value="gpt-4o">GPT-4o</option>
                    <option value="gpt-4o-mini">GPT-4o Mini</option>
                    <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
                    <option value="gemini-pro">Gemini Pro</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium mb-1">Prompt</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={3}
                  className="w-full text-sm border border-[var(--border)] rounded-lg px-3 py-2 bg-[var(--background)] resize-y font-mono"
                  placeholder="Enter prompt…"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Dependencies JSON</label>
                <textarea
                  value={depsJson}
                  onChange={(e) => setDepsJson(e.target.value)}
                  rows={2}
                  className="w-full text-sm border border-[var(--border)] rounded-lg px-3 py-2 bg-[var(--background)] resize-y font-mono"
                />
              </div>

              {modelMode === 'function_model' && (
                <div>
                  <label className="block text-xs font-medium mb-1">FunctionModel Snippet (Python)</label>
                  <textarea
                    value={functionSnippet}
                    onChange={(e) => setFunctionSnippet(e.target.value)}
                    rows={4}
                    className="w-full text-xs border border-[var(--border)] rounded-lg px-3 py-2 bg-[var(--background)] resize-y font-mono"
                  />
                </div>
              )}

              <details className="text-sm">
                <summary className="cursor-pointer text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]">Usage limits</summary>
                <div className="mt-2 space-y-2">
                  <label className="flex items-center justify-between text-xs">
                    <span>Request limit</span>
                    <input type="number" value={requestLimit} onChange={(e) => setRequestLimit(+e.target.value)} className="w-20 text-xs border border-[var(--border)] rounded px-2 py-1 bg-[var(--background)]" />
                  </label>
                  <label className="flex items-center justify-between text-xs">
                    <span>Response tokens limit</span>
                    <input type="number" value={responseTokensLimit} onChange={(e) => setResponseTokensLimit(+e.target.value)} className="w-20 text-xs border border-[var(--border)] rounded px-2 py-1 bg-[var(--background)]" />
                  </label>
                </div>
              </details>

              <div className="flex gap-2">
                <button
                  onClick={handleRun}
                  disabled={running || !selectedAgent}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 disabled:opacity-50"
                >
                  <Play size={14} /> {running ? 'Running…' : 'Run Agent'}
                </button>
                {running && (
                  <button onClick={() => { stopStream(); setRunning(false); }} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--border)] text-sm hover:bg-[var(--muted)]">
                    <Square size={14} /> Stop
                  </button>
                )}
              </div>
            </div>

            {/* Run summary */}
            {runMeta && runMeta.totalDurationMs && (
              <div className="rounded-xl border border-[var(--border)] p-4 text-sm space-y-1">
                <div className="flex justify-between"><span className="text-[var(--muted-foreground)]">Duration</span><span className="flex items-center gap-1"><Clock size={12} /> {runMeta.totalDurationMs}ms</span></div>
                {runMeta.inputTokens != null && (
                  <div className="flex justify-between"><span className="text-[var(--muted-foreground)]">Tokens</span><span className="flex items-center gap-1"><Zap size={12} /> {(runMeta.inputTokens || 0) + (runMeta.outputTokens || 0)}</span></div>
                )}
              </div>
            )}
          </div>

          {/* Right — Message Exchange Viewer */}
          <div className="space-y-3">
            <h2 className="font-semibold text-sm uppercase tracking-wide text-[var(--muted-foreground)]">Message Exchange</h2>

            {messages.length === 0 && !running && (
              <div className="rounded-xl border-2 border-dashed border-[var(--border)] p-12 text-center text-[var(--muted-foreground)] text-sm">
                Messages will appear here as the agent runs
              </div>
            )}

            {messages.map((msg) => (
              <MessageCard key={msg.id || msg.sequenceOrder} msg={msg} />
            ))}

            {/* Error */}
            {runMeta?.errorMessage && (
              <div className="rounded-xl border border-red-400 bg-red-50 dark:bg-red-950 p-4">
                <p className="font-medium text-sm text-red-700 dark:text-red-400">Run Error</p>
                <p className="text-xs font-mono mt-1 text-red-600 dark:text-red-300">{runMeta.errorMessage}</p>
              </div>
            )}

            {/* Final output */}
            {runMeta?.status === 'done' && runMeta.outputJson && (
              <div className="rounded-xl border-2 border-green-400 bg-green-50 dark:bg-green-950 p-4">
                <p className="font-medium text-sm text-green-700 dark:text-green-400 mb-2">Final Output</p>
                <pre className="text-xs font-mono bg-[var(--background)] rounded p-2 overflow-auto max-h-40">
                  {JSON.stringify(JSON.parse(runMeta.outputJson), null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
