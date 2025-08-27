'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { InitiativeForm, InitiativeFormValues } from '@/components/InitiativeForm';
import { useToast } from '@/components/ui/toast';

function useInitiative(id?: string) {
  return useQuery({
    queryKey: ['initiative', id],
    queryFn: async () => {
      if (!id) return null;
      const res = await fetch(`/api/initiatives/${id}`);
      if (!res.ok) throw new Error('Failed to fetch initiative');
      return res.json();
    },
    enabled: !!id,
  });
}

function useKpis(params: { organizationId?: string; initiativeId?: string }) {
  const { organizationId, initiativeId } = params;
  return useQuery({
    queryKey: ['kpis', organizationId, initiativeId],
    queryFn: async () => {
      if (!organizationId || !initiativeId) return [] as any[];
      const query = new URLSearchParams({ orgId: organizationId, initiativeId });
      const res = await fetch(`/api/kpis?${query}`);
      if (!res.ok) throw new Error('Failed to fetch KPIs');
      return res.json();
    },
    enabled: !!organizationId && !!initiativeId,
  });
}

export default function InitiativeDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const { currentOrg } = useOrganization();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { data: initiative, isLoading } = useInitiative(id);
  const { data: kpis = [], isLoading: kpisLoading } = useKpis({
    organizationId: currentOrg?.id,
    initiativeId: id,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsEditing(false);
  }, [id]);

  async function handleUpdate(values: InitiativeFormValues) {
    setError(null);
    const res = await fetch(`/api/initiatives/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setError(err.error || 'Failed to update initiative');
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ['initiative', id] });
    setIsEditing(false);
    showToast({ title: 'Initiative updated', description: 'Your changes have been saved.' });
  }

  async function handleDelete() {
    if (!id) return;
    if (!confirm('Delete this initiative? This action cannot be undone.')) return;
    const res = await fetch(`/api/initiatives/${id}`, { method: 'DELETE' });
    if (!res.ok && res.status !== 204) {
      const err = await res.json().catch(() => ({}));
      alert(err.error || 'Failed to delete initiative');
      return;
    }
    router.push('/initiatives');
  }

  if (isLoading || !initiative) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold">{initiative.name}</h1>
          <p className="mt-1 text-sm text-gray-500">Initiative details</p>
        </div>
        <div className="flex gap-3">
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
            >
              Edit
            </button>
          )}
          <button
            onClick={handleDelete}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Details or edit form */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}
        {isEditing ? (
          <InitiativeForm
            defaultValues={{
              name: initiative.name,
              type: initiative.type ?? undefined,
              summary: initiative.summary ?? undefined,
              valueProposition: initiative.valueProposition ?? undefined,
              implementationDetails: initiative.implementationDetails ?? undefined,
              releaseDate: initiative.releaseDate,
              organizationId: initiative.organizationId,
              ownerId: initiative.ownerId ?? undefined,
            }}
            onSubmit={handleUpdate}
            onCancel={() => setIsEditing(false)}
            submitLabel="Update Initiative"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-sm font-medium text-gray-500">SUMMARY</h2>
              <p className="mt-1 text-gray-900">{initiative.summary || '—'}</p>
            </div>
            <div>
              <h2 className="text-sm font-medium text-gray-500">VALUE PROPOSITION</h2>
              <p className="mt-1 text-gray-900 whitespace-pre-wrap">
                {initiative.valueProposition || '—'}
              </p>
            </div>
            <div className="md:col-span-2">
              <h2 className="text-sm font-medium text-gray-500">IMPLEMENTATION DETAILS</h2>
              <p className="mt-1 text-gray-900 whitespace-pre-wrap">
                {initiative.implementationDetails || '—'}
              </p>
            </div>
            <div>
              <h2 className="text-sm font-medium text-gray-500">RELEASE DATE</h2>
              <p className="mt-1 text-gray-900">
                {initiative.releaseDate ? new Date(initiative.releaseDate).toLocaleDateString() : '—'}
              </p>
            </div>
            <div>
              <h2 className="text-sm font-medium text-gray-500">OWNER</h2>
              <p className="mt-1 text-gray-900">{initiative.owner?.name || 'Unassigned'}</p>
            </div>
            <div>
              <h2 className="text-sm font-medium text-gray-500">TYPE</h2>
              <p className="mt-1 text-gray-900">
                {initiative.type === 'CAPITALIZABLE' && 'Capitalizable'}
                {initiative.type === 'OPERATIONAL_EFFICIENCY' && 'Operational Efficiency'}
                {initiative.type === 'KTLO' && 'KTLO'}
                {!initiative.type && '—'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Related KPIs */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-medium text-gray-900">Related KPIs</h2>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">KPIs linked to this initiative</p>
          </div>
          <Link
            href="/kpis/new"
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            New KPI
          </Link>
        </div>
        {kpisLoading ? (
          <div className="p-6 text-sm text-gray-500">Loading KPIs…</div>
        ) : kpis.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">No KPIs yet.</div>
        ) : (
          <div className="px-4 pb-6 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quarter</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {kpis.map((k: any) => (
                  <tr key={k.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-sm text-blue-600">
                      <Link href={`/kpis/${k.id}`}>{k.name}</Link>
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-900">{k.team?.name || '—'}</td>
                    <td className="px-3 py-2 text-sm text-gray-900">{k.quarter} {k.year}</td>
                    <td className="px-3 py-2 text-sm text-gray-900">{k.targetMetric ?? '—'}</td>
                    <td className="px-3 py-2 text-sm text-gray-900">{k.actualMetric ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
