'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useToast } from '@/components/ui/toast';
import Link from 'next/link';
import type { OrganizationWithBusinessUnits } from '@/types/prisma';
import { OrganizationForm } from '@/components/OrganizationForm';
import AccountProfile from '@/components/AccountProfile';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

type Team = { id: string; name: string; description?: string | null };

interface CompanyAccount {
  id: string
  name: string
  description?: string
  founderId?: string
  employees?: string
  headquarters?: string
  launchedDate?: string
  isPrivate: boolean
  tradedAs?: string
  corporateIntranet?: string
  glassdoorLink?: string
  linkedinLink?: string
  founder?: any
  organizations: any[]
}

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<OrganizationWithBusinessUnits[]>([]);
  const [companyAccount, setCompanyAccount] = useState<CompanyAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [editingOrg, setEditingOrg] = useState<OrganizationWithBusinessUnits | null>(null);
  
  const isMounted = useRef(false);
  const initialFetchDone = useRef(false);
  const abortController = useRef<AbortController | null>(null);
  const { showToast } = useToast();

  // Teams UI state
  const [orgTeams, setOrgTeams] = useState<Record<string, Team[]>>({});
  const [showCreateTeamForOrg, setShowCreateTeamForOrg] = useState<string | null>(null);
  const [editTeam, setEditTeam] = useState<{ orgId: string; team: Team } | null>(null);
  
  // CEO Goals state
  const [ceoGoals, setCeoGoals] = useState<{id?: string; description: string}[]>([
    { description: '' },
    { description: '' },
    { description: '' },
    { description: '' },
    { description: '' }
  ]);

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
  }, []);

  const fetchCompanyAccount = useCallback(async () => {
    try {
      const response = await fetch('/api/company-account', {
        cache: 'no-store'
      });
      
      if (response.ok) {
        const data = await response.json();
        setCompanyAccount(data);
      }
    } catch (err) {
      console.error('Error fetching company account:', err);
    }
  }, []);

  // Handle saving organization
  const handleSaveOrganization = async (data: { name: string; description?: string }) => {
    try {
      if (!companyAccount) {
        setError('No company account found. Please create one first.');
        return;
      }

      let response: Response;
      
      if (editingOrg) {
        // Update existing organization
        response = await fetch(`/api/organizations/${editingOrg.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });
      } else {
        // Create new organization
        response = await fetch('/api/organizations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...data,
            companyAccountId: companyAccount.id,
          }),
        });
      }

      if (!response.ok) {
        throw new Error('Failed to save organization');
      }

      setShowCreateOrg(false);
      setEditingOrg(null);
      await fetchOrganizations();
      showToast({ 
        title: editingOrg ? 'Business unit updated' : 'Business unit created', 
        description: `${data.name} was ${editingOrg ? 'updated' : 'created'} successfully.` 
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      showToast({ 
        title: 'Failed to save business unit', 
        description: err instanceof Error ? err.message : 'Unknown error', 
        type: 'destructive' 
      });
    }
  };

  // Handle saving CEO goals
  const handleSaveCEOGoals = async (goals: {id?: string; description: string}[]) => {
    try {
      // TODO: Implement API call to save CEO goals
      // await fetch('/api/organizations/ceo-goals', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ goals })
      // });
      setCeoGoals(goals);
    } catch (error) {
      console.error('Failed to save CEO goals:', error);
      throw error;
    }
  };

  // Team CRUD operations
  const handleCreateTeam = async (orgId: string, data: { name: string; description?: string }) => {
    try {
      const response = await fetch(`/api/organizations/${orgId}/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) throw new Error('Failed to create team');
      
      await fetchTeams(orgId);
      setShowCreateTeamForOrg(null);
      showToast({ title: 'Team created', description: `${data.name} was added successfully.` });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create team');
      showToast({ title: 'Failed to create team', description: err instanceof Error ? err.message : 'Unknown error', type: 'destructive' });
    }
  };

  const handleUpdateTeam = async (orgId: string, teamId: string, data: { name: string; description?: string }) => {
    try {
      const response = await fetch(`/api/teams/${teamId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) throw new Error('Failed to update team');
      
      await fetchTeams(orgId);
      setEditTeam(null);
      showToast({ title: 'Team updated', description: 'Changes were saved.' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update team');
      showToast({ title: 'Failed to update team', description: err instanceof Error ? err.message : 'Unknown error', type: 'destructive' });
    }
  };

  const handleDeleteTeam = async (orgId: string, teamId: string) => {
    if (!window.confirm('Are you sure you want to delete this team?')) return;
    
    try {
      const response = await fetch(`/api/teams/${teamId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete team');
      
      await fetchTeams(orgId);
      showToast({ title: 'Team deleted', description: 'Team was removed.' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete team');
      showToast({ title: 'Failed to delete team', description: err instanceof Error ? err.message : 'Unknown error', type: 'destructive' });
    }
  };

  const fetchTeams = useCallback(async (orgId: string) => {
    try {
      const res = await fetch(`/api/organizations/${orgId}/teams`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch teams');
      const data: Team[] = await res.json();
      setOrgTeams(prev => ({ ...prev, [orgId]: data }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch teams');
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    isMounted.current = true;
    fetchOrganizations();
    fetchCompanyAccount();

    return () => {
      isMounted.current = false;
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, []);

  // Fetch teams when organizations change
  useEffect(() => {
    if (organizations.length > 0) {
      organizations.forEach(org => {
        if (!orgTeams[org.id]) {
          fetchTeams(org.id);
        }
      });
    }
  }, [organizations, orgTeams, fetchTeams]);

  // Team form component
  const TeamForm = ({
    team,
    onSubmit,
    onCancel,
  }: {
    team?: Team;
    onSubmit: (data: { name: string; description?: string }) => Promise<void> | void;
    onCancel: () => void;
  }) => {
    const [name, setName] = useState(team?.name || '');
    const [description, setDescription] = useState(team?.description || '');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!name.trim()) return;
      
      try {
        setIsSubmitting(true);
        await onSubmit({ name, description: description || undefined });
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <form onSubmit={handleSubmit} className="mt-2 p-4 bg-gray-50 rounded-lg">
        <div className="space-y-3">
          <div>
            <label htmlFor="team-name" className="block text-sm font-medium text-gray-700">
              Team Name
            </label>
            <input
              type="text"
              id="team-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Enter team name"
            />
          </div>
          <div>
            <label htmlFor="team-description" className="block text-sm font-medium text-gray-700">
              Description (Optional)
            </label>
            <textarea
              id="team-description"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Enter team description"
            />
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Team'}
            </button>
          </div>
        </div>
      </form>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Company Account Overview */}
      <AccountProfile 
        companyAccount={companyAccount} 
        onUpdate={fetchCompanyAccount}
      />

      {/* Business Units Section */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-900">Company Organizations</h1>
          <button
            onClick={() => {
              setEditingOrg(null);
              setShowCreateOrg(true);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            New Organization
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : organizations.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Organizations</h3>
            <p className="text-gray-500">Get started by creating your first organization.</p>
            <button
              onClick={() => setShowCreateOrg(true)}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              New Organization
            </button>
          </div>
        ) : (
          <div className="border-t border-gray-200">
            <ul className="divide-y divide-gray-200">
              {organizations.map((org) => (
                <li key={org.id} className="group hover:bg-gray-50">
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <Link 
                          href={`/organizations/${org.id}`}
                          className="text-sm font-medium text-blue-600 hover:text-blue-900 truncate"
                        >
                          {org.name}
                        </Link>
                        {org.description && (
                          <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                            {org.description}
                          </p>
                        )}
                      </div>
                      <div className="ml-4 flex-shrink-0 flex space-x-2 opacity-0 group-hover:opacity-100">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            setEditingOrg(org);
                            setShowCreateOrg(true);
                          }}
                          className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          title="Edit organization"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={async (e) => {
                            e.preventDefault();
                            if (window.confirm(`Are you sure you want to delete "${org.name}"?`)) {
                              try {
                                const response = await fetch(`/api/organizations/${org.id}`, {
                                  method: 'DELETE',
                                });
                                if (!response.ok) throw new Error('Failed to delete organization');
                                await fetchOrganizations();
                                showToast({ title: 'Organization deleted', description: `${org.name} was removed.` });
                              } catch (err) {
                                setError(err instanceof Error ? err.message : 'Failed to delete organization');
                                showToast({ title: 'Failed to delete organization', description: err instanceof Error ? err.message : 'Unknown error', type: 'destructive' });
                              }
                            }
                          }}
                          className="p-1 rounded-full text-gray-400 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          title="Delete organization"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Teams Section */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Teams
                        </h4>
                        <button
                          onClick={() => setShowCreateTeamForOrg(org.id)}
                          className="text-xs text-blue-600 hover:text-blue-800"
                          title="Add team"
                        >
                          + Add Team
                        </button>
                      </div>

                      {/* Create Team Form */}
                      {showCreateTeamForOrg === org.id && (
                        <TeamForm
                          onSubmit={(data) => handleCreateTeam(org.id, data)}
                          onCancel={() => setShowCreateTeamForOrg(null)}
                        />
                      )}

                      {/* Edit Team Form */}
                      {editTeam?.orgId === org.id && editTeam.team && (
                        <TeamForm
                          team={editTeam.team}
                          onSubmit={(data) => 
                            handleUpdateTeam(org.id, editTeam.team.id, data)
                          }
                          onCancel={() => setEditTeam(null)}
                        />
                      )}

                      {/* Teams List */}
                      {orgTeams[org.id]?.length > 0 && (
                        <ul className="mt-2 space-y-2">
                          {orgTeams[org.id].map((team) => (
                            <li key={team.id} className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded-md">
                              <div>
                                <Link href={`/teams/${team.id}`} className="text-sm font-medium text-blue-600 hover:underline">
                                  {team.name}
                                </Link>
                                {team.description && (
                                  <p className="text-xs text-gray-500 mt-1">{team.description}</p>
                                )}
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => setEditTeam({ orgId: org.id, team })}
                                  className="text-gray-400 hover:text-blue-600"
                                  title="Edit team"
                                >
                                  <PencilIcon className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteTeam(org.id, team.id)}
                                  className="text-gray-400 hover:text-red-600"
                                  title="Delete team"
                                >
                                  <TrashIcon className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Create/Edit Organization Modal */}
      {showCreateOrg && (
        <div className="fixed inset-0 z-[900] overflow-y-auto" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <div className="fixed inset-0 z-[900] bg-gray-500/75 pointer-events-none" aria-hidden="true"></div>

          {/* Dialog content wrapper */}
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <div className="relative z-[1000] w-full sm:max-w-lg text-left align-middle pointer-events-auto">
              <div className="overflow-hidden rounded-lg bg-white p-6 shadow-xl">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {editingOrg ? 'Edit Organization' : 'Create Organization'}
                </h3>
                <div className="mt-4">
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
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
              <div className="ml-4">
                <button
                  type="button"
                  className="text-red-500 hover:text-red-700 focus:outline-none"
                  onClick={() => setError(null)}
                >
                  <span className="sr-only">Dismiss</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
