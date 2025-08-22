'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import type { OrganizationWithBusinessUnits } from '@/types/prisma';
import { OrganizationForm } from '@/components/OrganizationForm';

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<OrganizationWithBusinessUnits[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [editingOrg, setEditingOrg] = useState<OrganizationWithBusinessUnits | null>(null);
  // Business Unit UI removed from Organizations page
  const isMounted = useRef(false);
  const initialFetchDone = useRef(false);
  const abortController = useRef<AbortController | null>(null);

  // Teams UI state
  type Team = { id: string; name: string; description?: string | null };
  const [orgTeams, setOrgTeams] = useState<Record<string, Team[]>>({});
  const [showCreateTeamForOrg, setShowCreateTeamForOrg] = useState<string | null>(null);
  const [editTeam, setEditTeam] = useState<{ orgId: string; team: Team } | null>(null);

  const fetchOrganizations = useCallback(async () => {
    if (!isMounted.current) return;

    // Cancel any pending requests
    if (abortController.current) {
      abortController.current.abort();
    }
    abortController.current = new AbortController();

    try {
      const response = await fetch('/api/organizations', {
        signal: abortController.current.signal,
        cache: 'no-store' // Prevent caching to ensure fresh data
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch organizations');
      }

      const data = await response.json();
      
      if (isMounted.current) {
        setOrganizations(data);
        if (!initialFetchDone.current) {
          initialFetchDone.current = true;
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return; // Ignore aborted requests
      }
      if (isMounted.current) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, []); // No dependencies needed as we're using refs

  // Business Unit handlers removed

  // Teams helpers
  const fetchTeams = useCallback(async (orgId: string) => {
    try {
      const res = await fetch(`/api/organizations/${orgId}/teams`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch teams');
      const data: Team[] = await res.json();
      setOrgTeams((prev) => ({ ...prev, [orgId]: data }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch teams');
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    isMounted.current = true;
    void fetchOrganizations();

    return () => {
      isMounted.current = false;
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, []); // Empty dependency array ensures this only runs once on mount

  // Fetch teams whenever organizations list loads/changes
  useEffect(() => {
    organizations.forEach((org) => {
      if (!orgTeams[org.id]) {
        void fetchTeams(org.id);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizations]);

  const handleSaveOrganization = async (data: { name: string; description?: string }) => {
    try {
      setError(null);
      const isEditing = !!editingOrg;
      const url = isEditing ? `/api/organizations/${editingOrg.id}` : '/api/organizations';
      
      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${isEditing ? 'update' : 'create'} organization`);
      }

      await fetchOrganizations();
      setShowCreateOrg(false);
      setEditingOrg(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${editingOrg ? 'update' : 'create'} organization`);
    }
  };

  // Business Unit creation removed

  // Team CRUD actions
  const handleCreateTeam = async (orgId: string, data: { name: string; description?: string }) => {
    try {
      setError(null);
      const res = await fetch(`/api/organizations/${orgId}/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create team');
      await fetchTeams(orgId);
      setShowCreateTeamForOrg(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create team');
    }
  };

  // Inline Team form for create/edit
  function TeamForm({
    team,
    onSubmit,
    onCancel,
  }: {
    team?: Team;
    onSubmit: (data: { name: string; description?: string }) => Promise<void> | void;
    onCancel: () => void;
  }) {
    const [name, setName] = useState<string>(team?.name ?? '');
    const [description, setDescription] = useState<string>(team?.description ?? '');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitting(true);
      try {
        await onSubmit({ name, description: description || undefined });
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
          />
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    );
  }

  const handleUpdateTeam = async (orgId: string, teamId: string, data: { name: string; description?: string }) => {
    try {
      setError(null);
      const res = await fetch(`/api/teams/${teamId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update team');
      await fetchTeams(orgId);
      setEditTeam(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update team');
    }
  };

  const handleDeleteTeam = async (orgId: string, teamId: string) => {
    try {
      setError(null);
      const res = await fetch(`/api/teams/${teamId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete team');
      await fetchTeams(orgId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete team');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="min-h-[400px]">
        {/* Modal for creating an organization */}
        {showCreateOrg && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4 relative">
              <button
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 focus:outline-none"
                onClick={() => setShowCreateOrg(false)}
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">
                  {editingOrg ? 'Edit Organization' : 'Create Organization'}
                </h2>
                <OrganizationForm
                  organization={editingOrg || undefined}
                  onSubmit={handleSaveOrganization}
                  onCancel={() => {
                    setShowCreateOrg(false);
                    setEditingOrg(null);
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Create Team Modal */}
        {showCreateTeamForOrg && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4 relative">
              <button
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 focus:outline-none"
                onClick={() => setShowCreateTeamForOrg(null)}
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">Add Team</h2>
                <TeamForm
                  onSubmit={async (data) => {
                    await handleCreateTeam(showCreateTeamForOrg, data);
                  }}
                  onCancel={() => setShowCreateTeamForOrg(null)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Edit Team Modal */}
        {editTeam && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4 relative">
              <button
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 focus:outline-none"
                onClick={() => setEditTeam(null)}
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">Edit Team</h2>
                <TeamForm
                  team={editTeam.team}
                  onSubmit={async (data) => {
                    await handleUpdateTeam(editTeam.orgId, editTeam.team.id, data);
                  }}
                  onCancel={() => setEditTeam(null)}
                />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-6">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {!initialFetchDone.current || isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : organizations.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Organizations</h3>
            <p className="text-gray-500">Get started by creating your first organization.</p>
            <button
              onClick={() => setShowCreateOrg(true)}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Create Organization
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-semibold text-gray-900">My Organizations</h1>
              <button
                onClick={() => setShowCreateOrg(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                New Organization
              </button>
            </div>

            <div className="grid gap-6">
              {organizations.map((org) => (
                <div
                  key={org.id}
                  className="bg-white shadow rounded-lg overflow-hidden"
                >
                  <div className="px-6 py-5">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-semibold text-gray-900">{org.name}</h2>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingOrg(org);
                            setShowCreateOrg(true);
                          }}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={async () => {
                            if (window.confirm(`Delete organization '${org.name}'? This will remove all business units and associated data.`)) {
                              setError(null);
                              const response = await fetch(`/api/organizations/${org.id}`, { method: 'DELETE' });
                              if (!response.ok) {
                                setError('Failed to delete organization');
                              } else {
                                await fetchOrganizations();
                              }
                            }
                          }}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-red-600 bg-red-100 hover:bg-red-200"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    {org.description && (
                      <p className="mt-1 text-sm text-gray-500">{org.description}</p>
                    )}
                  </div>

                  {/* Teams section */}
                  <div className="border-t border-gray-200">
                    <div className="px-6 py-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-900">Teams</h3>
                        <button
                          onClick={() => setShowCreateTeamForOrg(org.id)}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200"
                        >
                          Add Team
                        </button>
                      </div>
                      <div className="space-y-2">
                        {(orgTeams[org.id] || []).length === 0 ? (
                          <p className="text-sm text-gray-500">No teams yet.</p>
                        ) : (
                          (orgTeams[org.id] || []).map((team) => (
                            <div key={team.id} className="flex items-center justify-between rounded border p-2">
                              <div>
                                <Link href={`/teams/${team.id}`} className="text-sm font-medium text-blue-700 hover:underline">
                                  {team.name}
                                </Link>
                                {team.description && (
                                  <div className="text-xs text-gray-500">{team.description}</div>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setEditTeam({ orgId: org.id, team })}
                                  className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => {
                                    if (window.confirm(`Delete team '${team.name}'?`)) {
                                      void handleDeleteTeam(org.id, team.id);
                                    }
                                  }}
                                  className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded-md text-red-600 bg-red-100 hover:bg-red-200"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}