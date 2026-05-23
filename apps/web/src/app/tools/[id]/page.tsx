'use client';

import { AppShell } from '../../../components/layout/AppShell';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api';
import { toast } from 'sonner';
import { ArrowLeft, Save, Play, Loader2, ChevronDown, ChevronUp, Copy } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface Tool {
  id: string;
  name: string;
  description?: string;
  endpoint?: string;
  method?: string;
  inputSchemaJson?: string;
  outputSchemaJson?: string;
  status: string;
  version?: string;
  createdAt: string;
  updatedAt: string;
}

function JsonEditor({ value, onChange, disabled, label }: { value: string; onChange: (v: string) => void; disabled: boolean; label: string }) {
  const [error, setError] = useState('');

  const handleChange = (v: string) => {
    onChange(v);
    try { JSON.parse(v); setError(''); } catch { setError('Invalid JSON'); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-medium">{label}</label>
        <button type="button" onClick={() => { try { onChange(JSON.stringify(JSON.parse(value), null, 2)); } catch {} }} className="text-xs text-[var(--primary)] hover:underline">Format</button>
      </div>
      <textarea
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        disabled={disabled}
        rows={7}
        className="w-full text-xs font-mono border border-[var(--border)] rounded-lg px-3 py-2 bg-[var(--background)] disabled:opacity-60 resize-y"
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

export default function ToolDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const qc = useQueryClient();
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<Partial<Tool>>({});
  const [inputSchema, setInputSchema] = useState('{}');
  const [outputSchema, setOutputSchema] = useState('{}');
  const [testInput, setTestInput] = useState('{}');
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testExpanded, setTestExpanded] = useState(false);
  const [testRunning, setTestRunning] = useState(false);

  const { data: tool, isLoading } = useQuery<Tool>({
    queryKey: ['tool', id],
    queryFn: () => apiClient.get(`/tools/${id}`).then((r) => r.data),
    onSuccess: (t) => {
      setForm(t);
      setInputSchema(t.inputSchemaJson || '{}');
      setOutputSchema(t.outputSchemaJson || '{}');
    },
  } as Parameters<typeof useQuery>[0]);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Tool>) => apiClient.put(`/tools/${id}`, data).then((r) => r.data),
    onSuccess: () => { toast.success('Tool updated'); setEditMode(false); qc.invalidateQueries({ queryKey: ['tool', id] }); },
    onError: () => toast.error('Update failed'),
  });

  const handleSave = () => {
    updateMutation.mutate({ ...form, inputSchemaJson: inputSchema, outputSchemaJson: outputSchema });
  };

  const runTest = async () => {
    setTestRunning(true);
    try {
      const parsed = JSON.parse(testInput);
      const res = await apiClient.post(`/tools/${id}/execute`, { input: parsed });
      setTestResult(JSON.stringify(res.data, null, 2));
    } catch (err) {
      setTestResult(String(err));
    } finally {
      setTestRunning(false);
    }
  };

  if (isLoading) return <AppShell><div className="animate-pulse h-40 bg-[var(--muted)] rounded-xl" /></AppShell>;
  if (!tool) return <AppShell><div className="text-[var(--muted-foreground)]">Tool not found</div></AppShell>;

  return (
    <AppShell>
      <div className="space-y-6 max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Link href="/tools" className="p-2 rounded-lg hover:bg-[var(--muted)] text-[var(--muted-foreground)]">
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold">{tool.name}</h1>
              <p className="text-sm text-[var(--muted-foreground)]">{tool.description}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${tool.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
              {tool.status}
            </span>
            {!editMode && (
              <button onClick={() => setEditMode(true)} className="px-3 py-1.5 text-xs bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg hover:opacity-90">
                Edit
              </button>
            )}
          </div>
        </div>

        {/* Core fields */}
        <div className="rounded-xl border border-[var(--border)] p-6 space-y-4">
          <h2 className="font-semibold text-sm uppercase tracking-wide text-[var(--muted-foreground)]">Configuration</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1">Name</label>
              <input value={form.name || ''} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} disabled={!editMode} className="w-full text-sm border border-[var(--border)] rounded-lg px-3 py-2 bg-[var(--background)] disabled:opacity-60" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Method</label>
              <select value={form.method || 'POST'} onChange={(e) => setForm((f) => ({ ...f, method: e.target.value }))} disabled={!editMode} className="w-full text-sm border border-[var(--border)] rounded-lg px-3 py-2 bg-[var(--background)] disabled:opacity-60">
                {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Endpoint</label>
            <input value={form.endpoint || ''} onChange={(e) => setForm((f) => ({ ...f, endpoint: e.target.value }))} disabled={!editMode} className="w-full text-sm font-mono border border-[var(--border)] rounded-lg px-3 py-2 bg-[var(--background)] disabled:opacity-60" />
          </div>

          <JsonEditor label="Input Schema (JSON Schema)" value={inputSchema} onChange={setInputSchema} disabled={!editMode} />
          <JsonEditor label="Output Schema (JSON Schema)" value={outputSchema} onChange={setOutputSchema} disabled={!editMode} />

          {editMode && (
            <div className="flex gap-2 pt-2">
              <button onClick={handleSave} disabled={updateMutation.isPending} className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] text-sm rounded-lg hover:opacity-90 disabled:opacity-50">
                <Save size={14} /> Save
              </button>
              <button onClick={() => { setEditMode(false); setForm(tool); setInputSchema(tool.inputSchemaJson || '{}'); setOutputSchema(tool.outputSchemaJson || '{}'); }} className="px-4 py-2 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)]">Cancel</button>
            </div>
          )}
        </div>

        {/* Execution test */}
        <div className="rounded-xl border border-[var(--border)] p-6 space-y-4">
          <button type="button" onClick={() => setTestExpanded(!testExpanded)} className="flex items-center justify-between w-full">
            <h2 className="font-semibold text-sm uppercase tracking-wide text-[var(--muted-foreground)]">Execution Test</h2>
            {testExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {testExpanded && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1">Input (JSON)</label>
                <textarea value={testInput} onChange={(e) => setTestInput(e.target.value)} rows={4} className="w-full text-xs font-mono border border-[var(--border)] rounded-lg px-3 py-2 bg-[var(--background)] resize-y" />
              </div>
              <button onClick={runTest} disabled={testRunning} className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] text-sm rounded-lg hover:opacity-90 disabled:opacity-50">
                {testRunning ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                Run
              </button>
              {testResult && (
                <div className="relative">
                  <pre className="text-xs bg-[var(--muted)] p-4 rounded-lg overflow-x-auto whitespace-pre-wrap">{testResult}</pre>
                  <button onClick={() => navigator.clipboard.writeText(testResult)} className="absolute top-2 right-2 p-1 rounded hover:bg-[var(--border)]"><Copy size={12} /></button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Metadata */}
        <div className="rounded-xl border border-[var(--border)] p-4 text-sm grid grid-cols-2 gap-3">
          <div><span className="text-[var(--muted-foreground)]">ID </span><span className="font-mono text-xs">{tool.id}</span></div>
          <div><span className="text-[var(--muted-foreground)]">Version </span><span>{tool.version || '—'}</span></div>
          <div><span className="text-[var(--muted-foreground)]">Created </span><span>{new Date(tool.createdAt).toLocaleString()}</span></div>
          <div><span className="text-[var(--muted-foreground)]">Updated </span><span>{new Date(tool.updatedAt).toLocaleString()}</span></div>
        </div>
      </div>
    </AppShell>
  );
}
