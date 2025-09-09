'use client';

import { useEffect, useState } from 'react';
import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TeamMembers } from '@/components/TeamMembers';
import { TeamEditForm } from '@/components/TeamEditForm';
import { PencilIcon, TrashIcon } from '@heroicons/react/20/solid';
import { useToast } from '@/components/ui/toast';

type Team = {
  id: string;
  name: string;
  description?: string | null;
  organizationId: string;
  organization?: { id: string; name: string } | null;
  members?: Array<{ id: string; name: string; email: string; role: string }>;
};

function TeamPageContent({ teamId }: { teamId: string }) {
  const [team, setTeam] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const res = await fetch(`/api/teams/${teamId}`, {
          cache: 'no-store',
        });
        if (!res.ok) throw new Error('Failed to fetch team');
        const data = await res.json();
        setTeam(data);
      } catch (error) {
        console.error('Error fetching team:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeam();
  }, [teamId]);

  const handleTeamUpdated = (updatedTeam: Team) => {
    setTeam(updatedTeam);
    setIsEditing(false);
    showToast({ title: 'Team updated', description: 'Changes were saved successfully.' });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleConfirmDelete = async () => {
    if (!team) return;
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/teams/${teamId}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete team');
      }
      showToast({ title: 'Team deleted', description: `"${team.name}" was removed.` });
      if (team.organizationId) {
        router.push(`/organizations/${team.organizationId}`);
      } else {
        router.push('/organizations');
      }
      router.refresh();
    } catch (error) {
      console.error('Error deleting team:', error);
      showToast({ title: 'Failed to delete team', description: error instanceof Error ? error.message : 'Unknown error', type: 'destructive' });
    } finally {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  if (isLoading) return <div className="p-4">Loading team details...</div>;
  if (!team) return <div className="p-4">Team not found</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex justify-between items-center">
        <Link href="/teams/list" className="text-sm text-blue-700 hover:underline">← Back to Teams</Link>
        
        {!isEditing && (
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PencilIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Edit Team
            </button>
            <button
              type="button"
              onClick={() => setShowConfirm(true)}
              disabled={isDeleting}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
            >
              <TrashIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              {isDeleting ? 'Deleting...' : 'Delete Team'}
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <TeamEditForm 
          team={team} 
          onSuccess={handleTeamUpdated} 
          onCancel={handleCancelEdit} 
        />
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              {team.name}
            </h3>
            {team.organization && (
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                <span className="font-medium text-gray-700">Parent Organization:</span>{' '}
                <Link href={`/organizations/${team.organization.id}`} className="text-blue-700 hover:underline">
                  {team.organization.name}
                </Link>
              </p>
            )}
            {team.description && (
              <p className="mt-4 text-sm text-gray-700">
                {team.description}
              </p>
            )}
          </div>

          <div className="px-6 py-4">
            <TeamMembers teamId={team.id} />
          </div>
        </div>
      )}

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowConfirm(false)} />
          <div className="relative bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-gray-900">Delete Team</h3>
            <p className="mt-2 text-sm text-gray-600">Are you sure you want to delete this team? This action cannot be undone and may remove team members.</p>
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
                disabled={isDeleting}
                onClick={() => { void handleConfirmDelete(); }}
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

export default function TeamPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = use(params);
  return <TeamPageContent teamId={teamId} />;
}
