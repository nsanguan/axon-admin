'use client';

import { AppShell } from '../../../components/layout/AppShell';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api';
import { toast } from 'sonner';
import { ArrowLeft, Save, Trash2, X, ShieldCheck, Monitor } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface Role { id: string; name: string; description?: string }
interface Session { id: string; ipAddress?: string; userAgent?: string; createdAt: string; lastActiveAt?: string }
interface UserDetail {
  id: string;
  name?: string;
  email: string;
  status: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
  roles: { id: string; userId: string; role: Role }[];
  sessions?: Session[];
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  suspended: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

export default function UserDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const qc = useQueryClient();
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<{ name?: string; email?: string; status?: string }>({});
  const [roleInput, setRoleInput] = useState('');

  const { data: user, isLoading } = useQuery<UserDetail>({
    queryKey: ['user', id],
    queryFn: () => apiClient.get(`/users/${id}`).then((r) => r.data),
    onSuccess: (u: UserDetail) => setForm({ name: u.name, email: u.email, status: u.status }),
  } as Parameters<typeof useQuery>[0]);

  const { data: sessions } = useQuery<Session[]>({
    queryKey: ['user-sessions', id],
    queryFn: () => apiClient.get(`/users/${id}/sessions`).then((r) => r.data),
  });

  const updateMutation = useMutation({
    mutationFn: (data: typeof form) => apiClient.put(`/users/${id}`, data).then((r) => r.data),
    onSuccess: () => { toast.success('User updated'); setEditMode(false); qc.invalidateQueries({ queryKey: ['user', id] }); },
    onError: () => toast.error('Update failed'),
  });

  const addRoleMutation = useMutation({
    mutationFn: (roleId: string) => apiClient.post(`/users/${id}/roles`, { roleId }).then((r) => r.data),
    onSuccess: () => { toast.success('Role assigned'); qc.invalidateQueries({ queryKey: ['user', id] }); setRoleInput(''); },
    onError: () => toast.error('Failed to assign role'),
  });

  const removeRoleMutation = useMutation({
    mutationFn: (roleId: string) => apiClient.delete(`/users/${id}/roles/${roleId}`).then((r) => r.data),
    onSuccess: () => { toast.success('Role removed'); qc.invalidateQueries({ queryKey: ['user', id] }); },
    onError: () => toast.error('Failed to remove role'),
  });

  const revokeSessionMutation = useMutation({
    mutationFn: (sessionId: string) => apiClient.delete(`/users/${id}/sessions/${sessionId}`).then((r) => r.data),
    onSuccess: () => { toast.success('Session revoked'); qc.invalidateQueries({ queryKey: ['user-sessions', id] }); },
    onError: () => toast.error('Failed to revoke session'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiClient.delete(`/users/${id}`).then((r) => r.data),
    onSuccess: () => { toast.success('User deleted'); window.location.href = '/users'; },
    onError: () => toast.error('Delete failed'),
  });

  if (isLoading) return <AppShell><div className="animate-pulse h-40 bg-[var(--muted)] rounded-xl" /></AppShell>;
  if (!user) return <AppShell><div className="text-[var(--muted-foreground)]">User not found</div></AppShell>;

  return (
    <AppShell>
      <div className="space-y-6 max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Link href="/users" className="p-2 rounded-lg hover:bg-[var(--muted)] text-[var(--muted-foreground)]"><ArrowLeft size={18} /></Link>
            <div>
              <h1 className="text-2xl font-bold">{user.name || user.email}</h1>
              <p className="text-sm text-[var(--muted-foreground)]">{user.email}</p>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[user.status] || ''}`}>{user.status}</span>
            {!editMode && <button onClick={() => setEditMode(true)} className="px-3 py-1.5 text-xs bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg">Edit</button>}
          </div>
        </div>

        {/* Profile */}
        <div className="rounded-xl border border-[var(--border)] p-6 space-y-4">
          <h2 className="font-semibold text-sm uppercase tracking-wide text-[var(--muted-foreground)]">Profile</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1">Full name</label>
              <input value={form.name || ''} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} disabled={!editMode} className="w-full text-sm border border-[var(--border)] rounded-lg px-3 py-2 bg-[var(--background)] disabled:opacity-60" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Status</label>
              <select value={form.status || ''} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} disabled={!editMode} className="w-full text-sm border border-[var(--border)] rounded-lg px-3 py-2 bg-[var(--background)] disabled:opacity-60">
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium mb-1">Email</label>
              <input value={form.email || ''} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} disabled={!editMode} className="w-full text-sm border border-[var(--border)] rounded-lg px-3 py-2 bg-[var(--background)] disabled:opacity-60" />
            </div>
          </div>
          {editMode && (
            <div className="flex gap-2 pt-2">
              <button onClick={() => updateMutation.mutate(form)} disabled={updateMutation.isPending} className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] text-sm rounded-lg hover:opacity-90">
                <Save size={14} /> Save
              </button>
              <button onClick={() => { setEditMode(false); setForm({ name: user.name, email: user.email, status: user.status }); }} className="px-4 py-2 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)]">Cancel</button>
            </div>
          )}
        </div>

        {/* Roles */}
        <div className="rounded-xl border border-[var(--border)] p-6 space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-[var(--muted-foreground)]" />
            <h2 className="font-semibold text-sm uppercase tracking-wide text-[var(--muted-foreground)]">Roles</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {user.roles.map((ur) => (
              <span key={ur.id} className="flex items-center gap-1 px-3 py-1 bg-[var(--muted)] rounded-full text-xs">
                {ur.role.name}
                <button onClick={() => removeRoleMutation.mutate(ur.role.id)} className="text-[var(--muted-foreground)] hover:text-red-500 ml-1"><X size={10} /></button>
              </span>
            ))}
            {user.roles.length === 0 && <span className="text-xs text-[var(--muted-foreground)]">No roles assigned</span>}
          </div>
          <div className="flex gap-2">
            <input
              value={roleInput}
              onChange={(e) => setRoleInput(e.target.value)}
              placeholder="Role ID or name"
              className="flex-1 text-sm border border-[var(--border)] rounded-lg px-3 py-2 bg-[var(--background)]"
            />
            <button onClick={() => roleInput && addRoleMutation.mutate(roleInput)} className="px-3 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] text-sm rounded-lg hover:opacity-90">
              Assign
            </button>
          </div>
        </div>

        {/* Sessions */}
        <div className="rounded-xl border border-[var(--border)] p-6 space-y-3">
          <div className="flex items-center gap-2">
            <Monitor size={16} className="text-[var(--muted-foreground)]" />
            <h2 className="font-semibold text-sm uppercase tracking-wide text-[var(--muted-foreground)]">Active Sessions</h2>
          </div>
          {!sessions || sessions.length === 0 ? (
            <p className="text-xs text-[var(--muted-foreground)]">No active sessions</p>
          ) : (
            <div className="space-y-2">
              {sessions.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-[var(--muted)] text-xs">
                  <div>
                    <p className="font-mono">{s.ipAddress || 'Unknown IP'}</p>
                    <p className="text-[var(--muted-foreground)] truncate max-w-xs">{s.userAgent || 'Unknown agent'}</p>
                    <p className="text-[var(--muted-foreground)]">{new Date(s.createdAt).toLocaleString()}</p>
                  </div>
                  <button onClick={() => revokeSessionMutation.mutate(s.id)} className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400">
                    <Trash2 size={10} /> Revoke
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Danger zone */}
        <div className="rounded-xl border border-red-300 dark:border-red-800 p-4">
          <h2 className="font-semibold text-sm text-red-600 dark:text-red-400 mb-3">Danger Zone</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Delete user</p>
              <p className="text-xs text-[var(--muted-foreground)]">This action cannot be undone.</p>
            </div>
            <button onClick={() => { if (confirm('Delete this user?')) deleteMutation.mutate(); }} className="flex items-center gap-1 px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
