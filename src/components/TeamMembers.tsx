'use client';

import { useEffect, useState } from 'react';

type Member = { id: string; name: string; email: string; role: string };

export function TeamMembers({ teamId }: { teamId: string }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Add form state
  const [addOpen, setAddOpen] = useState(false);
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addRole, setAddRole] = useState('');
  const [adding, setAdding] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      setAdding(true);
      const payload = {
        name: addName,
        email: addEmail.trim() === '' ? undefined : addEmail,
        role: addRole.trim() === '' ? undefined : addRole,
      };
      const res = await fetch(`/api/teams/${teamId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to add member');
      setAddName('');
      setAddEmail('');
      setAddRole('');
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
    setEditName(m.name);
    setEditEmail(m.email);
    setEditRole(m.role);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditEmail('');
    setEditRole('');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    try {
      setError(null);
      setSavingEdit(true);
      const payload = {
        name: editName,
        email: editEmail.trim() === '' ? null : editEmail,
        role: editRole.trim() === '' ? null : editRole,
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

  const handleDelete = async (memberId: string) => {
    try {
      setError(null);
      const res = await fetch(`/api/team-members/${memberId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete member');
      await fetchMembers();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete member');
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
        <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white p-4 rounded-lg shadow">
          <input
            type="text"
            required
            placeholder="Name"
            value={addName}
            onChange={(e) => setAddName(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
          />
          <input
            type="email"
            placeholder="Email"
            value={addEmail}
            onChange={(e) => setAddEmail(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
          />
          <input
            type="text"
            placeholder="Role"
            value={addRole}
            onChange={(e) => setAddRole(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
          />
          <div className="flex gap-2 justify-end md:col-span-1">
            <button
              type="button"
              onClick={() => setAddOpen(false)}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={adding}
              className="inline-flex items-center px-4 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {adding ? 'Adding...' : 'Add'}
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
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                  />
                  <input
                    type="text"
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                  />
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
                    <div className="text-sm font-medium text-gray-900">{m.name}</div>
                    <div className="text-xs text-gray-500">{m.email}</div>
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
                      onClick={() => {
                        if (confirm(`Delete member ${m.name}?`)) void handleDelete(m.id);
                      }}
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
    </div>
  );
}
