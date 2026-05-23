'use client';

import { AppShell } from '../../../components/layout/AppShell';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api';
import { Package, TrendingUp, Layers } from 'lucide-react';

interface DemandRecord {
  id: string;
  sku: string;
  period: string;
  quantity: number;
  unit: string;
  confidence: number;
}

interface SupplyRecord {
  id: string;
  sku: string;
  supplier: string;
  availableQty: number;
  leadTimeDays: number;
  cost: number;
}

interface AllocationRecord {
  id: string;
  sku: string;
  source: string;
  destination: string;
  allocatedQty: number;
  status: string;
}

type PlanTab = 'demand' | 'supply' | 'allocation';

function StatusBadge({ status }: { status: string }) {
  const color =
    status === 'confirmed'
      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      : status === 'pending'
      ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
      : 'bg-[var(--muted)] text-[var(--muted-foreground)]';
  return <span className={`text-xs px-2 py-0.5 rounded-full ${color}`}>{status}</span>;
}

export default function SupplyChainPage() {
  const [tab, setTab] = useState<PlanTab>('demand');

  const { data: demand = [], isLoading: demandLoading } = useQuery<DemandRecord[]>({
    queryKey: ['axon-plan-demand'],
    queryFn: (): Promise<DemandRecord[]> =>
      apiClient.get('/axon/plan/demand').then((r) => r.data as DemandRecord[]),
  });

  const { data: supply = [], isLoading: supplyLoading } = useQuery<SupplyRecord[]>({
    queryKey: ['axon-plan-supply'],
    queryFn: (): Promise<SupplyRecord[]> =>
      apiClient.get('/axon/plan/supply').then((r) => r.data as SupplyRecord[]),
  });

  const { data: allocations = [], isLoading: allocLoading } = useQuery<AllocationRecord[]>({
    queryKey: ['axon-plan-allocation'],
    queryFn: (): Promise<AllocationRecord[]> =>
      apiClient.get('/axon/plan/allocation').then((r) => r.data as AllocationRecord[]),
  });

  const isLoading = demandLoading || supplyLoading || allocLoading;

  const tabs: { key: PlanTab; label: string; icon: React.ElementType }[] = [
    { key: 'demand', label: 'Demand', icon: TrendingUp },
    { key: 'supply', label: 'Supply', icon: Package },
    { key: 'allocation', label: 'Allocation', icon: Layers },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Supply Chain Plan</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Read-only view of demand forecasts, supply availability, and allocation decisions from{' '}
            <code className="font-mono text-xs">axon_plan</code>
          </p>
        </div>

        {/* Summary KPIs */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Demand Records', value: demand.length, icon: TrendingUp, color: 'text-blue-500' },
            { label: 'Supply Sources', value: supply.length, icon: Package, color: 'text-green-500' },
            { label: 'Allocations', value: allocations.length, icon: Layers, color: 'text-purple-500' },
          ].map((kpi) => (
            <div key={kpi.label} className="rounded-xl border border-[var(--border)] p-4 flex items-center gap-4">
              <kpi.icon size={24} className={kpi.color} />
              <div>
                <p className="text-2xl font-bold">{isLoading ? '—' : kpi.value}</p>
                <p className="text-xs text-[var(--muted-foreground)]">{kpi.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-[var(--border)]">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                tab === key
                  ? 'border-[var(--primary)] text-[var(--primary)]'
                  : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        {/* Demand Table */}
        {tab === 'demand' && (
          <div className="rounded-xl border border-[var(--border)] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[var(--muted)]/50">
                <tr>
                  {['SKU', 'Period', 'Quantity', 'Unit', 'Confidence'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium text-xs uppercase tracking-wide text-[var(--muted-foreground)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {demandLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-t border-[var(--border)]">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-4 bg-[var(--muted)] rounded animate-pulse" /></td>
                      ))}
                    </tr>
                  ))
                ) : demand.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-[var(--muted-foreground)]">No demand records</td></tr>
                ) : demand.map((d) => (
                  <tr key={d.id} className="border-t border-[var(--border)] hover:bg-[var(--muted)]/30">
                    <td className="px-4 py-3 font-mono text-xs font-medium">{d.sku}</td>
                    <td className="px-4 py-3 text-[var(--muted-foreground)]">{d.period}</td>
                    <td className="px-4 py-3 font-semibold">{d.quantity.toLocaleString()}</td>
                    <td className="px-4 py-3 text-[var(--muted-foreground)]">{d.unit}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-[var(--muted)] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${d.confidence * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-[var(--muted-foreground)]">{Math.round(d.confidence * 100)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Supply Table */}
        {tab === 'supply' && (
          <div className="rounded-xl border border-[var(--border)] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[var(--muted)]/50">
                <tr>
                  {['SKU', 'Supplier', 'Available Qty', 'Lead Time', 'Unit Cost'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium text-xs uppercase tracking-wide text-[var(--muted-foreground)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {supplyLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-t border-[var(--border)]">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-4 bg-[var(--muted)] rounded animate-pulse" /></td>
                      ))}
                    </tr>
                  ))
                ) : supply.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-[var(--muted-foreground)]">No supply records</td></tr>
                ) : supply.map((s) => (
                  <tr key={s.id} className="border-t border-[var(--border)] hover:bg-[var(--muted)]/30">
                    <td className="px-4 py-3 font-mono text-xs font-medium">{s.sku}</td>
                    <td className="px-4 py-3">{s.supplier}</td>
                    <td className="px-4 py-3 font-semibold">{s.availableQty.toLocaleString()}</td>
                    <td className="px-4 py-3 text-[var(--muted-foreground)]">{s.leadTimeDays}d</td>
                    <td className="px-4 py-3">${s.cost.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Allocation Table */}
        {tab === 'allocation' && (
          <div className="rounded-xl border border-[var(--border)] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[var(--muted)]/50">
                <tr>
                  {['SKU', 'Source', 'Destination', 'Allocated Qty', 'Status'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium text-xs uppercase tracking-wide text-[var(--muted-foreground)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allocLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-t border-[var(--border)]">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-4 bg-[var(--muted)] rounded animate-pulse" /></td>
                      ))}
                    </tr>
                  ))
                ) : allocations.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-[var(--muted-foreground)]">No allocation records</td></tr>
                ) : allocations.map((a) => (
                  <tr key={a.id} className="border-t border-[var(--border)] hover:bg-[var(--muted)]/30">
                    <td className="px-4 py-3 font-mono text-xs font-medium">{a.sku}</td>
                    <td className="px-4 py-3">{a.source}</td>
                    <td className="px-4 py-3">{a.destination}</td>
                    <td className="px-4 py-3 font-semibold">{a.allocatedQty.toLocaleString()}</td>
                    <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
