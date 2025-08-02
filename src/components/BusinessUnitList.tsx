'use client';

import { BusinessUnit, Stakeholder, Metric } from '@prisma/client';
import { PlusIcon, UserGroupIcon, ChartBarIcon } from '@heroicons/react/24/outline';

type BusinessUnitWithDetails = BusinessUnit & {
  stakeholders: Stakeholder[];
  metrics: Metric[];
};

interface BusinessUnitListProps {
  businessUnits: BusinessUnitWithDetails[];
  onCreateUnit: () => void;
  onSelectUnit: (unit: BusinessUnitWithDetails) => void;
}

export function BusinessUnitList({
  businessUnits,
  onCreateUnit,
  onSelectUnit,
}: BusinessUnitListProps) {
  return (
    <div className="bg-white shadow rounded-lg">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900">Business Units</h2>
        <button
          onClick={onCreateUnit}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          New Business Unit
        </button>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 p-4">
        {businessUnits.map((unit) => (
          <div
            key={unit.id}
            className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex flex-col space-y-3 hover:border-gray-400 hover:cursor-pointer"
            onClick={() => onSelectUnit(unit)}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-medium text-gray-900">{unit.name}</h3>
                {unit.description && (
                  <p className="text-sm text-gray-500 mt-1">{unit.description}</p>
                )}
              </div>
            </div>
            <div className="flex space-x-4 text-sm text-gray-500">
              <div className="flex items-center">
                <UserGroupIcon className="h-4 w-4 mr-1" />
                {unit.stakeholders.length} stakeholders
              </div>
              <div className="flex items-center">
                <ChartBarIcon className="h-4 w-4 mr-1" />
                {unit.metrics.length} metrics
              </div>
            </div>
          </div>
        ))}
        {businessUnits.length === 0 && (
          <div className="col-span-full text-center text-sm text-gray-500 py-6">
            No business units yet. Create your first one to get started.
          </div>
        )}
      </div>
    </div>
  );
}