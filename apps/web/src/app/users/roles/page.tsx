'use client';

import { AppShell } from '../../../components/layout/AppShell';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api';
import { toast } from 'sonner';
import { Plus, Trash2, ShieldCheck } from 'lucide-react';

interface Role {
  id: string;
  name: string;
  description: string;
  _count?: { userRoles: number };
}

interface Permission {
  id: string;
  resource: string;
  action: string;
  description: string;
}

function CreateRoleModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const createMutation = useMutation({
    mutationFn: () => apiClient.post('/rbac/roles', { name, description }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Role created');
      onClose();
    },
    onError: () => toast.error('Failed to create role'),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[var(--background)] rounded-xl border border-[var(--border)] p-6 w-full max-w-sm space-y-4">
        <h2 className="text-lg font-semibold">New Role</h2>
        <div className="space-y-1">
          <label className="text-sm font-medium">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Operator"
            className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm bg-[var(--background)]"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Description</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of this role"
            className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm bg-[var(--background)]"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-[var(--border)] hover:bg-[var(--muted)]">
            Cancel
          </button>
          <button
            onClick={() => createMutation.mutate()}
            disabled={!name || createMutation.isPending}
            className="px-4 py-2 text-sm rounded-lg bg-[var(--primary)] text-white disabled:opacity-50"
          >
            {createMutation.isPending ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RolesPage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);

  const { data: roles = [], isLoading: rolesLoading } = useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: (): Promise<Role[]> =>
      apiClient.get('/rbac/roles').then((r) => r.data as Role[]),
  });

  const { data: permissions = [] } = useQuery<Permission[]>({
    queryKey: ['permissions'],
    queryFn: (): Promise<Permission[]> =>
      apiClient.get('/rbac/permissions').then((r) => r.data as Permission[]),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/rbac/roles/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Role deleted');
    },
    onError: () => toast.error('Failed to delete role'),
  });

  // Group permissions by resource
  const resourceGroups = permissions.reduce<Record<string, Permission[]>>((acc, p) => {
    if (!acc[p.resource]) acc[p.resource] = [];
    acc[p.resource].push(p);
    return acc;
  }, {});

  return (
    <AppShell>
      {showCreate && <CreateRoleModal onClose={() => setShowCreate(false)} />}

      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Roles & Permissions</h1>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              Manage system roles and view available permissions
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-sm font-medium"
          >
            <Plus size={16} /> New Role
          </button>
        </div>

        {/* Roles List */}
        <div>
          <h2 className="text-base font-semibold mb-3">Roles</h2>
          {rolesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="animate-pulse h-14 bg-[var(--muted)] rounded-xl" />)}
            </div>
          ) : (
            <div className="space-y-2">
              {roles.map((role) => (
                <div
                  key={role.id}
                  className="flex items-center gap-4 rounded-xl border border-[var(--border)] px-4 py-3"
                >
                  <ShieldCheck size={18} className="text-[var(--primary)] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{role.name}</p>
                    {role.description && (
                      <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{role.description}</p>
                    )}
                  </div>
                  {role._count && (
                    <span className="text-xs text-[var(--muted-foreground)]">
                      {role._count.userRoles} user{role._count.userRoles !== 1 ? 's' : ''}
                    </span>
                  )}
                  <button
                    onClick={() => {
                      if (confirm(`Delete role "${role.name}"?`)) deleteMutation.mutate(role.id);
                    }}
                    className="text-red-500 hover:text-red-600"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Permissions Matrix */}
        {Object.keys(resourceGroups).length > 0 && (
          <div>
            <h2 className="text-base font-semibold mb-3">Available Permissions</h2>
            <div className="rounded-xl border border-[var(--border)] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--muted)]/50">
                    <th className="text-left px-4 py-3 font-medium">Resource</th>
                    <th className="text-left px-4 py-3 font-medium">Action</th>
                    <th className="text-left px-4 py-3 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(resourceGroups).flatMap(([resource, perms]) =>
                    perms.map((p, i) => (
                      <tr key={p.id} className={i % 2 === 1 ? 'bg-[var(--muted)]/20' : ''}>
                        <td className="px-4 py-2 font-mono text-xs">{i === 0 ? resource : ''}</td>
                        <td className="px-4 py-2">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--muted)] font-mono">
                            {p.action}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-[var(--muted-foreground)] text-xs">{p.description}</td>
                      </tr>
                    )),
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
