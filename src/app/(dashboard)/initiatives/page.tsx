'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Button } from '@/components/ui/button';

function useInitiatives(params: { orgId?: string; ownerId?: string }) {
  const { orgId, ownerId } = params;
  return useQuery({
    queryKey: ['initiatives', orgId, ownerId],
    queryFn: async () => {
      if (!orgId) return [] as any[];
      const search = new URLSearchParams({ orgId });
      if (ownerId) search.set('ownerId', ownerId);
      const res = await fetch(`/api/initiatives?${search.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch initiatives');
      return res.json();
    },
    enabled: !!orgId,
  });
}

function useTeamMembers() {
  return useQuery({
    queryKey: ['team-members'],
    queryFn: async () => {
      const res = await fetch('/api/team-members');
      if (!res.ok) throw new Error('Failed to fetch team members');
      return res.json();
    },
  });
}

export default function InitiativesPage() {
  const { currentOrg } = useOrganization();
  const [filters, setFilters] = useState<{ year: number | null; quarter: string | null; ownerId: string }>(
    { year: null, quarter: null, ownerId: '' }
  );

  const { data: initiatives = [], isLoading } = useInitiatives({ orgId: currentOrg?.id, ownerId: filters.ownerId || undefined });
  const { data: members = [], isLoading: membersLoading } = useTeamMembers();

  // Narrow members to current organization
  const orgMembers = useMemo(() => {
    if (!currentOrg) return [] as any[];
    return (members || []).filter((m: any) => m.team?.organization?.id === currentOrg.id);
  }, [members, currentOrg]);

  const years = useMemo(() => Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i), []);
  const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];

  // Client-side filter since API doesn't accept year/quarter; use releaseDate
  const filtered = useMemo(() => {
    return (initiatives || []).filter((i: any) => {
      // Year filter based on releaseDate year (if present). If no releaseDate, exclude when year filter is set.
      if (filters.year) {
        if (!i.releaseDate) return false;
        const y = new Date(i.releaseDate).getFullYear();
        if (y !== filters.year) return false;
      }
      // Quarter filter based on releaseDate month -> quarter
      if (filters.quarter) {
        if (!i.releaseDate) return false;
        const m = new Date(i.releaseDate).getMonth(); // 0..11
        const q = m <= 2 ? 'Q1' : m <= 5 ? 'Q2' : m <= 8 ? 'Q3' : 'Q4';
        if (q !== filters.quarter) return false;
      }
      // Owner filter (exact ownerId match)
      if (filters.ownerId && i.ownerId !== filters.ownerId) return false;
      return true;
    });
  }, [initiatives, filters]);

  if (!currentOrg) {
    return <p className="p-6 text-sm text-gray-500">Select an organization to view initiatives.</p>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 animate-fade-in-up">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold">Initiatives</h1>
          <p className="mt-1 text-sm text-gray-500">Strategic initiatives for {currentOrg.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={{
              pathname: '/api/reports/initiatives',
              query: {
                orgId: currentOrg.id,
                ...(filters.ownerId ? { ownerId: filters.ownerId } : {}),
              },
            } as any}
            prefetch={false}
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
          >
            Export CSV
          </Link>
          <Button asChild variant="gradient">
            <Link href="/initiatives/new">New Initiative</Link>
          </Button>
        </div>
      </div>

      {/* Filters (match KPIs: Year, Quarter, plus Owner lookup) */}
      <div className="card p-4 mb-6">
        <h2 className="text-sm font-medium text-gray-500 mb-3">FILTERS</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="year">Year</label>
            <select
              id="year"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              value={filters.year || 'all'}
              onChange={(e) => setFilters((f) => ({ ...f, year: e.target.value === 'all' ? null : parseInt(e.target.value) }))}
            >
              <option value="all">All Years</option>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="quarter">Quarter</label>
            <select
              id="quarter"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              value={filters.quarter || 'all'}
              onChange={(e) => setFilters((f) => ({ ...f, quarter: e.target.value === 'all' ? null : e.target.value }))}
            >
              <option value="all">All Quarters</option>
              {quarters.map((q) => (
                <option key={q} value={q}>{q}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="owner">Owner</label>
            <select
              id="owner"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              value={filters.ownerId || 'all'}
              onChange={(e) => setFilters((f) => ({ ...f, ownerId: e.target.value === 'all' ? '' : e.target.value }))}
              disabled={membersLoading}
            >
              <option value="all">All Owners</option>
              {orgMembers.map((m: any) => (
                <option key={m.id} value={m.id}>
                  {m.user?.name || m.name} {m.team?.name ? `— ${m.team.name}` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card overflow-hidden">
          <div className="px-4 py-5 sm:p-6 text-center">
            <h3 className="mt-2 text-sm font-medium text-gray-900">No Initiatives</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new initiative.</p>
            <div className="mt-6">
              <Button asChild variant="gradient">
                <Link href="/initiatives/new">New Initiative</Link>
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {filtered.map((i: any) => (
              <li key={i.id}>
                <Link href={`/initiatives/${i.id}`} className="block hover:bg-gray-50">
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-blue-600 truncate">{i.name}</p>
                      {i.releaseDate && (
                        <p className="ml-2 text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                          Releases {new Date(i.releaseDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    {i.summary && (
                      <p className="mt-2 text-sm text-gray-500 line-clamp-2">{i.summary}</p>
                    )}
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
