'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/components/ui/toast';
import { Goal } from '@prisma/client';
import { GoalFormModal } from '@/components/GoalFormModal';
import { GoalList } from '@/components/GoalList';
import { Button } from '@/components/ui/button';

export default function GoalsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  type ViewMode = 'list' | 'create';
  const [view, setView] = useState<ViewMode>('list');
  const [goals, setGoals] = useState<Goal[]>([] as any);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const mounted = useRef(false);

  const fetchGoals = useCallback(async () => {
    if (!mounted.current) return;
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('q', search);
      // Use the recent goals API; it returns latest by updatedAt
      const res = await fetch(`/api/goals?${params.toString()}`, { cache: 'no-store', signal: AbortSignal.timeout(5000) });
      if (!res.ok) throw new Error('Failed to fetch goals');
      const data = await res.json();
      if (!mounted.current) return;
      setGoals(Array.isArray(data) ? data : []);
    } catch (err) {
      if (mounted.current) {
        setError('Failed to load goals');
        showToast({ title: 'Failed to load goals', description: err instanceof Error ? err.message : 'Unknown error', type: 'destructive' });
      }
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [search, showToast]);

  useEffect(() => {
    mounted.current = true;
    void fetchGoals();
    return () => { mounted.current = false; };
  }, [fetchGoals]);

  async function handleCreateGoal(data: any) {
    try {
      // Business unit is required server-side; the modal collects it
      const buId = data.businessUnitId;
      const response = await fetch(`/api/business-units/${buId}/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Failed to create goal');
      }
      await fetchGoals();
      setView('list');
      showToast({ title: 'Goal created', description: `Goal was added successfully.` });
    } catch (err) {
      showToast({ title: 'Failed to create goal', description: err instanceof Error ? err.message : 'Unknown error', type: 'destructive' });
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Goals</h1>
          <p className="mt-1 text-sm text-gray-500">Track goals across business units by quarter and year.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search goals..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-64 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
          <Button onClick={() => setView('create')} variant="gradient" size="sm">New Goal</Button>
        </div>
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
            <h2 className="text-xl font-semibold text-gray-900">Add Goal</h2>
            <Button onClick={() => setView('list')} variant="outline" size="sm">Cancel</Button>
          </div>
          <div className="card p-4">
            <GoalFormModal isOpen={true} onClose={() => setView('list')} goal={null} onSubmit={handleCreateGoal} isSubmitting={false} />
          </div>
        </div>
      ) : (
        <div className="card">
          <GoalList
            goals={goals as any}
            onCreateGoal={() => setView('create')}
            onEditGoal={(g) => router.push(`/goals/${g.id}/edit`) }
            onSelectGoal={(g) => router.push(`/goals/${g.id}`)}
          />
        </div>
      )}

      {/* Helpful links */}
      <div className="mt-8 text-sm text-gray-500">
        Looking for initiatives and KPIs? <Link href="/initiatives-kpis" className="text-blue-600 hover:underline">Go to Initiatives & KPIs</Link>
      </div>
    </div>
  );
}
