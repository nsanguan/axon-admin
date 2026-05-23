'use client';

import { AppShell } from '../../../components/layout/AppShell';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api';
import { toast } from 'sonner';
import { Save } from 'lucide-react';

type ChannelKey = 'smtp' | 'slack' | 'discord' | 'telegram';

interface ChannelConfig {
  smtp: { host: string; port: string; user: string; pass: string; from: string };
  slack: { webhookUrl: string };
  discord: { webhookUrl: string };
  telegram: { botToken: string; chatId: string };
}

const DEFAULTS: ChannelConfig = {
  smtp: { host: '', port: '587', user: '', pass: '', from: '' },
  slack: { webhookUrl: '' },
  discord: { webhookUrl: '' },
  telegram: { botToken: '', chatId: '' },
};

function useChannelSetting(channel: ChannelKey) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['settings-notifications', channel],
    queryFn: () =>
      apiClient
        .get('/settings', { params: { namespace: `notifications.${channel}` } })
        .then((r) => {
          const row = (r.data as { key: string; valueJson: string }[]).find((s) => s.key === 'config');
          return row ? JSON.parse(row.valueJson) : DEFAULTS[channel];
        })
        .catch(() => DEFAULTS[channel]),
  });

  const saveMutation = useMutation({
    mutationFn: (value: Record<string, string>) =>
      apiClient.post('/settings', {
        namespace: `notifications.${channel}`,
        key: 'config',
        valueJson: JSON.stringify(value),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings-notifications', channel] });
      toast.success(`${channel.toUpperCase()} settings saved`);
    },
    onError: () => toast.error('Failed to save settings'),
  });

  return { data: (data as Record<string, string>) ?? DEFAULTS[channel], isLoading, saveMutation };
}

function FieldRow({
  label,
  name,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="grid grid-cols-3 gap-4 items-center">
      <label className="text-sm font-medium text-right pr-2">{label}</label>
      <input
        name={name}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="col-span-2 border border-[var(--border)] rounded-lg px-3 py-2 text-sm bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
      />
    </div>
  );
}

function SmtpPanel() {
  const { data, isLoading, saveMutation } = useChannelSetting('smtp');
  const [form, setForm] = useState<Record<string, string>>({});
  const values = { ...DEFAULTS.smtp, ...data, ...form };

  if (isLoading) return <div className="animate-pulse h-48 bg-[var(--muted)] rounded-xl" />;

  return (
    <div className="space-y-4">
      <FieldRow label="SMTP Host" name="host" value={values.host} onChange={(v) => setForm((f) => ({ ...f, host: v }))} placeholder="smtp.example.com" />
      <FieldRow label="Port" name="port" value={values.port} onChange={(v) => setForm((f) => ({ ...f, port: v }))} placeholder="587" />
      <FieldRow label="Username" name="user" value={values.user} onChange={(v) => setForm((f) => ({ ...f, user: v }))} />
      <FieldRow label="Password" name="pass" type="password" value={values.pass} onChange={(v) => setForm((f) => ({ ...f, pass: v }))} />
      <FieldRow label="From Address" name="from" value={values.from} onChange={(v) => setForm((f) => ({ ...f, from: v }))} placeholder="no-reply@example.com" />
      <div className="flex justify-end pt-2">
        <button
          onClick={() => saveMutation.mutate(values)}
          disabled={saveMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-sm font-medium disabled:opacity-50"
        >
          <Save size={14} /> {saveMutation.isPending ? 'Saving...' : 'Save SMTP'}
        </button>
      </div>
    </div>
  );
}

function WebhookPanel({ channel }: { channel: 'slack' | 'discord' }) {
  const { data, isLoading, saveMutation } = useChannelSetting(channel);
  const [url, setUrl] = useState('');
  const value = url || (data as { webhookUrl?: string }).webhookUrl || '';

  if (isLoading) return <div className="animate-pulse h-20 bg-[var(--muted)] rounded-xl" />;

  return (
    <div className="space-y-4">
      <FieldRow
        label="Webhook URL"
        name="webhookUrl"
        value={value}
        onChange={setUrl}
        placeholder={`https://hooks.${channel}.com/...`}
      />
      <div className="flex justify-end pt-2">
        <button
          onClick={() => saveMutation.mutate({ webhookUrl: value })}
          disabled={saveMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-sm font-medium disabled:opacity-50"
        >
          <Save size={14} /> {saveMutation.isPending ? 'Saving...' : `Save ${channel.charAt(0).toUpperCase() + channel.slice(1)}`}
        </button>
      </div>
    </div>
  );
}

function TelegramPanel() {
  const { data, isLoading, saveMutation } = useChannelSetting('telegram');
  const [form, setForm] = useState<Record<string, string>>({});
  const values = { ...DEFAULTS.telegram, ...data, ...form };

  if (isLoading) return <div className="animate-pulse h-28 bg-[var(--muted)] rounded-xl" />;

  return (
    <div className="space-y-4">
      <FieldRow label="Bot Token" name="botToken" value={values.botToken} onChange={(v) => setForm((f) => ({ ...f, botToken: v }))} placeholder="123456:ABC-DEF..." />
      <FieldRow label="Chat ID" name="chatId" value={values.chatId} onChange={(v) => setForm((f) => ({ ...f, chatId: v }))} placeholder="-1001234567890" />
      <div className="flex justify-end pt-2">
        <button
          onClick={() => saveMutation.mutate(values)}
          disabled={saveMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-sm font-medium disabled:opacity-50"
        >
          <Save size={14} /> {saveMutation.isPending ? 'Saving...' : 'Save Telegram'}
        </button>
      </div>
    </div>
  );
}

const TABS: { key: ChannelKey; label: string }[] = [
  { key: 'smtp', label: 'Email (SMTP)' },
  { key: 'slack', label: 'Slack' },
  { key: 'discord', label: 'Discord' },
  { key: 'telegram', label: 'Telegram' },
];

export default function NotificationChannelsPage() {
  const [tab, setTab] = useState<ChannelKey>('smtp');

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Notification Channels</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Configure SMTP, Slack, Discord, and Telegram delivery settings
          </p>
        </div>

        <div className="flex gap-2 border-b border-[var(--border)]">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key
                  ? 'border-[var(--primary)] text-[var(--primary)]'
                  : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-[var(--border)] p-6 max-w-2xl">
          {tab === 'smtp' && <SmtpPanel />}
          {tab === 'slack' && <WebhookPanel channel="slack" />}
          {tab === 'discord' && <WebhookPanel channel="discord" />}
          {tab === 'telegram' && <TelegramPanel />}
        </div>
      </div>
    </AppShell>
  );
}
