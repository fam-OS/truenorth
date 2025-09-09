'use client';

import Link from 'next/link';
import type { BusinessUnitWithDetails } from '@/types/prisma';
import { UserGroupIcon, ChartBarIcon, PlusIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface BusinessUnitListProps {
  businessUnits: BusinessUnitWithDetails[];
  onSelectUnit?: (unit: BusinessUnitWithDetails) => void;
  onAddStakeholder?: (unit: BusinessUnitWithDetails) => void;
}

export function BusinessUnitList({
  businessUnits,
  onSelectUnit,
  onAddStakeholder,
}: BusinessUnitListProps) {
  return (
    <div className="bg-white shadow rounded-lg">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {businessUnits.map((unit) => (
          <div
            key={unit.id}
            className="group relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex flex-col space-y-3 hover:border-gray-400"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <Link
                  href={`/business-units/${unit.id}`}
                  className="text-left w-full flex items-start justify-between hover:no-underline"
                >
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 hover:underline">{unit.name}</h3>
                    {unit.description && (
                      <p className="text-sm text-gray-500 mt-1">{unit.description}</p>
                    )}
                  </div>
                  <ChevronRightIcon className="ml-3 h-4 w-4 text-gray-400 mt-0.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
              {onAddStakeholder && (
                <button
                  onClick={() => onAddStakeholder(unit)}
                  className="ml-2 inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
                  title="Add stakeholder"
                >
                  <PlusIcon className="h-3 w-3 mr-1" />
                  Stakeholder
                </button>
              )}
            </div>
            <div className="flex space-x-4 text-sm text-gray-500">
              <div className="flex items-center">
                <UserGroupIcon className="h-4 w-4 mr-1" />
                {(unit.Stakeholder || []).length} stakeholders
              </div>
              <div className="flex items-center">
                <ChartBarIcon className="h-4 w-4 mr-1" />
                {(unit.Goal || []).length} goals
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}