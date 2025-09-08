'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { KpiForm, KpiFormValues } from '@/components/KpiForm';
import { useToast } from '@/components/ui/toast';

function useKpi(id?: string) {
  return useQuery({
    queryKey: ['kpi', id],
    queryFn: async () => {
      if (!id) return null;
      const res = await fetch(`/api/kpis/${id}`);
      if (!res.ok) throw new Error('Failed to fetch KPI');
      return res.json();
    },
    enabled: !!id,
  });
}

function useKpiStatuses(kpiId?: string) {
  return useQuery({
    queryKey: ['kpi-statuses', kpiId],
    queryFn: async () => {
      if (!kpiId) return [] as any[];
      const res = await fetch(`/api/kpis/${kpiId}/statuses`);
      if (!res.ok) throw new Error('Failed to fetch KPI Statuses');
      return res.json();
    },
    enabled: !!kpiId,
  });
}

export default function KpiDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: kpi, isLoading } = useKpi(id);
  const { data: statuses = [], isLoading: statusesLoading } = useKpiStatuses(id);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newStatus, setNewStatus] = useState<{ year: number; quarter: 'Q1'|'Q2'|'Q3'|'Q4'; amount: number }>({
    year: new Date().getFullYear(),
    quarter: 'Q1',
    amount: 0,
  });

  async function handleUpdate(values: KpiFormValues) {
    const res = await fetch(`/api/kpis/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err.error || 'Failed to update KPI');
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ['kpi', id] });
    showToast({ title: 'KPI updated', description: 'Your changes have been saved.' });
  }

  async function addStatus() {
    if (!id) return;
    try {
      setCreating(true);
      const res = await fetch(`/api/kpis/${id}/statuses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStatus),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showToast({ title: 'Add status failed', description: err.error || 'Failed to add status', type: 'destructive' });
        return;
      }
      setNewStatus({ year: new Date().getFullYear(), quarter: 'Q1', amount: 0 });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['kpi-statuses', id] }),
        queryClient.invalidateQueries({ queryKey: ['kpi', id] }),
      ]);
      showToast({ title: 'Status added', description: 'KPI status created and KPI updated.' });
    } finally {
      setCreating(false);
    }
  }

  async function updateStatus(statusId: string, patch: Partial<{ year: number; quarter: 'Q1'|'Q2'|'Q3'|'Q4'; amount: number }>) {
    if (!id) return;
    const res = await fetch(`/api/kpis/${id}/statuses/${statusId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      showToast({ title: 'Update failed', description: err.error || 'Could not update status', type: 'destructive' });
      return;
    }
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['kpi-statuses', id] }),
      queryClient.invalidateQueries({ queryKey: ['kpi', id] }),
    ]);
  }

  async function deleteStatus(statusId: string) {
    if (!id) return;
    const res = await fetch(`/api/kpis/${id}/statuses/${statusId}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      showToast({ title: 'Delete failed', description: err.error || 'Could not delete status', type: 'destructive' });
      return;
    }
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['kpi-statuses', id] }),
      queryClient.invalidateQueries({ queryKey: ['kpi', id] }),
    ]);
    showToast({ title: 'Status removed', description: 'KPI updated.' });
  }

  async function handleConfirmDelete() {
    if (!id) return;
    try {
      setDeleting(true);
      const res = await fetch(`/api/kpis/${id}`, { method: 'DELETE', cache: 'no-store' });
      let raw = '';
      try { raw = await res.clone().text(); } catch {}
      if (!res.ok && res.status !== 204) {
        let msg = 'Failed to delete KPI';
        try { const json = JSON.parse(raw); msg = json?.error || msg; } catch {}
        showToast({ title: 'Delete failed', description: msg, type: 'destructive' });
        return;
      }
      showToast({ title: 'KPI deleted', description: 'The KPI was deleted successfully.' });
      await router.push('/kpis');
      router.refresh();
    } finally {
      setDeleting(false);
      setShowConfirm(false);
    }
  }

  if (isLoading || !kpi) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold">{kpi.name}</h1>
          <p className="mt-1 text-sm text-gray-500">{kpi.quarter} {kpi.year} — {kpi.Team?.name || 'No team'}</p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowConfirm(true); }}
            disabled={deleting}
            className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Delete KPI"
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>

      {/* Back button */}
      <div className="mb-4">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
        >
          Back
        </button>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <KpiForm
          defaultValues={{
            name: kpi.name,
            targetMetric: kpi.targetMetric ?? undefined,
            actualMetric: kpi.actualMetric ?? undefined,
            forecastedRevenue: kpi.forecastedRevenue ?? undefined,
            actualRevenue: kpi.actualRevenue ?? undefined,
            quarter: kpi.quarter,
            year: kpi.year,
            organizationId: kpi.organizationId,
            teamId: kpi.teamId,
            initiativeId: kpi.initiativeId ?? undefined,
            kpiType: (kpi as any).kpiType,
            revenueImpacting: (kpi as any).revenueImpacting ?? false,
            businessUnitIds: Array.isArray((kpi as any).KpiBusinessUnit) ? (kpi as any).KpiBusinessUnit.map((j: any) => j.businessUnitId) : ((kpi as any).businessUnitId ? [(kpi as any).businessUnitId] : []),
          }}
          onSubmit={handleUpdate}
          submitLabel="Update KPI"
        />
      </div>

      {/* KPI Status Management */}
      <div className="mt-8 bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900">KPI Status</h2>
        <p className="text-sm text-gray-500">Track progress entries by quarter. Actual is computed from the sum.</p>

        {/* Add new status */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700">Year</label>
            <input type="number" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" value={newStatus.year} onChange={(e) => setNewStatus((s) => ({ ...s, year: parseInt(e.target.value || '0') }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Quarter</label>
            <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" value={newStatus.quarter} onChange={(e) => setNewStatus((s) => ({ ...s, quarter: e.target.value as any }))}>
              {['Q1','Q2','Q3','Q4'].map((q) => <option key={q} value={q}>{q}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Metric Amount</label>
            <input type="number" step="any" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" value={newStatus.amount} onChange={(e) => setNewStatus((s) => ({ ...s, amount: Number(e.target.value || 0) }))} />
          </div>
          <div>
            <button onClick={() => { void addStatus(); }} disabled={creating} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">{creating ? 'Adding…' : 'Add Status'}</button>
          </div>
        </div>

        {/* Status list */}
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quarter</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-4 py-2"/>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(statuses || []).map((s: any) => (
                <tr key={s.id}>
                  <td className="px-4 py-2">
                    <input type="number" className="w-28 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" defaultValue={s.year} onBlur={(e) => updateStatus(s.id, { year: parseInt(e.target.value || '0') })} />
                  </td>
                  <td className="px-4 py-2">
                    <select className="w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" defaultValue={s.quarter} onChange={(e) => updateStatus(s.id, { quarter: e.target.value as any })}>
                      {['Q1','Q2','Q3','Q4'].map((q) => <option key={q} value={q}>{q}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <input type="number" step="any" className="w-36 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" defaultValue={s.amount ?? 0} onBlur={(e) => updateStatus(s.id, { amount: Number(e.target.value || 0) })} />
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button onClick={() => { void deleteStatus(s.id); }} className="px-3 py-1.5 text-sm rounded-md border border-red-300 text-red-700 bg-white hover:bg-red-50">Delete</button>
                  </td>
                </tr>
              ))}
              {(!statuses || statuses.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-4 py-4 text-center text-sm text-gray-500">No status entries yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quarterly Breakdown Cards */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {(['Q1','Q2','Q3','Q4'] as const).map((q) => {
          const total = (statuses || []).filter((s: any) => s.quarter === q).reduce((acc: number, s: any) => acc + (s.amount || 0), 0);
          return (
            <div key={q} className="bg-white shadow rounded-lg p-4">
              <div className="text-sm text-gray-500">{q} Total</div>
              <div className="text-2xl font-semibold text-gray-900">{total}</div>
            </div>
          );
        })}
      </div>

      {kpi.Initiative && (
        <div className="mt-8">
          <h2 className="text-sm font-medium text-gray-500">Linked Initiative</h2>
          <p className="mt-1">
            <Link href={`/initiatives/${kpi.Initiative.id}`} className="text-blue-600 hover:underline">
              {kpi.Initiative.name}
            </Link>
          </p>
        </div>
      )}
      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowConfirm(false)} />
          <div className="relative bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-gray-900">Delete KPI</h3>
            <p className="mt-2 text-sm text-gray-600">Are you sure you want to delete this KPI? This action cannot be undone.</p>
            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                onClick={() => setShowConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 text-sm rounded-md border border-red-300 text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                disabled={deleting}
                onClick={() => { void handleConfirmDelete(); }}
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
