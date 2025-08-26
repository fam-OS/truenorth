'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/toast';

interface OpsReview {
  id: string;
  title: string;
  description: string | null;
  quarter: string;
  year: number;
  month: number | null;
  teamId: string;
  ownerId: string | null;
}

function EditOpsReviewContent({ id }: { id: string }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [review, setReview] = useState<Partial<OpsReview>>({});
  const [teams, setTeams] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch the review data
        const reviewResponse = await fetch(`/api/ops-reviews/${id}`);
        if (!reviewResponse.ok) {
          throw new Error('Failed to fetch Ops Review');
        }
        const reviewData = await reviewResponse.json();
        
        // Transform the data to match our form state
        setReview({
          id: reviewData.id,
          title: reviewData.title,
          description: reviewData.description,
          quarter: reviewData.quarter,
          year: reviewData.year,
          month: reviewData.month,
          teamId: reviewData.team_id || reviewData.teamId,
          ownerId: reviewData.owner_id || reviewData.ownerId
        });

        // Fetch teams for the dropdown
        const teamsResponse = await fetch('/api/teams');
        if (teamsResponse.ok) {
          const teamsData = await teamsResponse.json();
          setTeams(teamsData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        showToast({
          title: 'Error',
          description: 'Failed to load Ops Review data',
          type: 'destructive',
        });
        router.push('/ops-reviews');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id, router, showToast]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!review.title || !review.quarter || review.year === undefined || !review.teamId) {
      showToast({
        title: 'Error',
        description: 'Please fill in all required fields',
        type: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare the update data with proper type conversion
      type UpdatePayload = {
        title: string;
        description?: string;
        quarter: string;
        year: number;
        teamId: string;
        ownerId?: string;
        month?: number;
      };
      const updateData: UpdatePayload = {
        title: review.title as string,
        description: (review.description ?? undefined) as string | undefined,
        quarter: review.quarter as string,
        year: Number(review.year),
        teamId: review.teamId as string,
        ownerId: (review.ownerId ?? undefined) as string | undefined,
      };

      // Only include month if it has a value
      if (review.month !== undefined && review.month !== null) {
        updateData.month = Number(review.month);
      }

      if (review.ownerId) {
        updateData.ownerId = review.ownerId;
      }

      const response = await fetch(`/api/ops-reviews/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update Ops Review');
      }

      const data = await response.json();
      
      showToast({
        title: 'Success',
        description: 'Ops Review updated successfully!',
        type: 'default',
      });
      
      // Navigate back to the review detail page
      router.push(`/ops-reviews/${data.id}`);
    } catch (error) {
      console.error('Error updating Ops Review:', error);
      showToast({
        title: 'Error',
        description: 'Failed to update Ops Review. Please try again.',
        type: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setReview(prev => ({
      ...prev,
      [name]: value === '' ? null : value,
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Edit Ops Review</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={review.title || ''}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={review.description || ''}
            onChange={handleChange}
            rows={4}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="quarter" className="block text-sm font-medium text-gray-700">
              Quarter <span className="text-red-500">*</span>
            </label>
            <select
              id="quarter"
              name="quarter"
              value={review.quarter || ''}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
              required
            >
              <option value="">Select a quarter</option>
              {quarters.map(q => (
                <option key={q} value={q}>{q}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="year" className="block text-sm font-medium text-gray-700">
              Year <span className="text-red-500">*</span>
            </label>
            <select
              id="year"
              name="year"
              value={review.year || ''}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
              required
            >
              <option value="">Select a year</option>
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="month" className="block text-sm font-medium text-gray-700">
              Month (Optional)
            </label>
            <select
              id="month"
              name="month"
              value={review.month || ''}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
            >
              <option value="">No specific month</option>
              {months.map(month => (
                <option key={month} value={month}>
                  {new Date(2000, month - 1, 1).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="teamId" className="block text-sm font-medium text-gray-700">
            Team <span className="text-red-500">*</span>
          </label>
          <select
            id="teamId"
            name="teamId"
            value={review.teamId || ''}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
            required
          >
            <option value="">Select a team</option>
            {teams.map(team => (
              <option key={team.id} value={team.id}>{team.name}</option>
            ))}
          </select>
        </div>

        <div className="flex justify-end space-x-3 pt-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function EditOpsReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <EditOpsReviewContent id={id} />;
}
