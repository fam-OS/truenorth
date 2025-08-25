'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useToast } from '@/components/ui/toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface Organization {
  id: string;
  name: string;
  description: string | null;
}

type Team = {
  id: string;
  name: string;
  description: string | null;
};

export default function NewOpsReviewPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const { currentOrg, setCurrentOrg, isLoading: isOrgLoading } = useOrganization();

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const response = await fetch('/api/organizations');
        if (!response.ok) {
          throw new Error('Failed to fetch organizations');
        }
        const data = await response.json();
        setOrganizations(data);
        
        // If there's no current org but we have orgs, set the first one
        if (data.length > 0 && !currentOrg) {
          setCurrentOrg(data[0]);
        }
      } catch (err) {
        console.error('Error fetching organizations:', err);
        showToast({
          title: 'Error',
          description: 'Failed to load organizations',
          type: 'destructive'
        });
      }
    };

    const fetchTeams = async () => {
      if (!currentOrg) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/organizations/${currentOrg.id}/teams`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch teams');
        }
        
        const data = await response.json();
        setTeams(data);
      } catch (err) {
        console.error('Error fetching teams:', err);
        showToast({
          title: 'Error',
          description: 'Failed to load teams. Please try again.',
          type: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (!currentOrg) {
      fetchOrganizations();
    } else {
      fetchTeams();
    }
  }, [currentOrg, showToast, setCurrentOrg]);

  const queryClient = useQueryClient();
  
  // Mutation for creating a new Ops Review
  const createOpsReview = useMutation({
    mutationFn: async (data: any) => {
      if (!currentOrg) {
        throw new Error('No organization selected');
      }

      const response = await fetch('/api/ops-reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create Ops Review');
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate the ops reviews query to refetch the list
      queryClient.invalidateQueries({ queryKey: ['opsReviews', currentOrg?.id] });
      
      showToast({
        title: 'Success',
        description: 'Ops Review created successfully',
        type: 'default',
      });
      
      // Redirect to the new Ops Review
      router.push(`/ops-reviews/${data.id}`);
    },
    onError: (error: Error) => {
      showToast({
        title: 'Error',
        description: error.message || 'Failed to create Ops Review',
        type: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Get form values for validation
    const teamId = formData.get('teamId') as string;
    const quarter = formData.get('quarter') as string;
    const year = formData.get('year') as string;
    const title = formData.get('title') as string;
    const month = formData.get('month');
    
    // Validate required fields
    if (!teamId || !quarter || !year || !title) {
      showToast({
        title: 'Error',
        description: 'Required fields are missing',
        type: 'destructive'
      });
      return;
    }

    // Create a properly typed object for submission
    const submissionData = {
      title,
      description: formData.get('description') as string,
      quarter,
      year: parseInt(year),
      teamId,
      ownerId: formData.get('ownerId') as string || undefined,
      ...(month ? { month: parseInt(month as string) } : {})
    };

    // Submit the form using the mutation
    createOpsReview.mutate(submissionData as any);
  };

  if (isLoading || isOrgLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">New Ops Review</h1>
        {organizations.length > 0 && (
          <div className="flex items-center space-x-2">
            <label htmlFor="organization" className="text-sm font-medium text-gray-700">
              Organization:
            </label>
            <select
              id="organization"
              value={currentOrg?.id || ''}
              onChange={(e) => {
                const selectedOrg = organizations.find(org => org.id === e.target.value);
                if (selectedOrg) setCurrentOrg(selectedOrg);
              }}
              className="block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            required
            disabled={isSubmitting || !teams.length}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="Enter review title"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            disabled={isSubmitting || !teams.length}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="Enter review description (optional)"
          />
        </div>

        <div>
          <label htmlFor="teamId" className="block text-sm font-medium text-gray-700">
            Team <span className="text-red-500">*</span>
          </label>
          {isLoading ? (
            <div className="mt-1 h-10 bg-gray-100 rounded-md animate-pulse"></div>
          ) : teams.length === 0 ? (
            <p className="mt-1 text-sm text-gray-500">No teams available for the selected organization.</p>
          ) : (
            <select
              id="teamId"
              name="teamId"
              required
              disabled={createOpsReview.isPending}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Select a team</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="quarter" className="block text-sm font-medium text-gray-700">
              Quarter <span className="text-red-500">*</span>
            </label>
            <select
              id="quarter"
              name="quarter"
              required
              disabled={isSubmitting || !teams.length}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
              defaultValue="Q3"
            >
              {['Q1', 'Q2', 'Q3', 'Q4'].map((q) => (
                <option key={q} value={q}>
                  {q}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="year" className="block text-sm font-medium text-gray-700">
              Year <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="year"
              name="year"
              required
              min="2000"
              max="3000"
              disabled={isSubmitting || !teams.length}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
              defaultValue={new Date().getFullYear()}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
            Notes <span className="text-red-500">*</span>
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={4}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => router.push('/ops-reviews')}
            disabled={createOpsReview.isPending}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createOpsReview.isPending || isLoading || !teams.length}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createOpsReview.isPending ? 'Creating...' : 'Create Ops Review'}
          </button>
        </div>
      </form>
    </div>
  );
}
