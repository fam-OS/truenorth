'use client';

import { useRouter } from 'next/navigation';
import { use } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useState, useEffect } from 'react';

// Simple form components
const Label = ({ children, htmlFor, className = '' }: { children: React.ReactNode, htmlFor: string, className?: string }) => (
  <label htmlFor={htmlFor} className={`block text-sm font-medium text-gray-700 ${className}`}>
    {children}
  </label>
);

const Input = ({ id, name, type = 'text', ...props }: { id: string, name: string, type?: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    id={id}
    name={name}
    type={type}
    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    {...props}
  />
);

const Textarea = ({ id, name, ...props }: { id: string, name: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    id={id}
    name={name}
    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    {...props}
  />
);

interface Team {
  id: string;
  name: string;
}

interface TeamMember {
  id: string;
  user: {
    name: string;
    email: string;
  };
}

interface Review {
  id: string;
  title: string;
  teamId: string;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function NewOpsReviewItemPage({ params }: PageProps) {
  const { id } = use(params);

  const [review, setReview] = useState<Review | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const reviewRes = await fetch(`/api/ops-reviews/${id}`).then(res => res.json());
        if (reviewRes.error) throw new Error(reviewRes.error);
        
        // Set default team from the review
        setReview(reviewRes);
        
        // Initialize with empty arrays for teams and team members
        // since we don't have the API endpoints
        setTeams([{ id: reviewRes.teamId, name: reviewRes.team?.name || 'Team' }]);
        setTeamMembers([]);
        
      } catch (err) {
        setError('Failed to load review details. Please try again.');
        console.error('Error fetching data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center text-red-600">
          Error: {error}
        </div>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center text-red-600">Review not found</div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      const response = await fetch(`/api/ops-reviews/${id}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.get('title'),
          description: formData.get('description'),
          targetMetric: formData.get('targetMetric') ? Number(formData.get('targetMetric')) : null,
          actualMetric: formData.get('actualMetric') ? Number(formData.get('actualMetric')) : null,
          teamId: formData.get('teamId'),
          ownerId: formData.get('ownerId') || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create item');
      }

      // Redirect back to the review page after successful creation
      router.push(`/ops-reviews/${id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create item');
      console.error('Error creating item:', err);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Link 
          href={`/ops-reviews/${id}`}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          &larr; Back to {review.title}
        </Link>
      </div>
      
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Add New Review Item</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                name="title"
                required
                placeholder="Enter item title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="teamId">Team</Label>
              <Input
                id="teamId"
                name="teamId"
                type="hidden"
                value={review.teamId}
                readOnly
              />
              <div className="px-3 py-2 bg-gray-100 rounded-md text-sm text-gray-700">
                {teams[0]?.name || 'Team'}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ownerName">Owner Name</Label>
              <Input
                id="ownerName"
                name="ownerName"
                placeholder="Enter owner name (optional)"
              />
              <input type="hidden" name="ownerId" value="" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetMetric">Target Metric</Label>
              <Input
                id="targetMetric"
                name="targetMetric"
                type="number"
                step="0.01"
                placeholder="Enter target value"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="actualMetric">Actual Metric</Label>
              <Input
                id="actualMetric"
                name="actualMetric"
                type="number"
                step="0.01"
                placeholder="Enter actual value"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Enter detailed description"
              rows={4}
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <Link
              href={`/ops-reviews/${id}`}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Create Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
