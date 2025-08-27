'use client';

import { useRouter } from 'next/navigation';
import { KpiForm, KpiFormValues } from '@/components/KpiForm';
import { useOrganization } from '@/contexts/OrganizationContext';

export default function NewKpiPage() {
  const router = useRouter();
  const { currentOrg } = useOrganization();

  async function handleCreate(values: KpiFormValues) {
    const res = await fetch('/api/kpis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create KPI');
    }
    const created = await res.json();
    router.push(`/kpis/${created.id}`);
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">New KPI</h1>
        <p className="mt-1 text-sm text-gray-500">
          Create a KPI{currentOrg ? ` for ${currentOrg.name}` : ''}.
        </p>
      </div>
      <div className="bg-white shadow rounded-lg p-6">
        <KpiForm
          defaultValues={{ organizationId: currentOrg?.id || '' }}
          onSubmit={handleCreate}
          submitLabel="Create KPI"
        />
      </div>
    </div>
  );
}
