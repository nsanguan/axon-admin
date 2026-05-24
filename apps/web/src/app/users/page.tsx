'use client';

import { AppShell } from '../../components/layout/AppShell';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api';
import { toast } from 'sonner';

interface UserRow {
  id: string;
  email: string;
  name?: string;
  isActive: boolean;
  hasMfaEnabled: boolean;
  createdAt: string;
  userRoles: { role: { name: string } }[];
}

interface PaginatedUsers {
  data: UserRow[];
  total: number;
  page: number;
  totalPages: number;
}

export default function UsersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery<PaginatedUsers>({
    queryKey: ['rbac-users', search, page],
    queryFn: () =>
      apiClient.get('/rbac/users', { params: { search: search || undefined, page } }).then((r) => r.data),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiClient.patch(`/rbac/users/${id}/toggle-active`, { isActive }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['rbac-users'] }); toast.success('User updated'); },
    onError: () => toast.error('Failed to update user'),
  });

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">Manage users, roles, and permissions</p>
        </div>
        <div className="flex gap-3">
          <input type="text" placeholder="Search users..." className="border border-[var(--border)] rounded-lg px-3 py-2 text-sm bg-[var(--background)] w-60" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <div className="rounded-xl border border-[var(--border)] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[var(--muted)] text-[var(--muted-foreground)] text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Display Name</th>
                <th className="px-4 py-3 text-left">Roles</th>
                <th className="px-4 py-3 text-left">MFA</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-t border-[var(--border)]">{Array.from({ length: 6 }).map((_, j) => (<td key={j} className="px-4 py-3"><div className="h-4 bg-[var(--muted)] rounded animate-pulse" /></td>))}</tr>
              )) : data?.data.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-[var(--muted-foreground)]">No users found</td></tr>
              ) : data?.data.map((u) => (
                <tr key={u.id} className="border-t border-[var(--border)] hover:bg-[var(--muted)]/40">
                  <td className="px-4 py-3 font-medium">{u.email}</td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">{u.name || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {u.userRoles.map((r) => (
                        <span key={r.role.name} className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">{r.role.name}</span>
                      ))}
                      {u.userRoles.length === 0 && <span className="text-[var(--muted-foreground)] text-xs">No roles</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${u.hasMfaEnabled ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-300'}`}>{u.hasMfaEnabled ? 'Enabled' : 'Disabled'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{u.isActive ? 'Active' : 'Inactive'}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => toggleMutation.mutate({ id: u.id, isActive: !u.isActive })} className={`text-xs px-2 py-1 rounded border transition-colors ${ u.isActive ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-green-200 text-green-600 hover:bg-green-50' }`}>
                      {u.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between text-sm text-[var(--muted-foreground)]">
            <span>{data.total} total</span>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 rounded border border-[var(--border)] disabled:opacity-40">Prev</button>
              <span className="px-3 py-1">{page} / {data.totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))} disabled={page === data.totalPages} className="px-3 py-1 rounded border border-[var(--border)] disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
