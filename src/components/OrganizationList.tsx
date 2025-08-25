'use client';

import Link from 'next/link';
import { Organization, BusinessUnit } from '@prisma/client';
import { PlusIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

type OrganizationWithDetails = Organization & {
  businessUnits: BusinessUnit[];
};

interface OrganizationListProps {
  organizations: OrganizationWithDetails[];
  onCreateOrg: () => void;
  onSelectOrg: (org: OrganizationWithDetails) => void;
}

export function OrganizationList({
  organizations,
  onCreateOrg,
  onSelectOrg,
}: OrganizationListProps) {
  return (
    <div className="bg-white shadow rounded-lg">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900">Organizations</h2>
        <button
          onClick={onCreateOrg}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          New Organization
        </button>
      </div>
      <div className="divide-y divide-gray-200">
        {organizations.length > 0 ? (
          organizations.map((org) => (
            <div key={org.id} className="hover:bg-gray-50">
              <Link href={`/organizations/${org.id}`} className="block">
                <div className="px-4 py-4 flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-blue-600 truncate">
                        {org.name}
                      </p>
                      <div className="ml-2 flex-shrink-0 flex">
                        <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {org.businessUnits.length} units
                        </p>
                      </div>
                    </div>
                    {org.description && (
                      <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                        {org.description}
                      </p>
                    )}
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <ChevronRightIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                </div>
              </Link>
            </div>
          ))
        ) : (
          <div className="px-4 py-6 text-center text-sm text-gray-500">
            No organizations yet. Create your first one to get started.
          </div>
        )}
      </div>
    </div>
  );
}