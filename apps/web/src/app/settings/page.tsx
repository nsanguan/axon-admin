'use client';

import { AppShell } from '../../components/layout/AppShell';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api';
import { toast } from 'sonner';
import { useState, useCallback } from 'react';
import { Save } from 'lucide-react';

interface FeatureFlag {
  id: string;
  name: string;
  key: string;
  type: string;
  defaultValueJson: string;
  isActive: boolean;
}

type TabKey = 'general' | 'security' | 'api-gateway' | 'mcp' | 'notifications' | 'branding' | 'flags';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'general', label: 'General' },
  { key: 'security', label: 'Security' },
  { key: 'api-gateway', label: 'API Gateway' },
  { key: 'mcp', label: 'MCP' },
  { key: 'notifications', label: 'Notifications' },
  { key: 'branding', label: 'Branding' },
  { key: 'flags', label: 'Feature Flags' },
];

function FieldRow({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="grid grid-cols-3 gap-4 items-center">
      <label className="text-sm font-medium text-right pr-2">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="col-span-2 border border-[var(--border)] rounded-lg px-3 py-2 text-sm bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
      />
    </div>
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="grid grid-cols-3 gap-4 items-center">
      <label className="text-sm font-medium text-right pr-2">{label}</label>
      <button
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${value ? 'bg-[var(--primary)]' : 'bg-[var(--muted-foreground)]/30'}`}
      >
        <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  );
}

function NamespacedPanel({ namespace, fields }: {
  namespace: string;
  fields: { key: string; label: string; type?: string; placeholder?: string; isToggle?: boolean }[];
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState<Record<string, string>>({});

  const { data: settings = [] } = useQuery<{ key: string; valueJson: string }[]>({
    queryKey: ['settings', namespace],
    queryFn: (): Promise<{ key: string; valueJson: string }[]> =>
      apiClient.get('/settings', { params: { namespace } }).then((r) => r.data as { key: string; valueJson: string }[]),
  });

  const getVal = useCallback((key: string): string => {
    const override = form[key];
    if (override !== undefined) return override;
    const row = settings.find((s) => s.key === key);
    if (!row) return '';
    try { return JSON.parse(row.valueJson); } catch { return row.valueJson; }
  }, [form, settings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const changed = Object.keys(form);
      await Promise.all(
        changed.map((key) =>
          apiClient.post('/settings', { namespace, key, valueJson: JSON.stringify(form[key]) }),
        ),
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings', namespace] });
      toast.success('Settings saved');
      setForm({});
    },
    onError: () => toast.error('Failed to save settings'),
  });

  return (
    <div className="rounded-xl border border-[var(--border)] p-6 max-w-2xl space-y-4">
      {fields.map((f) =>
        f.isToggle ? (
          <ToggleRow
            key={f.key}
            label={f.label}
            value={getVal(f.key) === 'true'}
            onChange={(v) => setForm((prev) => ({ ...prev, [f.key]: String(v) }))}
          />
        ) : (
          <FieldRow
            key={f.key}
            label={f.label}
            value={getVal(f.key)}
            onChange={(v) => setForm((prev) => ({ ...prev, [f.key]: v }))}
            type={f.type}
            placeholder={f.placeholder}
          />
        ),
      )}
      <div className="flex justify-end pt-2">
        <button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending || Object.keys(form).length === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-sm font-medium disabled:opacity-50"
        >
          <Save size={14} /> {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

function FeatureFlagsPanel() {
  const qc = useQueryClient();

  const { data: flags = [], isLoading } = useQuery<FeatureFlag[]>({
    queryKey: ['feature-flags'],
    queryFn: (): Promise<FeatureFlag[]> =>
      apiClient.get('/settings/feature-flags').then((r) => r.data as FeatureFlag[]),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiClient.patch(`/settings/feature-flags/${id}/toggle`, { isActive }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['feature-flags'] }); toast.success('Flag updated'); },
    onError: () => toast.error('Failed to update flag'),
  });

  if (isLoading) return <div className="animate-pulse h-40 bg-[var(--muted)] rounded-xl" />;

  return (
    <div className="rounded-xl border border-[var(--border)] overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-[var(--muted)]/50">
          <tr>
            <th className="px-4 py-3 text-left font-medium">Flag</th>
            <th className="px-4 py-3 text-left font-medium">Key</th>
            <th className="px-4 py-3 text-left font-medium">Type</th>
            <th className="px-4 py-3 text-left font-medium">Default</th>
            <th className="px-4 py-3 text-right font-medium">Enabled</th>
          </tr>
        </thead>
        <tbody>
          {flags.length === 0 ? (
            <tr><td colSpan={5} className="px-4 py-10 text-center text-[var(--muted-foreground)]">No feature flags</td></tr>
          ) : flags.map((f) => (
            <tr key={f.id} className="border-t border-[var(--border)] hover:bg-[var(--muted)]/30">
              <td className="px-4 py-3 font-medium">{f.name}</td>
              <td className="px-4 py-3 font-mono text-xs text-[var(--muted-foreground)]">{f.key}</td>
              <td className="px-4 py-3 text-[var(--muted-foreground)]">{f.type}</td>
              <td className="px-4 py-3 font-mono text-xs">{f.defaultValueJson}</td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={() => toggleMutation.mutate({ id: f.id, isActive: !f.isActive })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${f.isActive ? 'bg-[var(--primary)]' : 'bg-[var(--muted-foreground)]/30'}`}
                >
                  <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${f.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function SettingsPage() {
  const [tab, setTab] = useState<TabKey>('general');

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">System configuration, security policies, and feature flags</p>
        </div>

        <div className="flex gap-1 border-b border-[var(--border)] overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                tab === t.key
                  ? 'border-[var(--primary)] text-[var(--primary)]'
                  : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'general' && (
          <NamespacedPanel
            namespace="general"
            fields={[
              { key: 'app_name', label: 'App Name', placeholder: 'AXON Admin' },
              { key: 'timezone', label: 'Timezone', placeholder: 'UTC' },
              { key: 'date_format', label: 'Date Format', placeholder: 'YYYY-MM-DD' },
              { key: 'support_email', label: 'Support Email', type: 'email', placeholder: 'support@example.com' },
            ]}
          />
        )}

        {tab === 'security' && (
          <NamespacedPanel
            namespace="security"
            fields={[
              { key: 'cors_origins', label: 'CORS Origins', placeholder: 'https://example.com,https://app.example.com' },
              { key: 'session_timeout_min', label: 'Session Timeout (min)', type: 'number', placeholder: '60' },
              { key: 'enforce_2fa', label: 'Enforce 2FA', isToggle: true },
              { key: 'min_password_length', label: 'Min Password Length', type: 'number', placeholder: '8' },
              { key: 'password_require_special', label: 'Require Special Chars', isToggle: true },
              { key: 'max_login_attempts', label: 'Max Login Attempts', type: 'number', placeholder: '5' },
            ]}
          />
        )}

        {tab === 'api-gateway' && (
          <NamespacedPanel
            namespace="api_gateway"
            fields={[
              { key: 'base_url', label: 'API Base URL', placeholder: 'http://localhost:3001/api' },
              { key: 'global_timeout_ms', label: 'Global Timeout (ms)', type: 'number', placeholder: '30000' },
              { key: 'default_retry_count', label: 'Default Retry Count', type: 'number', placeholder: '3' },
              { key: 'default_retry_delay_ms', label: 'Retry Delay (ms)', type: 'number', placeholder: '1000' },
            ]}
          />
        )}

        {tab === 'mcp' && (
          <NamespacedPanel
            namespace="mcp"
            fields={[
              { key: 'default_server_url', label: 'Default MCP Server URL', placeholder: 'http://localhost:8000' },
              { key: 'preferred_protocol', label: 'Preferred Protocol', placeholder: 'http' },
              { key: 'connection_timeout_ms', label: 'Connection Timeout (ms)', type: 'number', placeholder: '5000' },
              { key: 'sse_enabled', label: 'SSE Enabled', isToggle: true },
              { key: 'websocket_enabled', label: 'WebSocket Enabled', isToggle: true },
            ]}
          />
        )}

        {tab === 'notifications' && (
          <NamespacedPanel
            namespace="notifications.global"
            fields={[
              { key: 'enabled', label: 'Notifications Enabled', isToggle: true },
              { key: 'default_channels', label: 'Default Channels', placeholder: 'in_app,email' },
              { key: 'digest_interval_min', label: 'Digest Interval (min)', type: 'number', placeholder: '60' },
              { key: 'quiet_hours_start', label: 'Quiet Hours Start', placeholder: '22:00' },
              { key: 'quiet_hours_end', label: 'Quiet Hours End', placeholder: '08:00' },
            ]}
          />
        )}

        {tab === 'branding' && (
          <NamespacedPanel
            namespace="branding"
            fields={[
              { key: 'primary_color', label: 'Primary Color', placeholder: '#6366f1', type: 'color' },
              { key: 'logo_url', label: 'Logo URL', placeholder: 'https://example.com/logo.png' },
              { key: 'favicon_url', label: 'Favicon URL', placeholder: 'https://example.com/favicon.ico' },
              { key: 'custom_css', label: 'Custom CSS', placeholder: ':root { --radius: 8px; }' },
            ]}
          />
        )}

        {tab === 'flags' && <FeatureFlagsPanel />}
      </div>
    </AppShell>
  );
}
