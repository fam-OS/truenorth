'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Goal, BusinessUnit, Stakeholder } from '@prisma/client';
import { format } from 'date-fns';
import { PencilIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

const statusColors = {
  NOT_STARTED: 'bg-gray-100 text-gray-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  AT_RISK: 'bg-yellow-100 text-yellow-800',
  BLOCKED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-600',
};

type GoalWithRelations = Goal & {
  businessUnit?: BusinessUnit;
  stakeholder?: Stakeholder;
};

export default function GoalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const goalId = params.id as string;
  
  const [goal, setGoal] = useState<GoalWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    fetchGoal();
  }, [goalId]);

  async function fetchGoal() {
    try {
      const response = await fetch(`/api/goals/${goalId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch goal');
      }
      const data = await response.json();
      setGoal(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteGoal() {
    if (!goal) return;
    console.log('Confirming deletion...', { goalId });

    try {
      setDeleting(true);
      console.log('Deleting goal...', { goalId });
      const res = await fetch(`/api/goals/${goalId}`, { method: 'DELETE', cache: 'no-store' });
      const raw = await res.clone().text();
      console.log('Delete response status:', res.status, 'raw:', raw);
      if (!res.ok) {
        let msg = 'Failed to delete goal';
        try {
          const json = JSON.parse(raw);
          msg = json?.error || msg;
        } catch {}
        alert(`Delete failed (status ${res.status}): ${msg}`);
        throw new Error(msg);
      }
      alert('Goal deleted successfully');
      // Navigate back to Business Units list (no standalone /goals route)
      await router.push('/business-units');
      router.refresh();
    } catch (err) {
      console.error('Delete goal failed:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete goal');
    } finally {
      setDeleting(false);
      setShowConfirm(false);
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

  if (error || !goal) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Goal Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'The goal you are looking for does not exist.'}</p>
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
            onClick={() => router.back()}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{goal.title}</h1>
              <div className="mt-2 flex items-center space-x-4">
                {goal.status && (
                  <span
                    className={clsx(
                      'px-3 py-1 text-sm font-medium rounded-full',
                      statusColors[goal.status]
                    )}
                  >
                    {goal.status.replace('_', ' ')}
                  </span>
                )}
                <span className="text-sm text-gray-500">
                  {goal.quarter} {goal.year}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push(`/goals/${goalId}/edit`)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit Goal
              </button>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowConfirm(true); }}
                disabled={deleting}
                className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Delete goal"
              >
                {deleting ? 'Deleting…' : 'Delete Goal'}
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 gap-8">
          {/* Main Details */}
          <div className="space-y-6">
            {/* Goal Summary for Business Unit */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                {`Goal for ${goal.businessUnit?.name ?? 'Business Unit'}`}
              </h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1">
                    <span
                      className={clsx(
                        'px-2 py-1 text-xs font-medium rounded-full',
                        goal.status ? statusColors[goal.status] : 'bg-gray-100 text-gray-800'
                      )}
                    >
                      {goal.status ? goal.status.replace('_', ' ') : 'Not Set'}
                    </span>
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500">Period</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {goal.quarter} {goal.year}
                  </dd>
                </div>

                {goal.businessUnit && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Business Unit</dt>
                    <dd className="mt-1 text-sm text-gray-900">{goal.businessUnit.name}</dd>
                  </div>
                )}

                {goal.stakeholder && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Stakeholder</dt>
                    <dd className="mt-1 text-sm text-gray-900">{goal.stakeholder.name}</dd>
                  </div>
                )}

                <div>
                  <dt className="text-sm font-medium text-gray-500">Created</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {format(new Date(goal.createdAt), 'MMM d, yyyy')}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {format(new Date(goal.updatedAt), 'MMM d, yyyy')}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Description */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Description</h2>
              <p className="text-gray-700 whitespace-pre-wrap">
                {goal.description || 'No description provided.'}
              </p>
            </div>

            {/* Requirements section removed: field no longer exists on Goal */}

            {/* Progress Notes */}
            {goal.progressNotes && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Progress Notes</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{goal.progressNotes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowConfirm(false)} />
          <div className="relative bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-gray-900">Delete Goal</h3>
            <p className="mt-2 text-sm text-gray-600">Are you sure you want to delete this goal? This action cannot be undone.</p>
            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                onClick={() => setShowConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 text-sm rounded-md border border-red-300 text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                disabled={deleting}
                onClick={() => { console.log('Delete confirmed'); void handleDeleteGoal(); }}
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
