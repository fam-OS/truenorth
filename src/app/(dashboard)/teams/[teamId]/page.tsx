'use client';

import { useEffect, useState } from 'react';
import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TeamMembers } from '@/components/TeamMembers';
import { TeamEditForm } from '@/components/TeamEditForm';
import { PencilIcon } from '@heroicons/react/20/solid';

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
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  if (isLoading) return <div className="p-4">Loading team details...</div>;
  if (!team) return <div className="p-4">Team not found</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex justify-between items-center">
        <Link href="/organizations" className="text-sm text-blue-700 hover:underline">← Back to Organizations</Link>
        
        {!isEditing && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PencilIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Edit Team
          </button>
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
                Organization: {team.organization.name}
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
    </div>
  );
}

export default function TeamPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = use(params);
  return <TeamPageContent teamId={teamId} />;
}
