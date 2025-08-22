import Link from 'next/link';
import { headers } from 'next/headers';
import { TeamMembers } from '@/components/TeamMembers';

export default async function TeamPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;

  const hdrs = await headers();
  const host = hdrs.get('x-forwarded-host') || hdrs.get('host') || 'localhost:3000';
  const proto = hdrs.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  const baseUrl = `${proto}://${host}`;

  const res = await fetch(`${baseUrl}/api/teams/${teamId}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">Failed to load team.</div>
        </div>
      </div>
    );
  }

  const team: {
    id: string;
    name: string;
    description?: string | null;
    organization?: { id: string; name: string } | null;
    members?: Array<{ id: string; name: string; email: string; role: string }>; 
  } = await res.json();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link href="/organizations" className="text-sm text-blue-700 hover:underline">← Back to Organizations</Link>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <h1 className="text-2xl font-semibold text-gray-900">{team.name}</h1>
          {team.description && (
            <p className="mt-1 text-sm text-gray-500">{team.description}</p>
          )}
          {team.organization && (
            <p className="mt-2 text-xs text-gray-500">Organization: {team.organization.name}</p>
          )}
        </div>

        <div className="px-6 py-4">
          <TeamMembers teamId={team.id} />
        </div>
      </div>
    </div>
  );
}
