'use client';

import { AppShell } from '../../../components/layout/AppShell';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api';
import { toast } from 'sonner';
import { Plus, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface Environment {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
}

function CreateEnvModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');

  const createMutation = useMutation({
    mutationFn: () => apiClient.post('/settings/environments', { name, slug }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['environments'] });
      toast.success('Environment created');
      onClose();
    },
    onError: () => toast.error('Failed to create environment'),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[var(--background)] rounded-xl border border-[var(--border)] p-6 w-full max-w-sm space-y-4">
        <h2 className="text-lg font-semibold">New Environment</h2>
        <div className="space-y-1">
          <label className="text-sm font-medium">Name</label>
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
            }}
            placeholder="Production"
            className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm bg-[var(--background)]"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Slug</label>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="production"
            className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm bg-[var(--background)] font-mono"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-[var(--border)] hover:bg-[var(--muted)]">
            Cancel
          </button>
          <button
            onClick={() => createMutation.mutate()}
            disabled={!name || !slug || createMutation.isPending}
            className="px-4 py-2 text-sm rounded-lg bg-[var(--primary)] text-white disabled:opacity-50"
          >
            {createMutation.isPending ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EnvironmentsPage() {
  const [showCreate, setShowCreate] = useState(false);

  const { data: environments = [], isLoading } = useQuery<Environment[]>({
    queryKey: ['environments'],
    queryFn: (): Promise<Environment[]> =>
      apiClient.get('/settings/environments').then((r) => r.data as Environment[]),
  });

  return (
    <AppShell>
      {showCreate && <CreateEnvModal onClose={() => setShowCreate(false)} />}

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Environments</h1>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              Manage dev, staging, and production environment configs
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-sm font-medium"
          >
            <Plus size={16} /> New Environment
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse h-16 bg-[var(--muted)] rounded-xl" />
            ))}
          </div>
        ) : environments.length === 0 ? (
          <div className="rounded-xl border border-[var(--border)] p-12 text-center text-[var(--muted-foreground)]">
            No environments configured. Create one to manage variables.
          </div>
        ) : (
          <div className="space-y-3">
            {environments.map((env) => (
              <Link
                key={env.id}
                href={`/settings/environments/${env.id}`}
                className="flex items-center gap-4 rounded-xl border border-[var(--border)] px-4 py-3 hover:bg-[var(--muted)] transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{env.name}</span>
                    {env.isActive && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--muted-foreground)] font-mono mt-0.5">{env.slug}</p>
                </div>
                <ChevronRight size={16} className="text-[var(--muted-foreground)]" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
