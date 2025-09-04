'use client';

import { useRouter } from 'next/navigation';
import { use } from 'react';
import { useToast } from '@/components/ui/toast';
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
  name: string | null;
  email: string | null;
  teamId?: string;
}

// API response shape for team members used on this page (flat fields from /api/team-members)
interface ApiTeamMember {
  id: string;
  name: string | null;
  email: string | null;
  role?: string | null;
  teamId?: string;
}

interface Review {
  id: string;
  title: string;
  teamId: string;
  quarter: string;
  year: number;
  teamName?: string | null;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function NewOpsReviewItemPage({ params }: PageProps) {
  const { id } = use(params);

  const [review, setReview] = useState<Review | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [allMembers, setAllMembers] = useState<ApiTeamMember[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { showToast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch review details
        const reviewRes = await fetch(`/api/ops-reviews/${id}`).then(res => res.json());
        if (reviewRes.error) throw new Error(reviewRes.error);
        
        // Fetch teams for select
        const teamsRes = await fetch('/api/teams');
        const teamsJson: Team[] = teamsRes.ok ? await teamsRes.json() : [];

        // Fetch all team members (flat)
        const teamMembersRes: ApiTeamMember[] = await fetch('/api/team-members').then(res => res.ok ? res.json() : []);

        // Filter team members for the current review's team
        const currentTeamMembers = teamMembersRes.filter((member) => member.teamId === reviewRes.teamId);

        setReview(reviewRes);
        setTeams(teamsJson);
        setAllMembers(teamMembersRes);
        setSelectedTeamId(reviewRes.teamId);
        setTeamMembers(currentTeamMembers as TeamMember[]);
        
      } catch (err) {
        setError('Failed to load data. Please try again.');
        console.error('Error fetching data:', err);
        showToast({ title: 'Failed to load data', description: err instanceof Error ? err.message : 'Unknown error', type: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, showToast]);

  // When team changes, filter members list
  useEffect(() => {
    if (!selectedTeamId) return;
    const filtered = allMembers.filter((m) => m.teamId === selectedTeamId);
    setTeamMembers(filtered);
  }, [selectedTeamId, allMembers]);

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
          quarter: review.quarter,
          year: review.year,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create item');
      }

      // Redirect back to the review page after successful creation
      router.push(`/ops-reviews/${id}`);
      router.refresh();
      showToast({ title: 'Item created', description: 'Review item was created successfully.' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create item');
      console.error('Error creating item:', err);
      showToast({ title: 'Failed to create item', description: err instanceof Error ? err.message : 'Unknown error', type: 'destructive' });
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
          {/* Title row */}
          <div className="space-y-1">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              name="title"
              required
              placeholder="Enter item title"
            />
            <p className="text-sm text-gray-500">What are you measuring?</p>
          </div>

          {/* Team and Owner row */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="teamId">Team</Label>
              <select
                id="teamId"
                name="teamId"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={selectedTeamId || ''}
                onChange={(e) => setSelectedTeamId(e.target.value)}
              >
                <option value="" disabled>
                  Select team
                </option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ownerId">Owner</Label>
              <select
                id="ownerId"
                name="ownerId"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                defaultValue=""
              >
                <option value="">Unassigned</option>
                {teamMembers.length === 0 ? (
                  <option value="" disabled>
                    No members in this team
                  </option>
                ) : (
                  teamMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name || member.email || `Member ${member.id}`}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Metrics row */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
