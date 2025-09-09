'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/ui/toast';

type Member = { id: string; name: string; role: string; teamId?: string | null };

export function TeamMembers({ teamId }: { teamId: string }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  // Role ranking for reporting hierarchy (lower = individual contributor)
  const roleRank = (role?: string | null) => {
    const r = (role || '').trim().toLowerCase();
    if (r === 'team member' || r === '') return 1;
    if (r === 'manager') return 2;
    if (r === 'director') return 3;
    if (r === 'executive') return 4;
    // C-suite
    if (['cfo','cio','cto','coo','ceo'].includes(r)) return 5;
    // Unknown titles default to manager level (so they can be selected for ICs)
    return 2;
  };

  // Add form state
  const [addOpen, setAddOpen] = useState(false);
  const [addName, setAddName] = useState('');
  // Email field removed from UI per request
  const [addRole, setAddRole] = useState('');
  const [adding, setAdding] = useState(false);
  // Attach existing
  const [attachExisting, setAttachExisting] = useState(false);
  const [allActiveMembers, setAllActiveMembers] = useState<Member[]>([]);
  const [selectedExistingId, setSelectedExistingId] = useState('');

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  // Email field removed from UI per request
  const [editRole, setEditRole] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [editReportsToId, setEditReportsToId] = useState<string>('');

  // Delete confirmation state
  const [confirmDeleteMember, setConfirmDeleteMember] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchMembers = async () => {
    try {
      setError(null);
      setLoading(true);
      const res = await fetch(`/api/teams/${teamId}/members`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load members');
      const data: Member[] = await res.json();
      setMembers(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchMembers();
    // Also load all active members for the attach-existing flow
    const fetchAll = async () => {
      try {
        const res = await fetch('/api/team-members', { cache: 'no-store' });
        if (!res.ok) return;
        const data: Member[] = await res.json();
        setAllActiveMembers(data);
      } catch {}
    };
    void fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      setAdding(true);
      const isAttach = attachExisting && selectedExistingId !== '';
      const payload = isAttach
        ? { existingMemberId: selectedExistingId }
        : {
            name: addName,
            role: addRole.trim() === '' ? undefined : addRole,
          };
      const res = await fetch(`/api/teams/${teamId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to add member');
      setAddName('');
      // no email field to reset
      setAddRole('');
      setSelectedExistingId('');
      setAttachExisting(false);
      setAddOpen(false);
      await fetchMembers();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add member');
    } finally {
      setAdding(false);
    }
  };

  const openEdit = (m: Member) => {
    setEditingId(m.id);
    setEditName(m.name || '');
    // no email editing
    setEditRole((m as any).role ?? '');
    setEditReportsToId('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    // no email editing
    setEditRole('');
    setEditReportsToId('');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    try {
      setError(null);
      setSavingEdit(true);
      const payload = {
        name: editName,
        role: editRole.trim() === '' ? null : editRole,
        reportsToId: editReportsToId.trim() === '' ? null : editReportsToId,
      };
      const res = await fetch(`/api/team-members/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to update member');
      cancelEdit();
      await fetchMembers();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update member');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleRemoveFromTeam = async (memberId: string) => {
    try {
      setError(null);
      const res = await fetch(`/api/team-members/${memberId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId: null }),
      });
      if (!res.ok) throw new Error('Failed to remove from team');
      showToast({ title: 'Removed from team', description: 'The member remains active but is no longer assigned to this team.' });
      await fetchMembers();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to remove from team';
      setError(msg);
      showToast({ title: 'Failed to remove from team', description: msg, type: 'destructive' });
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteMember) return;
    try {
      setError(null);
      setDeleting(true);
      const res = await fetch(`/api/team-members/${confirmDeleteMember.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete member');
      showToast({ title: 'Member deleted', description: `${confirmDeleteMember.name} was removed.` });
      await fetchMembers();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to delete member';
      setError(msg);
      showToast({ title: 'Failed to delete member', description: msg, type: 'destructive' });
    } finally {
      setDeleting(false);
      setConfirmDeleteMember(null);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">Members</h2>
        <button
          onClick={() => setAddOpen((v) => !v)}
          className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200"
        >
          {addOpen ? 'Close' : 'Add Member'}
        </button>
      </div>

      {addOpen && (
        <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-6 gap-3 bg-white p-4 rounded-lg shadow">
          <div className="md:col-span-6 flex items-center gap-3">
            <input
              id="attach-existing"
              type="checkbox"
              checked={attachExisting}
              onChange={(e) => setAttachExisting(e.target.checked)}
            />
            <label htmlFor="attach-existing" className="text-sm text-gray-700">Attach existing member</label>
          </div>

          {attachExisting ? (
            <select
              required
              value={selectedExistingId}
              onChange={(e) => setSelectedExistingId(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm md:col-span-3"
            >
              <option value="">Select an existing member</option>
              {allActiveMembers
                .filter((m) => !members.some((tm) => tm.id === m.id))
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
            </select>
          ) : (
            <>
              <input
                type="text"
                required
                placeholder="Name"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              />
              <select
                value={addRole}
                onChange={(e) => setAddRole(e.target.value)}
                className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              >
                <option value="">Select Role</option>
                <option value="CEO">CEO</option>
                <option value="COO">COO</option>
                <option value="CTO">CTO</option>
                <option value="CIO">CIO</option>
                <option value="CFO">CFO</option>
                <option value="Executive">Executive</option>
                <option value="Director">Director</option>
                <option value="Manager">Manager</option>
                <option value="Team Member">Team Member</option>
              </select>
            </>
          )}

          <div className="flex gap-2 justify-end md:col-span-2">
            <button
              type="button"
              onClick={() => {
                setAddOpen(false);
                setAttachExisting(false);
                setSelectedExistingId('');
              }}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={adding}
              className="inline-flex items-center px-4 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {adding ? 'Saving...' : attachExisting ? 'Attach' : 'Add'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="bg-white rounded-lg shadow p-4 text-sm text-gray-500">Loading members...</div>
      ) : members.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center text-sm text-gray-500">No members yet.</div>
      ) : (
        <ul className="divide-y divide-gray-200 bg-white rounded-lg shadow overflow-hidden">
          {members.map((m) => (
            <li key={m.id} className="p-3">
              {editingId === m.id ? (
                <form onSubmit={handleSaveEdit} className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                  />
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                  >
                    <option value="">Select Role</option>
                    <option value="CEO">CEO</option>
                    <option value="COO">COO</option>
                    <option value="CTO">CTO</option>
                    <option value="CIO">CIO</option>
                    <option value="CFO">CFO</option>
                    <option value="Executive">Executive</option>
                    <option value="Director">Director</option>
                    <option value="Manager">Manager</option>
                    <option value="Team Member">Team Member</option>
                  </select>
                  <select
                    value={editReportsToId}
                    onChange={(e) => setEditReportsToId(e.target.value)}
                    className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                  >
                    <option value="">Reports To (optional)</option>
                    {allActiveMembers
                      .filter((am) => am.id !== editingId)
                      .filter((am) => {
                        const r = (am.role || '').trim().toLowerCase();
                        return r !== '' && r !== 'team member';
                      })
                      .map((am) => (
                        <option key={am.id} value={am.id}>{am.name}{am.role ? ` — ${am.role}` : ''}</option>
                      ))}
                  </select>
                  <div className="flex gap-2 justify-end md:col-span-1">
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingEdit}
                      className="inline-flex items-center px-4 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                    >
                      {savingEdit ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      <Link href={`/team-members/${m.id}`} className="text-blue-600 hover:underline">
                        {m.name}
                      </Link>
                    </div>
                    {/* email hidden */}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-600">{m.role}</span>
                    <button
                      onClick={() => openEdit(m)}
                      className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleRemoveFromTeam(m.id)}
                      className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200"
                      title="Remove from team"
                    >
                      Remove from team
                    </button>
                    <button
                      onClick={() => setConfirmDeleteMember({ id: m.id, name: m.name })}
                      className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded-md text-red-600 bg-red-100 hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {/* Confirm Delete Member Modal */}
      {confirmDeleteMember && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setConfirmDeleteMember(null)} />
          <div className="relative bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-gray-900">Delete Member</h3>
            <p className="mt-2 text-sm text-gray-600">Are you sure you want to delete {`"${confirmDeleteMember.name}"`}? This action cannot be undone.</p>
            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                onClick={() => setConfirmDeleteMember(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 text-sm rounded-md border border-red-300 text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                disabled={deleting}
                onClick={() => { void handleConfirmDelete(); }}
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
