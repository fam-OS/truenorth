'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Goal, BusinessUnit, Stakeholder } from '@prisma/client';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { GoalFormModal } from '@/components/GoalFormModal';

type GoalWithRelations = Goal & {
  businessUnit?: BusinessUnit;
  stakeholder?: Stakeholder;
};

export default function EditGoalPage() {
  const params = useParams();
  const router = useRouter();
  const goalId = params.id as string;
  
  const [goal, setGoal] = useState<GoalWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

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

  async function handleSubmitFromModal(payload: any) {
    setSaving(true);
    setError('');
    try {
      const response = await fetch(`/api/goals/${goalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const raw = await response.clone().text();
      if (!response.ok) {
        let msg = 'Failed to update goal';
        try { const j = JSON.parse(raw || '{}'); msg = j.error || msg; } catch {}
        throw new Error(msg);
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

        <GoalFormModal
          isOpen={true}
          onClose={() => router.push(`/goals/${goalId}`)}
          goal={goal as any}
          onSubmit={handleSubmitFromModal}
          isSubmitting={saving}
        />
      </div>
    </div>
  );
}
