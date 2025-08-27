'use client';

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

  async function handleDelete() {
    if (!id) return;
    if (!confirm('Delete this KPI? This action cannot be undone.')) return;
    const res = await fetch(`/api/kpis/${id}`, { method: 'DELETE' });
    if (!res.ok && res.status !== 204) {
      const err = await res.json().catch(() => ({}));
      alert(err.error || 'Failed to delete KPI');
      return;
    }
    router.push('/kpis');
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
          <p className="mt-1 text-sm text-gray-500">{kpi.quarter} {kpi.year} — {kpi.team?.name || 'No team'}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleDelete} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700">
            Delete
          </button>
        </div>
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

      {kpi.initiative && (
        <div className="mt-8">
          <h2 className="text-sm font-medium text-gray-500">Linked Initiative</h2>
          <p className="mt-1">
            <Link href={`/initiatives/${kpi.initiative.id}`} className="text-blue-600 hover:underline">
              {kpi.initiative.name}
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
