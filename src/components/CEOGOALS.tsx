'use client';

import { useState } from 'react';
import { PencilIcon } from '@heroicons/react/24/outline';

interface CEOGoal {
  id?: string;
  description: string;
}

interface CEOGoalsProps {
  initialGoals?: CEOGoal[];
  onSave?: (goals: CEOGoal[]) => Promise<void>;
}

export default function CEOGoals({ 
  initialGoals = Array(5).fill({ description: '' }), 
  onSave 
}: CEOGoalsProps) {
  const [goals, setGoals] = useState<CEOGoal[]>(initialGoals);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleGoalChange = (index: number, value: string) => {
    const newGoals = [...goals];
    newGoals[index] = { ...newGoals[index], description: value };
    setGoals(newGoals);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      if (onSave) {
        await onSave(goals);
      }
      setIsEditing(false);
    } catch (err) {
      setError('Failed to save goals');
      console.error('Error saving goals:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Company Information</h2>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">CEO's top 5 goals this year</p>
        </div>
        {!isEditing ? (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PencilIcon className="-ml-0.5 mr-2 h-4 w-4" />
            Edit Goals
          </button>
        ) : (
          <div className="space-x-2">
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setGoals(initialGoals);
              }}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>
      <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
        <dl className="sm:divide-y sm:divide-gray-200">
          {goals.map((goal, index) => (
            <div key={index} className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Goal {index + 1}</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {isEditing ? (
                  <input
                    type="text"
                    value={goal.description}
                    onChange={(e) => handleGoalChange(index, e.target.value)}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="Enter goal description"
                  />
                ) : (
                  <span className={!goal.description ? 'text-gray-400' : ''}>
                    {goal.description || 'No goal set'}
                  </span>
                )}
              </dd>
            </div>
          ))}
        </dl>
      </div>
      {error && (
        <div className="px-4 py-2 bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
