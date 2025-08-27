'use client';

import { use } from 'react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/toast';

// Simple form components (matching new item page style)
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

interface TeamMember {
  id: string;
  user?: { name?: string | null; email?: string | null };
}

interface ApiTeamMember extends TeamMember {
  teamId: string;
}

interface OpsReviewItem {
  id: string;
  title: string;
  description: string | null;
  targetMetric: number | null;
  actualMetric: number | null;
  quarter: string;
  year: number;
  opsReviewId: string;
  teamId: string;
  ownerId: string | null;
  opsReview?: { id: string; title: string } | null;
  team?: { id: string; name: string } | null;
}

interface PageProps {
  params: Promise<{ id: string; itemId: string }>;
}

export default function EditOpsReviewItemPage({ params }: PageProps) {
  const { id, itemId } = use(params);
  const router = useRouter();
  const { showToast } = useToast();

  const [item, setItem] = useState<OpsReviewItem | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch the existing item
        const itemRes = await fetch(`/api/ops-reviews/${id}/items/${itemId}`);
        const itemJson = await itemRes.json();
        if (!itemRes.ok) throw new Error(itemJson?.error || 'Failed to load item');

        // Fetch team members for the item's team
        const teamMembersRes: ApiTeamMember[] = await fetch('/api/team-members').then(res => res.ok ? res.json() : []);
        const currentTeamMembers = teamMembersRes.filter(tm => tm.teamId === itemJson.teamId);

        setItem(itemJson as OpsReviewItem);
        setTeamMembers(currentTeamMembers);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        setError(msg);
        showToast({ title: 'Failed to load data', description: msg, type: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, itemId, showToast]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!item) return;

    const formData = new FormData(e.currentTarget);

    try {
      const response = await fetch(`/api/ops-reviews/${id}/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.get('title'),
          description: formData.get('description') || null,
          targetMetric: formData.get('targetMetric') ? Number(formData.get('targetMetric')) : null,
          actualMetric: formData.get('actualMetric') ? Number(formData.get('actualMetric')) : null,
          ownerId: formData.get('ownerId') || null,
          // teamId is fixed to the item's team
          teamId: item.teamId,
          // keep original period unless changed later
          quarter: item.quarter,
          year: item.year,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Failed to update item');

      showToast({ title: 'Item updated', description: 'Review item was updated successfully.' });
      router.push(`/ops-reviews/${id}/items/${itemId}`);
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
      showToast({ title: 'Failed to update item', description: msg, type: 'destructive' });
    }
  };

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
        <div className="text-center text-red-600">Error: {error}</div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center text-red-600">Item not found</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Link
          href={`/ops-reviews/${id}/items/${itemId}`}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          &larr; Back to Item
        </Link>
      </div>

      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Edit Review Item</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" name="title" required defaultValue={item.title} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="team">Team</Label>
              <div className="px-3 py-2 bg-gray-100 rounded-md text-sm text-gray-700">
                {item.team?.name || 'Team'}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ownerId">Owner</Label>
              <select
                id="ownerId"
                name="ownerId"
                defaultValue={item.ownerId || ''}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Unassigned</option>
                {teamMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.user?.name || member.user?.email || `Member ${member.id}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetMetric">Target Metric</Label>
              <Input
                id="targetMetric"
                name="targetMetric"
                type="number"
                step="0.01"
                defaultValue={item.targetMetric ?? ''}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="actualMetric">Actual Metric</Label>
              <Input
                id="actualMetric"
                name="actualMetric"
                type="number"
                step="0.01"
                defaultValue={item.actualMetric ?? ''}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              rows={4}
              defaultValue={item.description ?? ''}
            />
          </div>

          <div className="flex justify-end space-x-3">
            <Link
              href={`/ops-reviews/${id}/items/${itemId}`}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
