'use client';

import { Goal } from '@prisma/client';
import { format } from 'date-fns';
import { PlusIcon, PencilIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

const statusColors = {
  NOT_STARTED: 'bg-gray-100 text-gray-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  AT_RISK: 'bg-yellow-100 text-yellow-800',
  BLOCKED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-600',
};

interface GoalListProps {
  goals: Goal[];
  onCreateGoal: () => void;
  onEditGoal: (goal: Goal) => void;
  onSelectGoal?: (goal: Goal) => void;
}

export function GoalList({ goals, onCreateGoal, onEditGoal, onSelectGoal }: GoalListProps) {
  return (
    <div className="bg-white shadow rounded-lg">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900">Goals</h2>
        <button
          onClick={onCreateGoal}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          New Goal
        </button>
      </div>
      <div className="overflow-hidden">
        <ul role="list" className="divide-y divide-gray-200">
          {goals.map((goal) => (
            <li
              key={goal.id}
              className="hover:bg-gray-50 cursor-pointer"
              onClick={() => onSelectGoal?.(goal)}
            >
              <div className="px-4 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditGoal(goal);
                      }}
                      className="mr-2 text-gray-400 hover:text-gray-600"
                      title="Edit goal"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <p className="text-sm font-medium text-gray-900">{goal.title}</p>
                    {goal.status && (
                      <span
                        className={clsx(
                          'ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full',
                          statusColors[goal.status]
                        )}
                      >
                        {goal.status}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {(goal as any).quarter} {(goal as any).year}
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">{goal.description}</p>
                </div>
                <div className="mt-2 flex space-x-4 text-xs text-gray-500">
                  {goal.requirements && (
                    <div className="flex items-center">
                      <span className="h-1 w-1 bg-gray-400 rounded-full mr-1"></span>
                      Has requirements
                    </div>
                  )}
                  {goal.progressNotes && (
                    <div className="flex items-center">
                      <span className="h-1 w-1 bg-gray-400 rounded-full mr-1"></span>
                      Has progress notes
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
          {goals.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-gray-500">
              No goals yet. Create your first goal to get started.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}