'use client';

import { useRouter } from 'next/navigation';
import { InitiativeForm, InitiativeFormValues } from '@/components/InitiativeForm';
import { useOrganization } from '@/contexts/OrganizationContext';

export default function NewInitiativePage() {
  const router = useRouter();
  const { currentOrg } = useOrganization();

  async function handleCreate(values: InitiativeFormValues) {
    const url = currentOrg?.id ? `/api/initiatives?orgId=${currentOrg.id}` : '/api/initiatives';
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create initiative');
    }
    const created = await res.json();
    router.push(`/initiatives/${created.id}`);
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">New Initiative</h1>
        <p className="mt-1 text-sm text-gray-500">
          Create a new strategic initiative{currentOrg ? ` for ${currentOrg.name}` : ''}.
        </p>
      </div>
      <div className="bg-white shadow rounded-lg p-6">
        <InitiativeForm
          defaultValues={{ organizationId: currentOrg?.id || '' }}
          onSubmit={handleCreate}
          submitLabel="Create Initiative"
        />
      </div>
    </div>
  );
}
