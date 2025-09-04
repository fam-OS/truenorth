'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Organization, BusinessUnit } from '@prisma/client';
import { useToast } from '@/components/ui/toast';
import { ArrowLeftIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import OrganizationProfile from '@/components/OrganizationProfile';

type OrganizationWithDetails = Organization & {
  businessUnits: BusinessUnit[];
};

export default function OrganizationDetailPage({ params }: { params: Promise<{ organizationId: string }> }) {
  const router = useRouter();
  const { organizationId } = use(params);
  const [organization, setOrganization] = useState<OrganizationWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teams, setTeams] = useState<Array<{ id: string; name: string; description?: string | null }>>([]);
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');
  const [isSavingTeam, setIsSavingTeam] = useState(false);
  const [teamFormError, setTeamFormError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { showToast } = useToast();
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    try {
      setDeleting(true);
      const response = await fetch(`/api/organizations/${organizationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.error || 'Failed to delete organization');
      }

      showToast({ title: 'Organization deleted successfully', type: 'default' });
      router.replace('/organizations');
    } catch (error) {
      console.error('Error deleting organization:', error);
      showToast({ title: 'Failed to delete organization', description: error instanceof Error ? error.message : 'Unknown error', type: 'destructive' });
    } finally {
      setDeleting(false);
      setShowConfirm(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    const fetchOrganization = async () => {
      try {
        const response = await fetch(`/api/organizations/${organizationId}`, { cache: 'no-store' });
        if (!response.ok) {
          if (response.status === 404) {
            // Organization was deleted, redirect to organizations list
            router.replace('/organizations');
            return;
          }
          throw new Error('Failed to fetch organization');
        }
        const data = await response.json();
        setOrganization(data);

        // Fetch teams separately to avoid relying on included data and to bypass SSR cache issues
        const teamsRes = await fetch(`/api/organizations/${organizationId}/teams`, { cache: 'no-store' });
        if (teamsRes.ok) {
          const teamsData = await teamsRes.json();
          setTeams(teamsData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching organization:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrganization();
  }, [organizationId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !organization) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {error || 'Organization not found'}
              </p>
            </div>
          </div>
          <button 
            onClick={() => router.back()}
            className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Organizations
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <button 
          onClick={() => router.back()}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mb-6"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Organizations
        </button>
      </div>

      {isEditing ? (
        <OrganizationProfile 
          organization={organization} 
          onEdit={() => setIsEditing(false)}
        />
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {organization.name}
              </h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Edit
                </button>
                <button
                  onClick={() => setShowConfirm(true)}
                  className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <TrashIcon className="h-4 w-4 mr-1" />
                  Delete
                </button>
              </div>
            </div>
          </div>
          <div className="px-4 py-5 sm:p-6 space-y-6">
            {organization.description && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Description</h3>
                <p className="mt-1 text-sm text-gray-900">{organization.description}</p>
              </div>
            )}


            {mounted && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Teams</h3>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-sm text-gray-500">Manage teams for this organization.</p>
                  <button
                    type="button"
                    onClick={() => setShowAddTeam((v) => !v)}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {showAddTeam ? 'Cancel' : 'Add Team'}
                  </button>
                </div>

              {showAddTeam && (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setTeamFormError(null);
                    if (!newTeamName.trim()) {
                      setTeamFormError('Team name is required');
                      showToast({ title: 'Validation error', description: 'Team name is required', type: 'destructive' });
                      return;
                    }
                    try {
                      setIsSavingTeam(true);
                      const res = await fetch(`/api/organizations/${organizationId}/teams`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: newTeamName.trim(), description: newTeamDescription.trim() || null }),
                      });
                      if (!res.ok) {
                        const err = await res.json().catch(() => ({}));
                        throw new Error(err.error || 'Failed to create team');
                      }
                      const created = await res.json();
                      setTeams((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
                      setNewTeamName('');
                      setNewTeamDescription('');
                      setShowAddTeam(false);
                      showToast({ title: 'Team created', description: 'New team has been added.' });
                    } catch (err) {
                      setTeamFormError(err instanceof Error ? err.message : 'An error occurred');
                      showToast({ title: 'Failed to create team', description: err instanceof Error ? err.message : 'An error occurred', type: 'destructive' });
                    } finally {
                      setIsSavingTeam(false);
                    }
                  }}
                  className="mt-3 bg-gray-50 border border-gray-200 rounded-md p-4"
                >
                  {teamFormError && (
                    <div className="mb-3 rounded-md bg-red-50 p-2 text-sm text-red-700">{teamFormError}</div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="team-name" className="block text-sm font-medium text-gray-700">Team Name</label>
                      <input
                        id="team-name"
                        type="text"
                        required
                        value={newTeamName}
                        onChange={(e) => setNewTeamName(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="team-description" className="block text-sm font-medium text-gray-700">Description</label>
                      <input
                        id="team-description"
                        type="text"
                        value={newTeamDescription}
                        onChange={(e) => setNewTeamDescription(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => { setShowAddTeam(false); setTeamFormError(null); }}
                      className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingTeam}
                      className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                      {isSavingTeam ? 'Saving...' : 'Create Team'}
                    </button>
                  </div>
                </form>
              )}
              {teams.length > 0 ? (
                <ul className="mt-2 divide-y divide-gray-200">
                  {teams.map((team) => (
                    <li key={team.id} className="py-2">
                      <div className="flex items-center justify-between">
                        <Link href={`/teams/${team.id}`} className="text-sm font-medium text-blue-600 hover:underline">
                          {team.name}
                        </Link>
                        {team.description && (
                          <span className="text-sm text-gray-500">{team.description}</span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-sm text-gray-500">No teams found</p>
              )}
            </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowConfirm(false)} />
          <div className="relative bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-gray-900">Delete Organization</h3>
            <p className="mt-2 text-sm text-gray-600">Are you sure you want to delete this organization? This action cannot be undone.</p>
            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                onClick={() => setShowConfirm(false)}
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
