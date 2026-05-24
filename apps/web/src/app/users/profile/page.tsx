'use client';

import { AppShell } from '../../../components/layout/AppShell';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api';
import { toast } from 'sonner';
import { Save, Trash2, Lock, Monitor, Shield } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

interface Session { id: string; ip?: string; userAgent?: string; createdAt: string; expiresAt: string }
interface Me {
  id: string;
  name?: string;
  email: string;
  avatar?: string;
  isActive: boolean;
  userRoles: { role: { id: string; name: string } }[];
}

const pwSchema = z
  .object({
    currentPassword: z.string().min(1, 'Required'),
    newPassword: z.string().min(8, 'Minimum 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });

type PwForm = z.infer<typeof pwSchema>;

export default function ProfilePage() {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const { data: me, isLoading: isMeLoading, isError: isMeError } = useQuery<Me>({
    queryKey: ['me'],
    queryFn: (): Promise<Me> => apiClient.get('/users/me').then((r) => r.data as Me),
  });

  useEffect(() => { if (me) setName(me.name || ''); }, [me]);

  const { data: sessions, isLoading: isSessionsLoading } = useQuery<Session[]>({
    queryKey: ['my-sessions'],
    queryFn: () => apiClient.get('/users/me/sessions').then((r) => r.data),
  });

  const revokeSession = useMutation({
    mutationFn: (sessionId: string) => apiClient.delete(`/users/me/sessions/${sessionId}`).then((r) => r.data),
    onSuccess: () => { toast.success('Session revoked'); qc.invalidateQueries({ queryKey: ['my-sessions'] }); },
    onError: () => toast.error('Failed to revoke session'),
  });

  const updateProfile = async () => {
    setSavingProfile(true);
    try {
      await apiClient.put('/users/me', { name });
      toast.success('Profile updated');
      qc.invalidateQueries({ queryKey: ['me'] });
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const {
    register: regPw,
    handleSubmit: handlePw,
    reset: resetPw,
    formState: { errors: pwErrors, isSubmitting: pwSubmitting },
  } = useForm<PwForm>({ resolver: zodResolver(pwSchema) });

  const onChangePassword = async (data: PwForm) => {
    try {
      await apiClient.post('/users/me/change-password', { currentPassword: data.currentPassword, newPassword: data.newPassword });
      toast.success('Password changed');
      resetPw();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to change password';
      toast.error(message);
    }
  };

  if (isMeLoading) {
    return (
      <AppShell>
        <div className="h-40 max-w-2xl animate-pulse rounded-xl bg-[var(--muted)]" />
      </AppShell>
    );
  }

  if (isMeError || !me) {
    return (
      <AppShell>
        <div className="max-w-2xl rounded-xl border border-[var(--border)] p-6 text-sm text-[var(--muted-foreground)]">
          Unable to load your profile.
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6 max-w-2xl">
        <h1 className="text-2xl font-bold">My Profile</h1>

        {/* Profile info */}
        <div className="rounded-xl border border-[var(--border)] p-6 space-y-4">
          <h2 className="font-semibold text-sm uppercase tracking-wide text-[var(--muted-foreground)]">Account Details</h2>

          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-[var(--primary)] flex items-center justify-center text-[var(--primary-foreground)] text-xl font-bold">
              {(me.name || me.email).charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-medium">{me.name || 'No name set'}</p>
              <p className="text-sm text-[var(--muted-foreground)]">{me.email}</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {(me.userRoles ?? []).map((r) => (
                  <span key={r.role.id} className="rounded-full bg-[var(--muted)] px-2 py-0.5 text-xs">{r.role.name}</span>
                ))}
                {(!me.userRoles || me.userRoles.length === 0) && (
                  <span className="text-xs text-[var(--muted-foreground)]">No roles assigned</span>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Full name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-sm border border-[var(--border)] rounded-lg px-3 py-2 bg-[var(--background)]"
            />
          </div>

          <button onClick={updateProfile} disabled={savingProfile} className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] text-sm rounded-lg hover:opacity-90 disabled:opacity-50">
            <Save size={14} /> Save profile
          </button>
        </div>

        {/* Change password */}
        <div className="rounded-xl border border-[var(--border)] p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Lock size={16} className="text-[var(--muted-foreground)]" />
            <h2 className="font-semibold text-sm uppercase tracking-wide text-[var(--muted-foreground)]">Change Password</h2>
          </div>

          <form onSubmit={handlePw(onChangePassword)} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1">Current password</label>
              <input {...regPw('currentPassword')} type="password" autoComplete="current-password" className="w-full text-sm border border-[var(--border)] rounded-lg px-3 py-2 bg-[var(--background)]" />
              {pwErrors.currentPassword && <p className="text-xs text-red-500 mt-1">{pwErrors.currentPassword.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">New password</label>
              <input {...regPw('newPassword')} type="password" autoComplete="new-password" className="w-full text-sm border border-[var(--border)] rounded-lg px-3 py-2 bg-[var(--background)]" />
              {pwErrors.newPassword && <p className="text-xs text-red-500 mt-1">{pwErrors.newPassword.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Confirm new password</label>
              <input {...regPw('confirmPassword')} type="password" autoComplete="new-password" className="w-full text-sm border border-[var(--border)] rounded-lg px-3 py-2 bg-[var(--background)]" />
              {pwErrors.confirmPassword && <p className="text-xs text-red-500 mt-1">{pwErrors.confirmPassword.message}</p>}
            </div>
            <button type="submit" disabled={pwSubmitting} className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] text-sm rounded-lg hover:opacity-90 disabled:opacity-50">
              <Lock size={14} /> Change password
            </button>
          </form>
        </div>

        {/* 2FA placeholder */}
        <div className="rounded-xl border border-[var(--border)] p-6 space-y-3">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-[var(--muted-foreground)]" />
            <h2 className="font-semibold text-sm uppercase tracking-wide text-[var(--muted-foreground)]">Two-Factor Authentication</h2>
          </div>
          <p className="text-sm text-[var(--muted-foreground)]">Protect your account with TOTP-based 2FA. Scan the QR code with your authenticator app.</p>
          <div className="h-32 w-32 bg-[var(--muted)] rounded-lg flex items-center justify-center text-xs text-[var(--muted-foreground)]">QR code</div>
          <button className="px-4 py-2 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] opacity-50 cursor-not-allowed" disabled>
            Enable 2FA (coming soon)
          </button>
        </div>

        {/* Sessions */}
        <div className="rounded-xl border border-[var(--border)] p-6 space-y-3">
          <div className="flex items-center gap-2">
            <Monitor size={16} className="text-[var(--muted-foreground)]" />
            <h2 className="font-semibold text-sm uppercase tracking-wide text-[var(--muted-foreground)]">Active Sessions</h2>
          </div>
          {isSessionsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, index) => (
                <div key={index} className="h-16 animate-pulse rounded-lg bg-[var(--muted)]" />
              ))}
            </div>
          ) : !sessions || sessions.length === 0 ? (
            <p className="text-xs text-[var(--muted-foreground)]">No sessions found</p>
          ) : (
            <div className="space-y-2">
              {sessions.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-[var(--muted)] text-xs">
                  <div>
                    <p className="font-mono">{s.ip || 'Unknown IP'}</p>
                    <p className="text-[var(--muted-foreground)] truncate max-w-xs">{s.userAgent || 'Unknown agent'}</p>
                    <p className="text-[var(--muted-foreground)]">{new Date(s.createdAt).toLocaleString()}</p>
                  </div>
                  <button onClick={() => revokeSession.mutate(s.id)} className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400">
                    <Trash2 size={10} /> Revoke
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
