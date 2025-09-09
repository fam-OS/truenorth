'use client';

import { Stakeholder } from '@prisma/client';
import { useState } from 'react';

interface StakeholderListProps {
  stakeholders: Stakeholder[];
  onSelectStakeholder: (stakeholder: Stakeholder) => void;
  onCreateStakeholder: () => void;
  onRemoveStakeholder?: (stakeholder: Stakeholder) => void;
  hasTeamMembers?: boolean;
}

export function StakeholderList({
  stakeholders,
  onSelectStakeholder,
  onCreateStakeholder,
  onRemoveStakeholder,
  hasTeamMembers,
}: StakeholderListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStakeholders = stakeholders.filter((stakeholder) =>
    stakeholder.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    stakeholder.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative flex-1 max-w-xs">
          <input
            type="text"
            placeholder="Search stakeholders..."
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg
              className="h-5 w-5 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
        <button
          onClick={onCreateStakeholder}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          Add Stakeholder
        </button>
      </div>

      {filteredStakeholders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No stakeholders found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm
              ? 'Try adjusting your search terms'
              : hasTeamMembers === false
                ? (<>
                    You don’t have any team members yet. Please <a href="/team-members/new" className="text-blue-600 hover:underline">create a team member</a> first, then add them as a stakeholder.
                  </>)
                : 'Get started by adding a new stakeholder'}
          </p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {filteredStakeholders.map((stakeholder) => (
              <li key={stakeholder.id}>
                <button
                  onClick={() => onSelectStakeholder(stakeholder)}
                  className="w-full text-left hover:bg-gray-50 p-4 focus:outline-none focus:bg-gray-50 transition duration-150 ease-in-out"
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-blue-600 truncate">
                          {stakeholder.name}
                        </p>
                        <div className="ml-2 flex-shrink-0 flex">
                          <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {stakeholder.role}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="ml-6 flex items-center gap-3">
                      {onRemoveStakeholder && (
                        <button
                          type="button"
                          className="text-xs text-red-600 hover:text-red-800"
                          title="Remove from this business unit"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onRemoveStakeholder(stakeholder);
                          }}
                        >
                          Remove
                        </button>
                      )}
                      <svg
                        className="h-5 w-5 text-gray-400"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}