'use client';

import { useEffect, useState } from 'react';
import { BusinessUnit } from '@prisma/client';

interface StakeholderFormProps {
  businessUnit?: BusinessUnit;
  onSubmit: (data: { teamMemberId: string }) => Promise<void>;
  onCancel: () => void;
}

type TeamMemberOption = {
  id: string;
  name: string;
  email?: string | null;
  role?: string | null;
};

export function StakeholderForm({ businessUnit, onSubmit, onCancel }: StakeholderFormProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMemberOption[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const selected = teamMembers.find(tm => tm.id === selectedId);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch('/api/team-members', { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to load team members');
        const data: TeamMemberOption[] = await res.json();
        if (active) setTeamMembers(data);
      } catch (e) {
        if (active) setTeamMembers([]);
      }
    })();
    return () => { active = false; };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!selectedId) {
      setError('Please select a team member');
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit({ teamMemberId: selectedId });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white shadow rounded-lg p-6">
      <div>
        <label htmlFor="teamMember" className="block text-sm font-medium text-gray-700">
          Team Member
        </label>
        <select
          id="teamMember"
          name="teamMember"
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900"
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
        >
          <option value="">Select a team member</option>
          {teamMembers.map(tm => (
            <option key={tm.id} value={tm.id}>
              {tm.name}{tm.email ? ` (${tm.email})` : ''}
            </option>
          ))}
        </select>
      </div>

      {selected && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <div className="mt-1 text-sm text-gray-900 border rounded-md px-3 py-2 bg-gray-50">
              {selected.role || '—'}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <div className="mt-1 text-sm text-gray-900 border rounded-md px-3 py-2 bg-gray-50 break-all">
              {selected.email || '—'}
            </div>
          </div>
        </div>
      )}

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
          {isSubmitting ? 'Linking...' : businessUnit ? 'Add to Business Unit' : 'Create Stakeholder'}
        </button>
      </div>
    </form>
  );
}