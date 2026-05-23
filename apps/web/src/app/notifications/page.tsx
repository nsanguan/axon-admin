'use client';

import { AppShell } from '../../components/layout/AppShell';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api';
import { toast } from 'sonner';
import { Bell, CheckCheck } from 'lucide-react';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const qc = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: () => apiClient.get('/notifications').then((r) => r.data),
    refetchInterval: 30_000,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/notifications/${id}/read`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllMutation = useMutation({
    mutationFn: () => apiClient.patch('/notifications/read-all', {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notifications'] }); toast.success('All marked as read'); },
  });

  const unread = notifications.filter((n) => !n.isRead).length;

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Notifications</h1>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">{unread} unread</p>
          </div>
          {unread > 0 && (
            <button onClick={() => markAllMutation.mutate()} className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] transition-colors">
              <CheckCheck size={14} /> Mark all read
            </button>
          )}
        </div>

        <div className="space-y-2">
          {isLoading ? Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-[var(--border)] p-4 animate-pulse">
              <div className="h-4 bg-[var(--muted)] rounded w-48 mb-2" />
              <div className="h-3 bg-[var(--muted)] rounded w-full" />
            </div>
          )) : notifications.length === 0 ? (
            <div className="rounded-xl border border-[var(--border)] p-12 text-center">
              <Bell className="mx-auto mb-3 text-[var(--muted-foreground)]" size={32} />
              <p className="text-[var(--muted-foreground)]">No notifications</p>
            </div>
          ) : notifications.map((n) => (
            <div key={n.id} onClick={() => !n.isRead && markReadMutation.mutate(n.id)} className={`rounded-xl border p-4 cursor-pointer transition-colors ${ n.isRead ? 'border-[var(--border)] opacity-60' : 'border-[var(--primary)] bg-[var(--primary)]/5' }`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className={`text-sm font-medium ${!n.isRead ? 'text-[var(--foreground)]' : 'text-[var(--muted-foreground)]'}`}>{n.title}</p>
                  <p className="text-xs text-[var(--muted-foreground)] mt-1">{n.message}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!n.isRead && <span className="w-2 h-2 rounded-full bg-[var(--primary)]" />}
                  <span className="text-xs text-[var(--muted-foreground)]">{new Date(n.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
      <h1 className="text-2xl font-bold mb-4">Notifications</h1>
      <p className="text-[var(--muted-foreground)]">Coming soon — Phase implementation in progress.</p>
    </AppShell>
  );
}
