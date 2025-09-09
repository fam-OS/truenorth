'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/toast';

interface Stakeholder {
  id: string;
  name: string;
  role: string;
  email?: string | null; // hidden in UI
  businessUnitId?: string | null;
  reportsToId?: string | null;
  teamMemberId?: string;
  TeamMember?: { id: string; name: string } | null;
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
  const [relationshipNotes, setRelationshipNotes] = useState<string>("");
  const [businessUnitName, setBusinessUnitName] = useState<string>("");
  const [initiatives, setInitiatives] = useState<any[]>([]);

  // Delete confirmation modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
        // Pre-fill relationship notes if present in response in the future; UI only for now
        if (s?.relationshipNotes) setRelationshipNotes(s.relationshipNotes);

        // Resolve business unit name (if any)
        try {
          if (s?.businessUnitId) {
            const buRes = await fetch('/api/business-units', { cache: 'no-store' });
            if (buRes.ok) {
              const buList = await buRes.json();
              const bu = (Array.isArray(buList) ? buList : []).find((u: any) => u.id === s.businessUnitId);
              if (bu?.name) setBusinessUnitName(bu.name);
            }
          }
        } catch {}

        // Load initiatives tied to this stakeholder's Business Unit
        try {
          const buId = s?.businessUnitId;
          if (buId) {
            const initRes = await fetch(`/api/initiatives?businessUnitId=${encodeURIComponent(buId)}`, { cache: 'no-store' });
            if (initRes.ok) {
              const inits = await initRes.json();
              setInitiatives(Array.isArray(inits) ? inits : []);
            }
          } else {
            setInitiatives([]);
          }
        } catch {}
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
          reportsToId: stakeholder.reportsToId ?? null,
          // relationshipNotes is currently UI-only; backend will ignore unknown keys until field is added
          relationshipNotes,
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

  function handleDelete(e?: React.MouseEvent<HTMLButtonElement>) {
    e?.preventDefault();
    e?.stopPropagation();
    if (!stakeholder) return;
    setIsDeleteModalOpen(true);
  }

  async function handleConfirmDelete(e?: React.MouseEvent<HTMLButtonElement>) {
    e?.preventDefault();
    e?.stopPropagation();
    if (!stakeholder) return;
    try {
      setIsDeleting(true);
      console.log('[Stakeholder Detail Delete] Deleting…', { stakeholderId: stakeholder.id });
      const res = await fetch(`/api/stakeholders/${stakeholder.id}`, {
        method: 'DELETE',
        cache: 'no-store',
        signal: AbortSignal.timeout(10000),
      });
      let raw = '';
      try { raw = await res.text(); } catch {}
      console.log('[Stakeholder Detail Delete] Response', { status: res.status, ok: res.ok, raw });
      if (!res.ok && res.status !== 204) {
        throw new Error(raw || `Failed with status ${res.status}`);
      }
      showToast({ title: 'Stakeholder deleted', description: 'The stakeholder was removed.' });
      setIsDeleteModalOpen(false);
      router.push('/stakeholders');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete';
      console.error('[Stakeholder Detail Delete] Error', err);
      showToast({ title: 'Failed to delete stakeholder', description: message, type: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  }

  function handleCancelDelete(e?: React.MouseEvent<HTMLButtonElement>) {
    e?.preventDefault();
    e?.stopPropagation();
    setIsDeleteModalOpen(false);
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

        {/* Email hidden by request */}

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

      {/* Relationship Notes */}
      <div className="bg-white shadow rounded-lg p-6 space-y-3">
        <h2 className="text-lg font-medium text-gray-900">Relationship Notes</h2>
        <p className="text-xs text-gray-500">Use this space to capture context, history, and key points about your relationship with this stakeholder.</p>
        <textarea
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900"
          rows={5}
          value={relationshipNotes}
          onChange={(e) => setRelationshipNotes(e.target.value)}
          placeholder="Add notes..."
        />
        <div className="text-xs text-gray-400">Notes are saved with "Save Changes" above.</div>
      </div>

      {/* Related: Business Unit, Goals, Initiatives */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Business Unit */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-md font-medium text-gray-900">Business Unit</h3>
          {stakeholder.businessUnitId ? (
            <div className="mt-2 text-sm">
              <div className="text-gray-700">{businessUnitName || 'Business Unit'}</div>
              <button
                className="mt-2 text-blue-600 hover:underline text-sm"
                onClick={() => window.location.assign(`/business-units/${stakeholder.businessUnitId}`)}
              >
                View Business Unit
              </button>
            </div>
          ) : (
            <div className="mt-2 text-sm text-gray-500">Not assigned</div>
          )}
        </div>

        {/* Goals helper */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-md font-medium text-gray-900">Goals</h3>
          <div className="mt-2 text-sm text-gray-500">
            View goals managed within the stakeholder's business unit or search the goals view.
          </div>
          <div className="mt-3 flex gap-2">
            {stakeholder.businessUnitId && (
              <button
                className="text-blue-600 hover:underline text-sm"
                onClick={() => window.location.assign(`/business-units/${stakeholder.businessUnitId}`)}
              >
                Open BU Details
              </button>
            )}
          </div>
        </div>

        {/* Initiatives */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-md font-medium text-gray-900">Initiatives</h3>
          {initiatives.length === 0 ? (
            <div className="mt-2 text-sm text-gray-500">No initiatives for this business unit</div>
          ) : (
            <ul className="mt-3 divide-y">
              {initiatives.slice(0, 5).map((init: any) => (
                <li key={init.id} className="py-2 flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="text-sm text-gray-900 truncate">{init.name}</div>
                    {init.summary && (
                      <div className="text-xs text-gray-500 line-clamp-2">{init.summary}</div>
                    )}
                  </div>
                  <button
                    className="text-xs text-blue-600 hover:underline flex-shrink-0"
                    onClick={() => window.location.assign(`/initiatives-kpis#initiative-${init.id}`)}
                  >
                    View
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    {/* Delete Confirmation Modal */}
    {isDeleteModalOpen && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
        role="dialog"
        aria-modal="true"
      >
        <div
          className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
        >
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-medium text-gray-900">Delete this stakeholder?</h3>
          </div>
          <div className="px-6 py-4">
            <p className="text-sm text-gray-600">This action cannot be undone.</p>
          </div>
          <div className="px-6 py-4 border-t flex justify-end gap-3">
            <button
              type="button"
              className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
              onClick={handleCancelDelete}
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    )}
    </div>
  );
}
