'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/toast';

interface OpsReview {
  id: string;
  title: string;
  description: string | null;
  quarter: string;
  year: number;
  team_id: string;
  team_name: string;
  owner_id: string | null;
  owner_name: string | null;
  item_count: number;
  createdat: string;
  updatedat: string;
}

export default function OpsReviewDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const [review, setReview] = useState<OpsReview | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReview = async () => {
      try {
        const response = await fetch(`/api/ops-reviews/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch Ops Review');
        }
        const data = await response.json();
        setReview(data);
      } catch (error) {
        console.error('Error fetching Ops Review:', error);
        showToast({
          title: 'Error',
          description: 'Failed to load Ops Review',
          type: 'destructive',
        });
        router.push('/ops-reviews');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchReview();
    }
  }, [id, router, showToast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                Ops Review not found
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleEdit = () => {
    router.push(`/ops-reviews/${id}/edit`);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this Ops Review? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/ops-reviews/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete Ops Review');
      }

      showToast({
        title: 'Success',
        description: 'Ops Review deleted successfully',
        type: 'default',
      });

      router.push('/ops-reviews');
    } catch (error) {
      console.error('Error deleting Ops Review:', error);
      showToast({
        title: 'Error',
        description: 'Failed to delete Ops Review. Please try again.',
        type: 'destructive',
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">{review.title}</h1>
          <div className="flex items-center text-sm text-gray-600 space-x-4">
            <span>Team: {review.team_name}</span>
            <span>•</span>
            <span>{review.quarter} {review.year}</span>
            <span>•</span>
            <span>{review.item_count} {review.item_count === 1 ? 'item' : 'items'}</span>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={handleDelete}
            className="inline-flex items-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            disabled={isLoading}
          >
            Delete
          </button>
          <button
            type="button"
            onClick={handleEdit}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={isLoading}
          >
            Edit
          </button>
        </div>
      </div>

      {review.description && (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Description</h3>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <p className="text-gray-700 whitespace-pre-line">{review.description}</p>
          </div>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Review Items</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Items to be reviewed in this session
          </p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <p className="text-gray-500 italic">No review items added yet.</p>
        </div>
      </div>
    </div>
  );
}
