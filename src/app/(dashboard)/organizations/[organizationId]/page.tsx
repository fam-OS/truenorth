'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Organization, BusinessUnit } from '@prisma/client';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

type OrganizationWithDetails = Organization & {
  businessUnits: BusinessUnit[];
};

export default function OrganizationDetailPage({ params }: { params: { organizationId: string } }) {
  const router = useRouter();
  const [organization, setOrganization] = useState<OrganizationWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        const response = await fetch(`/api/organizations/${params.organizationId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch organization');
        }
        const data = await response.json();
        setOrganization(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching organization:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrganization();
  }, [params.organizationId]);

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

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            {organization.name}
          </h3>
        </div>
        <div className="px-4 py-5 sm:p-6 space-y-6">
          {organization.description && (
            <div>
              <h3 className="text-sm font-medium text-gray-500">Description</h3>
              <p className="mt-1 text-sm text-gray-900">{organization.description}</p>
            </div>
          )}

          <div>
            <h3 className="text-sm font-medium text-gray-500">Business Units</h3>
            {organization.businessUnits.length > 0 ? (
              <ul className="mt-2 divide-y divide-gray-200">
                {organization.businessUnits.map((unit) => (
                  <li key={unit.id} className="py-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">{unit.name}</p>
                      {unit.description && (
                        <span className="text-sm text-gray-500">{unit.description}</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-sm text-gray-500">No business units found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
