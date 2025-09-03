'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/toast';

interface Stakeholder {
  id: string;
  name: string;
  role: string;
  email?: string | null;
  businessUnitId?: string | null;
  reportsToId?: string | null;
}

export default function StakeholderDetailPage() {
  const params = useParams<{ stakeholderId: string }>();
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const mounted = useRef(false);

  const [stakeholder, setStakeholder] = useState<Stakeholder | null>(null);
  const [allStakeholders, setAllStakeholders] = useState<Stakeholder[]>([]);

  const managerOptions = useMemo(
    () => allStakeholders.filter(s => s.id !== stakeholder?.id),
    [allStakeholders, stakeholder?.id]
  );

  useEffect(() => {
    mounted.current = true;
    const load = async () => {
      try {
        setLoading(true);
        const [sRes, allRes] = await Promise.all([
          fetch(`/api/stakeholders/${params.stakeholderId}`, { cache: 'no-store' }),
          fetch('/api/stakeholders', { cache: 'no-store' }),
        ]);
        if (!sRes.ok) throw new Error('Failed to load stakeholder');
        const s = await sRes.json();
        const all = allRes.ok ? await allRes.json() : [];
        if (!mounted.current) return;
        setStakeholder(s);
        setAllStakeholders(all);
      } catch (err) {
        if (mounted.current) {
          setError('Failed to load stakeholder');
          showToast({ title: 'Failed to load stakeholder', description: err instanceof Error ? err.message : 'Unknown error', type: 'destructive' });
        }
      } finally {
        if (mounted.current) setLoading(false);
      }
    };
    void load();
    return () => { mounted.current = false; };
  }, [params.stakeholderId, showToast]);

  async function handleSave() {
    if (!stakeholder) return;
    try {
      setSaving(true);
      setError('');
      const res = await fetch(`/api/stakeholders/${stakeholder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: stakeholder.name,
          role: stakeholder.role,
          email: stakeholder.email ?? undefined,
          reportsToId: stakeholder.reportsToId ?? null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || 'Failed to save');
      }
      const updated = await res.json();
      setStakeholder(updated);
      showToast({ title: 'Stakeholder updated', description: 'Changes were saved.' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save';
      setError(message);
      showToast({ title: 'Failed to save stakeholder', description: message, type: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!stakeholder) return;
    const confirmed = window.confirm('Delete this stakeholder permanently? This cannot be undone.');
    if (!confirmed) return;
    try {
      setSaving(true);
      const res = await fetch(`/api/stakeholders/${stakeholder.id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || 'Failed to delete');
      }
      showToast({ title: 'Stakeholder deleted', description: 'The stakeholder was removed.' });
      router.push('/stakeholders');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete';
      showToast({ title: 'Failed to delete stakeholder', description: message, type: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="min-h-[300px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!stakeholder) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-red-600">Stakeholder not found</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Stakeholder Detail</h1>
        <button onClick={() => router.push('/stakeholders')} className="text-sm text-gray-500 hover:text-gray-700">Back to Stakeholders</button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      <div className="bg-white shadow rounded-lg p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900"
            value={stakeholder.name}
            onChange={(e) => setStakeholder({ ...stakeholder, name: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Role</label>
          <select
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900"
            value={stakeholder.role}
            onChange={(e) => setStakeholder({ ...stakeholder, role: e.target.value })}
          >
            <option value="LEADER">Leader</option>
            <option value="MANAGER">Manager</option>
            <option value="CONTRIBUTOR">Contributor</option>
            <option value="ADVISOR">Advisor</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900"
            value={stakeholder.email ?? ''}
            onChange={(e) => setStakeholder({ ...stakeholder, email: e.target.value })}
            placeholder="name@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Reports to</label>
          <select
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900"
            value={stakeholder.reportsToId ?? ''}
            onChange={(e) => setStakeholder({ ...stakeholder, reportsToId: e.target.value || null })}
          >
            <option value="">— None —</option>
            {managerOptions.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleDelete}
            disabled={saving}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
          >
            Delete
          </button>
          <button
            disabled={saving}
            onClick={handleSave}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
