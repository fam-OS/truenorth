'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/toast';
import { StakeholderList } from '@/components/StakeholderList';
import { StakeholderForm } from '@/components/StakeholderForm';
import type { Stakeholder } from '@prisma/client';

export default function StakeholdersPage() {
  const router = useRouter();
  const { showToast } = useToast();
  type ViewMode = 'list' | 'create';
  const [view, setView] = useState<ViewMode>('list');
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const mounted = useRef(false);

  const fetchStakeholders = useCallback(async () => {
    if (!mounted.current) return;
    try {
      setLoading(true);
      const res = await fetch('/api/stakeholders', { cache: 'no-store', signal: AbortSignal.timeout(5000) });
      if (!res.ok) throw new Error('Failed to fetch stakeholders');
      const data: Stakeholder[] = await res.json();
      if (!mounted.current) return;
      setStakeholders(data);
    } catch (err) {
      if (mounted.current) {
        setError('Failed to load stakeholders');
        showToast({ title: 'Failed to load stakeholders', description: err instanceof Error ? err.message : 'Unknown error', type: 'destructive' });
      }
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    mounted.current = true;
    void fetchStakeholders();
    return () => { mounted.current = false; };
  }, [fetchStakeholders]);

  async function handleCreateGlobalStakeholder(data: { teamMemberId: string }) {
    try {
      const response = await fetch('/api/stakeholders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create stakeholder');
      await fetchStakeholders();
      setView('list');
      showToast({ title: 'Stakeholder created', description: `Stakeholder was added successfully.` });
    } catch (err) {
      showToast({ title: 'Failed to create stakeholder', description: err instanceof Error ? err.message : 'Unknown error', type: 'destructive' });
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Stakeholders</h1>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 mb-6">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {loading ? (
        <div className="min-h-[300px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : view === 'create' ? (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Add Stakeholder</h2>
            <button onClick={() => setView('list')} className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>
          </div>
          <StakeholderForm onSubmit={handleCreateGlobalStakeholder} onCancel={() => setView('list')} />
        </div>
      ) : (
        <StakeholderList
          stakeholders={stakeholders}
          onSelectStakeholder={(s) => router.push(`/stakeholders/${s.id}`)}
          onCreateStakeholder={() => setView('create')}
        />
      )}
    </div>
  );
}
