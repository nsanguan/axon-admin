'use client';

import { AppShell } from '../../components/layout/AppShell';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/api';

type LogTab = 'audit' | 'system' | 'execution';

const LEVEL_COLORS: Record<string, string> = {
  ERROR: 'text-red-600',
  WARN: 'text-yellow-600',
  INFO: 'text-blue-600',
  HTTP: 'text-green-600',
  DEBUG: 'text-gray-500',
};

export default function LogsPage() {
  const [tab, setTab] = useState<LogTab>('audit');
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['logs', tab, search, level, page],
    queryFn: () =>
      apiClient.get(`/logs/${tab}`, { params: { search: search || undefined, level: level || undefined, page } }).then((r) => r.data),
  });

  const tabs: LogTab[] = ['audit', 'system', 'execution'];

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Logs & Monitoring</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">Audit trail, system logs, and execution history</p>
        </div>

        <div className="flex gap-2 border-b border-[var(--border)]">
          {tabs.map((t) => (
            <button key={t} onClick={() => { setTab(t); setPage(1); }} className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${ tab === t ? 'border-[var(--primary)] text-[var(--primary)]' : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]' }`}>{t}</button>
          ))}
        </div>

        <div className="flex gap-3">
          <input type="text" placeholder="Search..." className="border border-[var(--border)] rounded-lg px-3 py-2 text-sm bg-[var(--background)] w-60" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          {tab === 'system' && (
            <select className="border border-[var(--border)] rounded-lg px-3 py-2 text-sm bg-[var(--background)]" value={level} onChange={(e) => { setLevel(e.target.value); setPage(1); }}>
              <option value="">All Levels</option>
              {['ERROR','WARN','INFO','HTTP','DEBUG'].map((l) => (<option key={l} value={l}>{l}</option>))}
            </select>
          )}
        </div>

        <div className="rounded-xl border border-[var(--border)] overflow-hidden">
          <table className="w-full text-xs font-mono">
            <thead className="bg-[var(--muted)] text-[var(--muted-foreground)] text-xs uppercase tracking-wide font-sans">
              <tr>
                <th className="px-4 py-3 text-left">Time</th>
                {tab === 'audit' && <><th className="px-4 py-3 text-left">User</th><th className="px-4 py-3 text-left">Action</th><th className="px-4 py-3 text-left">Resource</th></>}
                {tab === 'system' && <><th className="px-4 py-3 text-left">Level</th><th className="px-4 py-3 text-left">Message</th></>}
                {tab === 'execution' && <><th className="px-4 py-3 text-left">Status</th><th className="px-4 py-3 text-left">Plugin</th><th className="px-4 py-3 text-left">Duration</th></>}
              </tr>
            </thead>
            <tbody>
              {isLoading ? Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-t border-[var(--border)]">
                  {Array.from({ length: 4 }).map((_, j) => (<td key={j} className="px-4 py-2"><div className="h-3 bg-[var(--muted)] rounded animate-pulse" /></td>))}
                </tr>
              )) : data?.data?.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-[var(--muted-foreground)] font-sans">No logs found</td></tr>
              ) : data?.data?.map((log: Record<string, string>) => (
                <tr key={log.id} className="border-t border-[var(--border)] hover:bg-[var(--muted)]/40">
                  <td className="px-4 py-2 text-[var(--muted-foreground)]">{new Date(log.createdAt).toLocaleString()}</td>
                  {tab === 'audit' && <>
                    <td className="px-4 py-2">{(log as Record<string, Record<string, string>>).user?.email || log.userId || '—'}</td>
                    <td className="px-4 py-2">{log.action}</td>
                    <td className="px-4 py-2">{log.resourceType} {log.resourceId ? `(${log.resourceId.slice(0,8)}...)` : ''}</td>
                  </>}
                  {tab === 'system' && <>
                    <td className={`px-4 py-2 font-semibold ${LEVEL_COLORS[log.level] || ''}`}>{log.level}</td>
                    <td className="px-4 py-2 max-w-[500px] truncate">{log.message}</td>
                  </>}
                  {tab === 'execution' && <>
                    <td className="px-4 py-2">{log.status}</td>
                    <td className="px-4 py-2">{log.pluginId || '—'}</td>
                    <td className="px-4 py-2">{log.durationMs ? `${log.durationMs}ms` : '—'}</td>
                  </>}
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
      <h1 className="text-2xl font-bold mb-4">Logs</h1>
      <p className="text-[var(--muted-foreground)]">Coming soon — Phase implementation in progress.</p>
    </AppShell>
  );
}
