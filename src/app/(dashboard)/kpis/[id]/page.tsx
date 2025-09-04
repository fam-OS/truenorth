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

export default function KpiDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: kpi, isLoading } = useKpi(id);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
          }}
          onSubmit={handleUpdate}
          submitLabel="Update KPI"
        />
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
