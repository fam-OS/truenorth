'use client';

import { useEffect, useMemo, useState } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';

export type InitiativeFormValues = {
  name: string;
  summary?: string;
  valueProposition?: string;
  implementationDetails?: string;
  releaseDate?: string; // yyyy-mm-dd
  organizationId: string; // from context
  ownerId?: string;
};

export type InitiativeOwnerOption = {
  id: string;
  name: string;
  email: string;
  teamId: string;
  teamName?: string;
};

export function InitiativeForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel = 'Create Initiative',
}: {
  defaultValues?: Partial<InitiativeFormValues>;
  onSubmit: (values: InitiativeFormValues) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
}) {
  const { currentOrg } = useOrganization();
  const [owners, setOwners] = useState<InitiativeOwnerOption[]>([]);
  const [loadingOwners, setLoadingOwners] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<InitiativeFormValues>(() => ({
    name: defaultValues?.name ?? '',
    summary: defaultValues?.summary ?? '',
    valueProposition: defaultValues?.valueProposition ?? '',
    implementationDetails: defaultValues?.implementationDetails ?? '',
    releaseDate: defaultValues?.releaseDate
      ? new Date(defaultValues.releaseDate).toISOString().split('T')[0]
      : '',
    organizationId: defaultValues?.organizationId ?? currentOrg?.id ?? '',
    ownerId: defaultValues?.ownerId ?? undefined,
  }));

  useEffect(() => {
    setForm((prev) => ({ ...prev, organizationId: currentOrg?.id ?? '' }));
  }, [currentOrg?.id]);

  useEffect(() => {
    async function loadOwners() {
      try {
        setLoadingOwners(true);
        const res = await fetch('/api/team-members');
        if (!res.ok) throw new Error('Failed to load team members');
        const data = await res.json();
        const mapped: InitiativeOwnerOption[] = data.map((m: any) => ({
          id: m.id,
          name: m.user?.name ?? m.name ?? 'Unknown',
          email: m.user?.email ?? m.email ?? '',
          teamId: m.teamId,
          teamName: m.team?.name,
        }));
        setOwners(mapped);
      } catch (e) {
        console.error(e);
        setError('Failed to load owners');
      } finally {
        setLoadingOwners(false);
      }
    }
    loadOwners();
  }, []);

  const inputClasses =
    'mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 placeholder-gray-500';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.organizationId) {
      setError('Please select an organization.');
      return;
    }
    await onSubmit({ ...form, releaseDate: form.releaseDate || undefined });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700" htmlFor="name">Name</label>
        <input
          id="name"
          className={inputClasses}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
          placeholder="e.g., Launch new partner portal"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700" htmlFor="summary">One-line Summary</label>
        <input
          id="summary"
          className={inputClasses}
          value={form.summary || ''}
          onChange={(e) => setForm({ ...form, summary: e.target.value })}
          placeholder="What is this about?"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700" htmlFor="valueProposition">Value Proposition</label>
        <textarea
          id="valueProposition"
          rows={3}
          className={inputClasses}
          value={form.valueProposition || ''}
          onChange={(e) => setForm({ ...form, valueProposition: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700" htmlFor="implementationDetails">Implementation Details</label>
        <textarea
          id="implementationDetails"
          rows={4}
          className={inputClasses}
          value={form.implementationDetails || ''}
          onChange={(e) => setForm({ ...form, implementationDetails: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700" htmlFor="releaseDate">Release Date</label>
          <input
            id="releaseDate"
            type="date"
            className={inputClasses}
            value={form.releaseDate || ''}
            onChange={(e) => setForm({ ...form, releaseDate: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700" htmlFor="ownerId">Owner</label>
          <select
            id="ownerId"
            className={inputClasses}
            value={form.ownerId || ''}
            onChange={(e) => setForm({ ...form, ownerId: e.target.value || undefined })}
          >
            <option value="">Unassigned</option>
            {owners.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}{o.teamName ? ` — ${o.teamName}` : ''}
              </option>
            ))}
          </select>
          {loadingOwners && <p className="text-sm text-gray-500 mt-1">Loading owners…</p>}
        </div>
      </div>

      <div className="flex justify-end gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
