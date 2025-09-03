'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Goal, BusinessUnit, Stakeholder } from '@prisma/client';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

type GoalWithRelations = Goal & {
  businessUnit?: BusinessUnit;
  stakeholder?: Stakeholder;
};

export default function EditGoalPage() {
  const params = useParams();
  const router = useRouter();
  const goalId = params.id as string;
  
  const [goal, setGoal] = useState<GoalWithRelations | null>(null);
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'NOT_STARTED',
    requirements: '',
    progressNotes: '',
    quarter: 'Q1',
    year: new Date().getFullYear().toString(),
    stakeholderId: ''
  });

  useEffect(() => {
    fetchGoal();
    fetchStakeholders();
  }, [goalId]);

  async function fetchGoal() {
    try {
      const response = await fetch(`/api/goals/${goalId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch goal');
      }
      const data = await response.json();
      setGoal(data);
      setFormData({
        title: data.title || '',
        description: data.description || '',
        status: data.status || 'NOT_STARTED',
        requirements: data.requirements || '',
        progressNotes: data.progressNotes || '',
        quarter: data.quarter || 'Q1',
        year: data.year?.toString() || new Date().getFullYear().toString(),
        stakeholderId: data.stakeholderId || ''
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  async function fetchStakeholders() {
    try {
      if (!goal?.businessUnit?.id) return;
      
      const response = await fetch(`/api/business-units/${goal.businessUnit.id}/stakeholders`);
      if (response.ok) {
        const data = await response.json();
        setStakeholders(data);
      }
    } catch (err) {
      console.error('Error fetching stakeholders:', err);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const response = await fetch(`/api/goals/${goalId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to update goal');
      }

      router.push(`/goals/${goalId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading goal...</p>
        </div>
      </div>
    );
  }

  if (error && !goal) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Goal Not Found</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push(`/goals/${goalId}`)}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Goal
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900">Edit Goal</h1>
          {goal?.businessUnit && (
            <p className="mt-2 text-sm text-gray-600">
              Business Unit: {goal.businessUnit.name}
            </p>
          )}
        </div>

        {/* Form */}
        <div className="bg-white shadow rounded-lg">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Goal Title *
              </label>
              <input
                type="text"
                id="title"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            {/* Status, Quarter, Year Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  id="status"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="NOT_STARTED">Not Started</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="AT_RISK">At Risk</option>
                  <option value="BLOCKED">Blocked</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              <div>
                <label htmlFor="quarter" className="block text-sm font-medium text-gray-700">
                  Quarter
                </label>
                <select
                  id="quarter"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  value={formData.quarter}
                  onChange={(e) => setFormData({ ...formData, quarter: e.target.value })}
                >
                  <option value="Q1">Q1</option>
                  <option value="Q2">Q2</option>
                  <option value="Q3">Q3</option>
                  <option value="Q4">Q4</option>
                </select>
              </div>

              <div>
                <label htmlFor="year" className="block text-sm font-medium text-gray-700">
                  Year
                </label>
                <input
                  type="number"
                  id="year"
                  min="2020"
                  max="2030"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                />
              </div>
            </div>

            {/* Stakeholder */}
            {stakeholders.length > 0 && (
              <div>
                <label htmlFor="stakeholderId" className="block text-sm font-medium text-gray-700">
                  Assigned Stakeholder
                </label>
                <select
                  id="stakeholderId"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  value={formData.stakeholderId}
                  onChange={(e) => setFormData({ ...formData, stakeholderId: e.target.value })}
                >
                  <option value="">Select a stakeholder</option>
                  {stakeholders.map((stakeholder) => (
                    <option key={stakeholder.id} value={stakeholder.id}>
                      {stakeholder.name} - {stakeholder.role}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Requirements */}
            <div>
              <label htmlFor="requirements" className="block text-sm font-medium text-gray-700">
                Requirements
              </label>
              <textarea
                id="requirements"
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="List the requirements needed to achieve this goal..."
                value={formData.requirements}
                onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
              />
            </div>

            {/* Progress Notes */}
            <div>
              <label htmlFor="progressNotes" className="block text-sm font-medium text-gray-700">
                Progress Notes
              </label>
              <textarea
                id="progressNotes"
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Add notes about progress, blockers, or updates..."
                value={formData.progressNotes}
                onChange={(e) => setFormData({ ...formData, progressNotes: e.target.value })}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.push(`/goals/${goalId}`)}
                className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
