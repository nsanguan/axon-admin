'use client';

import { AppShell } from '../../../components/layout/AppShell';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api';
import { toast } from 'sonner';
import { ArrowLeft, Save, Power, RotateCcw, Trash2, Download, Plus, X, Activity } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface Plugin {
  id: string;
  name: string;
  description?: string;
  endpoint: string;
  authMethod?: string;
  headersJson?: string;
  timeoutMs?: number;
  status: string;
  healthStatus?: string;
  version?: string;
  createdAt: string;
  updatedAt: string;
  group?: { name: string };
  envVars?: { id: string; key: string; isSecret: boolean }[];
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  inactive: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  error: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function PluginDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const qc = useQueryClient();
  const [editMode, setEditMode] = useState(false);
  const [headers, setHeaders] = useState('{}');
  const [form, setForm] = useState<Partial<Plugin>>({});

  const { data: plugin, isLoading } = useQuery<Plugin>({
    queryKey: ['plugin', id],
    queryFn: () => apiClient.get(`/plugins/${id}`).then((r) => r.data),
    onSuccess: (p) => {
      setForm(p);
      setHeaders(p.headersJson || '{}');
    },
  } as Parameters<typeof useQuery>[0]);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Plugin>) => apiClient.put(`/plugins/${id}`, data).then((r) => r.data),
    onSuccess: () => { toast.success('Plugin updated'); setEditMode(false); qc.invalidateQueries({ queryKey: ['plugin', id] }); },
    onError: () => toast.error('Update failed'),
  });

  const healthMutation = useMutation({
    mutationFn: () => apiClient.get(`/plugins/${id}/health`).then((r) => r.data),
    onSuccess: (d) => toast.success(`Health: ${d.status || 'ok'}`),
    onError: () => toast.error('Health check failed'),
  });

  const restartMutation = useMutation({
    mutationFn: () => apiClient.post(`/plugins/${id}/restart`).then((r) => r.data),
    onSuccess: () => { toast.success('Restart triggered'); qc.invalidateQueries({ queryKey: ['plugin', id] }); },
    onError: () => toast.error('Restart failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiClient.delete(`/plugins/${id}`).then((r) => r.data),
    onSuccess: () => { toast.success('Plugin deleted'); window.location.href = '/plugins'; },
    onError: () => toast.error('Delete failed'),
  });

  const toggleMutation = useMutation({
    mutationFn: () => apiClient.put(`/plugins/${id}`, { status: plugin?.status === 'active' ? 'inactive' : 'active' }).then((r) => r.data),
    onSuccess: () => { toast.success('Status toggled'); qc.invalidateQueries({ queryKey: ['plugin', id] }); },
    onError: () => toast.error('Toggle failed'),
  });

  if (isLoading) return <AppShell><div className="animate-pulse h-40 bg-[var(--muted)] rounded-xl" /></AppShell>;
  if (!plugin) return <AppShell><div className="text-[var(--muted-foreground)]">Plugin not found</div></AppShell>;

  const handleSave = () => {
    updateMutation.mutate({ ...form, headersJson: headers });
  };

  const exportConfig = () => {
    const blob = new Blob([JSON.stringify(plugin, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `plugin-${id}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/plugins" className="p-2 rounded-lg hover:bg-[var(--muted)] text-[var(--muted-foreground)]">
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold">{plugin.name}</h1>
              <p className="text-sm text-[var(--muted-foreground)]">{plugin.endpoint}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[plugin.status] || STATUS_COLORS.inactive}`}>
              {plugin.status}
            </span>
            <button onClick={() => healthMutation.mutate()} className="flex items-center gap-1 px-3 py-1.5 text-xs border border-[var(--border)] rounded-lg hover:bg-[var(--muted)]">
              <Activity size={12} /> Health Check
            </button>
            <button onClick={() => toggleMutation.mutate()} className="flex items-center gap-1 px-3 py-1.5 text-xs border border-[var(--border)] rounded-lg hover:bg-[var(--muted)]">
              <Power size={12} /> {plugin.status === 'active' ? 'Disable' : 'Enable'}
            </button>
            <button onClick={() => restartMutation.mutate()} className="flex items-center gap-1 px-3 py-1.5 text-xs border border-[var(--border)] rounded-lg hover:bg-[var(--muted)]">
              <RotateCcw size={12} /> Restart
            </button>
            <button onClick={exportConfig} className="flex items-center gap-1 px-3 py-1.5 text-xs border border-[var(--border)] rounded-lg hover:bg-[var(--muted)]">
              <Download size={12} /> Export
            </button>
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
              <input
                value={form.name || ''}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                disabled={!editMode}
                className="w-full text-sm border border-[var(--border)] rounded-lg px-3 py-2 bg-[var(--background)] disabled:opacity-60"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Version</label>
              <input
                value={form.version || ''}
                onChange={(e) => setForm((f) => ({ ...f, version: e.target.value }))}
                disabled={!editMode}
                className="w-full text-sm border border-[var(--border)] rounded-lg px-3 py-2 bg-[var(--background)] disabled:opacity-60"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Description</label>
            <textarea
              value={form.description || ''}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              disabled={!editMode}
              rows={2}
              className="w-full text-sm border border-[var(--border)] rounded-lg px-3 py-2 bg-[var(--background)] disabled:opacity-60 resize-y"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Endpoint URL</label>
            <input
              value={form.endpoint || ''}
              onChange={(e) => setForm((f) => ({ ...f, endpoint: e.target.value }))}
              disabled={!editMode}
              className="w-full text-sm font-mono border border-[var(--border)] rounded-lg px-3 py-2 bg-[var(--background)] disabled:opacity-60"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1">Auth method</label>
              <select
                value={form.authMethod || 'none'}
                onChange={(e) => setForm((f) => ({ ...f, authMethod: e.target.value }))}
                disabled={!editMode}
                className="w-full text-sm border border-[var(--border)] rounded-lg px-3 py-2 bg-[var(--background)] disabled:opacity-60"
              >
                <option value="none">None</option>
                <option value="api_key">API Key</option>
                <option value="bearer">Bearer Token</option>
                <option value="basic">Basic Auth</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Timeout (ms)</label>
              <input
                type="number"
                value={form.timeoutMs || 30000}
                onChange={(e) => setForm((f) => ({ ...f, timeoutMs: +e.target.value }))}
                disabled={!editMode}
                className="w-full text-sm border border-[var(--border)] rounded-lg px-3 py-2 bg-[var(--background)] disabled:opacity-60"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Headers (JSON)</label>
            <textarea
              value={headers}
              onChange={(e) => setHeaders(e.target.value)}
              disabled={!editMode}
              rows={3}
              className="w-full text-xs font-mono border border-[var(--border)] rounded-lg px-3 py-2 bg-[var(--background)] disabled:opacity-60 resize-y"
            />
          </div>

          {editMode && (
            <div className="flex gap-2 pt-2">
              <button onClick={handleSave} disabled={updateMutation.isPending} className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] text-sm rounded-lg hover:opacity-90 disabled:opacity-50">
                <Save size={14} /> Save changes
              </button>
              <button onClick={() => { setEditMode(false); setForm(plugin); setHeaders(plugin.headersJson || '{}'); }} className="px-4 py-2 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)]">
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Metadata */}
        <div className="rounded-xl border border-[var(--border)] p-4 text-sm grid grid-cols-2 gap-3">
          <div><span className="text-[var(--muted-foreground)]">ID </span><span className="font-mono text-xs">{plugin.id}</span></div>
          <div><span className="text-[var(--muted-foreground)]">Health </span><span>{plugin.healthStatus || '—'}</span></div>
          <div><span className="text-[var(--muted-foreground)]">Created </span><span>{new Date(plugin.createdAt).toLocaleString()}</span></div>
          <div><span className="text-[var(--muted-foreground)]">Updated </span><span>{new Date(plugin.updatedAt).toLocaleString()}</span></div>
        </div>

        {/* Danger zone */}
        <div className="rounded-xl border border-red-300 dark:border-red-800 p-4 space-y-3">
          <h2 className="font-semibold text-sm text-red-600 dark:text-red-400">Danger Zone</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Delete this plugin</p>
              <p className="text-xs text-[var(--muted-foreground)]">This action cannot be undone.</p>
            </div>
            <button
              onClick={() => { if (confirm('Delete this plugin? This cannot be undone.')) deleteMutation.mutate(); }}
              className="flex items-center gap-1 px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
