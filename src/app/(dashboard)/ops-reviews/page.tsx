'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/toast';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface OpsReview {
  id: string;
  title: string;
  description: string | null;
  quarter: string;
  year: number;
  month: number | null;
  teamId: string;
  team_id: string;
  team_name: string;
  ownerId: string | null;
  owner_id: string | null;
  owner_name: string | null;
  item_count: number;
  createdAt: string;
  createdat: string;
  updatedAt: string;
  updatedat: string;
  team?: {
    id: string;
    name: string;
  };
  owner?: {
    id: string;
    name: string;
  } | null;
  items?: any[];
}

// Fetch function that can be used with React Query
async function fetchOpsReviews(orgId: string) {
  const response = await fetch(`/api/ops-reviews?teamId=${orgId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch Ops Reviews');
  }
  const data = await response.json();
  // Transform the data to match the expected format
  return data.map((review: any) => ({
    ...review,
    createdat: review.createdAt || review.createdat,
    updatedat: review.updatedAt || review.updatedat,
    team_id: review.team_id || review.teamId,
    team_name: review.team_name || review.team?.name,
    owner_id: review.owner_id || review.ownerId,
    owner_name: review.owner_name || review.owner?.name,
    item_count: review.item_count || (review.items ? review.items.length : 0)
  })) as OpsReview[];
}

export default function OpsReviewsPage() {
  const { currentOrg } = useOrganization();
  const { showToast } = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    data: reviews = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['opsReviews', currentOrg?.id],
    queryFn: () => currentOrg ? fetchOpsReviews(currentOrg.id) : [],
    enabled: !!currentOrg,
  });

  // Handle errors
  if (error) {
    console.error('Error fetching Ops Reviews:', error);
    showToast({
      title: 'Error',
      description: 'Failed to load Ops Reviews',
      type: 'destructive',
    });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Ops Reviews</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track and manage your operational reviews
          </p>
        </div>
        <Link
          href="/ops-reviews/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          New Ops Review
        </Link>
      </div>

      {reviews.length === 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No Ops Reviews</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new Ops Review.
            </p>
            <div className="mt-6">
              <Link
                href="/ops-reviews/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                New Ops Review
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {reviews.map((review) => (
              <li key={review.id}>
                <Link href={`/ops-reviews/${review.id}`} className="block hover:bg-gray-50">
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-blue-600 truncate">{review.title}</p>
                      <div className="ml-2 flex-shrink-0 flex">
                        <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {review.quarter} {review.year}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          <span className="truncate">Team: {review.team_name}</span>
                        </p>
                        {review.owner_name && (
                          <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                            <span className="truncate">Owner: {review.owner_name}</span>
                          </p>
                        )}
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <svg
                          className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>
                          <time dateTime={review.createdat}>
                            {new Date(review.createdat).toLocaleDateString()}
                          </time>
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
