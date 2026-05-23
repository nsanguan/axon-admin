'use client';

import { AppShell } from '../../../components/layout/AppShell';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api';
import { toast } from 'sonner';
import { Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';

interface NotificationRule {
  id: string;
  eventType: string;
  conditionJson: Record<string, unknown>;
  channelsJson: string[];
  isActive: boolean;
  createdAt: string;
}

const EVENT_TYPES = [
  'plugin.failure',
  'mcp.disconnect',
  'auth.failure',
  'latency.high',
  'token.expiry',
  'security.alert',
];

const CHANNELS = ['email', 'slack', 'discord', 'telegram', 'in_app'];

function RuleModal({
  onClose,
  editing,
}: {
  onClose: () => void;
  editing?: NotificationRule;
}) {
  const qc = useQueryClient();
  const [eventType, setEventType] = useState(editing?.eventType ?? EVENT_TYPES[0]);
  const [channels, setChannels] = useState<string[]>(editing?.channelsJson ?? ['in_app']);
  const [threshold, setThreshold] = useState(
    editing ? String((editing.conditionJson as { threshold?: number }).threshold ?? '') : '',
  );

  const toggleChannel = (ch: string) =>
    setChannels((prev) => (prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]));

  const saveMutation = useMutation({
    mutationFn: (body: object) =>
      editing
        ? apiClient.patch(`/notifications/rules/${editing.id}`, body)
        : apiClient.post('/notifications/rules', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notification-rules'] });
      toast.success(editing ? 'Rule updated' : 'Rule created');
      onClose();
    },
    onError: () => toast.error('Failed to save rule'),
  });

  const handleSave = () => {
    if (!channels.length) return toast.error('Select at least one channel');
    saveMutation.mutate({
      eventType,
      conditionJson: threshold ? { threshold: Number(threshold) } : {},
      channelsJson: channels,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[var(--background)] rounded-xl border border-[var(--border)] p-6 w-full max-w-md space-y-4">
        <h2 className="text-lg font-semibold">{editing ? 'Edit Rule' : 'New Rule'}</h2>

        <div className="space-y-1">
          <label className="text-sm font-medium">Event Type</label>
          <select
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm bg-[var(--background)]"
          >
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Threshold (optional)</label>
          <input
            type="number"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            placeholder="e.g. 500 for latency ms"
            className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm bg-[var(--background)]"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Channels</label>
          <div className="flex flex-wrap gap-2">
            {CHANNELS.map((ch) => (
              <button
                key={ch}
                onClick={() => toggleChannel(ch)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  channels.includes(ch)
                    ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                    : 'border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--primary)]'
                }`}
              >
                {ch}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-[var(--border)] hover:bg-[var(--muted)]">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="px-4 py-2 text-sm rounded-lg bg-[var(--primary)] text-white disabled:opacity-50"
          >
            {saveMutation.isPending ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function NotificationRulesPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<'new' | NotificationRule | null>(null);

  const { data: rules = [], isLoading } = useQuery<NotificationRule[]>({
    queryKey: ['notification-rules'],
    queryFn: (): Promise<NotificationRule[]> =>
      apiClient.get('/notifications/rules').then((r) => r.data as NotificationRule[]),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiClient.patch(`/notifications/rules/${id}`, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notification-rules'] }),
    onError: () => toast.error('Failed to update rule'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/notifications/rules/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notification-rules'] });
      toast.success('Rule deleted');
    },
    onError: () => toast.error('Failed to delete rule'),
  });

  return (
    <AppShell>
      {modal && (
        <RuleModal
          editing={modal === 'new' ? undefined : modal}
          onClose={() => setModal(null)}
        />
      )}

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Notification Rules</h1>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              Trigger notifications on system events with configurable conditions
            </p>
          </div>
          <button
            onClick={() => setModal('new')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-sm font-medium"
          >
            <Plus size={16} /> Add Rule
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse h-16 bg-[var(--muted)] rounded-xl" />
            ))}
          </div>
        ) : rules.length === 0 ? (
          <div className="rounded-xl border border-[var(--border)] p-12 text-center text-[var(--muted-foreground)]">
            No rules configured. Add one to get started.
          </div>
        ) : (
          <div className="space-y-3">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="flex items-center gap-4 rounded-xl border border-[var(--border)] px-4 py-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{rule.eventType}</p>
                  <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                    Channels: {rule.channelsJson.join(', ')}
                    {(rule.conditionJson as { threshold?: number }).threshold
                      ? ` · threshold: ${(rule.conditionJson as { threshold?: number }).threshold}`
                      : ''}
                  </p>
                </div>
                <button
                  onClick={() => toggleMutation.mutate({ id: rule.id, isActive: !rule.isActive })}
                  className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  title={rule.isActive ? 'Disable' : 'Enable'}
                >
                  {rule.isActive ? (
                    <ToggleRight size={22} className="text-green-500" />
                  ) : (
                    <ToggleLeft size={22} />
                  )}
                </button>
                <button
                  onClick={() => setModal(rule)}
                  className="text-xs px-2 py-1 rounded border border-[var(--border)] hover:bg-[var(--muted)]"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteMutation.mutate(rule.id)}
                  className="text-red-500 hover:text-red-600"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
