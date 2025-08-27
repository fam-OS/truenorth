'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useOrganization } from '@/contexts/OrganizationContext';

function useInitiatives(orgId?: string) {
  return useQuery({
    queryKey: ['initiatives', orgId],
    queryFn: async () => {
      if (!orgId) return [] as any[];
      const res = await fetch(`/api/initiatives?orgId=${orgId}`);
      if (!res.ok) throw new Error('Failed to fetch initiatives');
      return res.json();
    },
    enabled: !!orgId,
  });
}

export default function InitiativesPage() {
  const { currentOrg } = useOrganization();
  const { data: initiatives = [], isLoading } = useInitiatives(currentOrg?.id);

  if (!currentOrg) {
    return <p className="p-6 text-sm text-gray-500">Select an organization to view initiatives.</p>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold">Initiatives</h1>
          <p className="mt-1 text-sm text-gray-500">Strategic initiatives for {currentOrg.name}</p>
        </div>
        <Link
          href="/initiatives/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          New Initiative
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : initiatives.length === 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6 text-center">
            <h3 className="mt-2 text-sm font-medium text-gray-900">No Initiatives</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new initiative.</p>
            <div className="mt-6">
              <Link
                href="/initiatives/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                New Initiative
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {initiatives.map((i: any) => (
              <li key={i.id}>
                <Link href={`/initiatives/${i.id}`} className="block hover:bg-gray-50">
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-blue-600 truncate">{i.name}</p>
                      {i.releaseDate && (
                        <p className="ml-2 text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                          Releases {new Date(i.releaseDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    {i.summary && (
                      <p className="mt-2 text-sm text-gray-500 line-clamp-2">{i.summary}</p>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
