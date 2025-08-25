'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/toast';

interface OpsReviewItem {
  id: string;
  title: string;
  description: string | null;
  targetMetric: number | null;
  actualMetric: number | null;
  quarter: string;
  year: number;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    name: string;
    email: string | null;
  } | null;
  team: {
    id: string;
    name: string;
  };
  opsReview: {
    id: string;
    title: string;
  };
}

interface OpsReview {
  id: string;
  title: string;
  description: string | null;
  quarter: string;
  year: number;
  month: number | null;
  team_id: string;
  team_name: string;
  owner_id: string | null;
  owner_name: string | null;
  item_count: number;
  createdat: string;
  updatedat: string;
  items: OpsReviewItem[];
}

function OpsReviewDetailContent({ id }: { id: string }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [review, setReview] = useState<OpsReview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isItemsLoading, setIsItemsLoading] = useState(false);

  const fetchReviewItems = async (reviewId: string) => {
    try {
      setIsItemsLoading(true);
      const response = await fetch(`/api/ops-reviews/${reviewId}/items`);
      if (!response.ok) {
        throw new Error('Failed to fetch review items');
      }
      const items = await response.json();
      
      // Transform the items to match our UI needs
      const transformedItems = items.map((item: any) => ({
        ...item,
        owner_name: item.owner?.name || null,
        team_name: item.team?.name || 'Unknown Team',
      }));
      
      setReview(prev => prev ? { ...prev, items: transformedItems } : null);
    } catch (error) {
      console.error('Error fetching review items:', error);
      showToast({
        title: 'Error',
        description: 'Failed to load review items',
        type: 'destructive',
      });
    } finally {
      setIsItemsLoading(false);
    }
  };

  useEffect(() => {
    const fetchReview = async () => {
      try {
        const response = await fetch(`/api/ops-reviews/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch Ops Review');
        }
        const data = await response.json();
        setReview(data);
        
        // Fetch items after the review is loaded
        await fetchReviewItems(id as string);
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
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">Review Items</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Items to be reviewed in this session
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.push(`/ops-reviews/${id}/items/new`)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Add Item
            </button>
          </div>
        </div>
        {isItemsLoading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : review?.items?.length ? (
          <div className="divide-y divide-gray-200">
            {review.items.map((item) => (
              <div key={item.id} className="px-4 py-5 sm:px-6 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="text-md font-medium text-gray-900">{item.title}</h4>
                    {item.description && (
                      <p className="mt-1 text-sm text-gray-600">{item.description}</p>
                    )}
                    {(item.targetMetric !== null || item.actualMetric !== null) && (
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <span>Target: {item.targetMetric ?? 'N/A'}</span>
                        <span className="mx-2">•</span>
                        <span>Actual: {item.actualMetric ?? 'N/A'}</span>
                      </div>
                    )}
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => router.push(`/ops-reviews/${id}/items/${item.id}/edit`)}
                      className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                    >
                      Edit
                    </button>
                  </div>
                </div>
                <div className="mt-2 flex justify-between items-center text-xs text-gray-500">
                  <span>{item.quarter} {item.year}</span>
                  {item.owner?.name && <span>Owner: {item.owner.name}</span>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-4 py-5 sm:px-6 text-center">
            <p className="text-gray-500 italic">No review items added yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OpsReviewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <OpsReviewDetailContent id={id} />;
}
