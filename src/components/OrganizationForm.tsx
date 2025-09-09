'use client';

import { useState, useEffect } from 'react';
import { CreateOrganizationInput } from '@/lib/validations/organization';

interface OrganizationFormProps {
  organization?: {
    id: string;
    name: string;
    description?: string | null;
    parentId?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
    companyAccountId?: string;
  };
  onSubmit: (data: CreateOrganizationInput) => Promise<void>;
  onCancel: () => void;
}

export function OrganizationForm({
  organization,
  onSubmit,
  onCancel,
}: OrganizationFormProps) {
  const [formData, setFormData] = useState<CreateOrganizationInput>({
    name: organization?.name ?? '',
    description: organization?.description ?? '',
    parentId: (organization as any)?.parentId ?? null,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [orgOptions, setOrgOptions] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    let aborted = false;
    const load = async () => {
      try {
        const res = await fetch('/api/organizations', { cache: 'no-store' });
        if (!res.ok) return;
        const orgs = await res.json();
        if (!aborted) setOrgOptions(orgs.map((o: any) => ({ id: o.id, name: o.name })));
      } catch {}
    };
    void load();
    return () => { aborted = true; };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Normalize empty parentId to null
      const payload: CreateOrganizationInput = {
        ...formData,
        parentId: formData.parentId || null,
      };
      await onSubmit(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white shadow rounded-lg p-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Organization Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900"
          placeholder="Marketing, Business Ops, Servicing, Technology..."
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900"
          placeholder="Enter organization description"
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      {/* Parent Organization */}
      <div>
        <label htmlFor="parentId" className="block text-sm font-medium text-gray-700">
          Parent Organization
        </label>
        <select
          id="parentId"
          name="parentId"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900"
          value={formData.parentId || ''}
          onChange={(e) => setFormData({ ...formData, parentId: e.target.value ? e.target.value : null })}
        >
          <option value="">None</option>
          {orgOptions
            .filter((o) => o.id !== organization?.id)
            .map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
        </select>
        <p className="mt-1 text-xs text-gray-500">Optional: relate this org under a parent.</p>
      </div>


      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : organization ? 'Update Organization' : 'Create Organization'}
        </button>
      </div>
    </form>
  );
}