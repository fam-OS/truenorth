'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useOrganization } from '@/contexts/OrganizationContext';

function useKpis(params: { orgId?: string; teamId?: string; quarter?: string | null; year?: number | null }) {
  const { orgId, teamId, quarter, year } = params;
  return useQuery({
    queryKey: ['kpis', orgId, teamId, quarter, year],
    queryFn: async () => {
      if (!orgId) return [] as any[];
      const search = new URLSearchParams({ orgId });
      if (teamId) search.set('teamId', teamId);
      if (quarter) search.set('quarter', quarter);
      if (year) search.set('year', String(year));
      const res = await fetch(`/api/kpis?${search}`);
      if (!res.ok) throw new Error('Failed to fetch KPIs');
      return res.json();
    },
    enabled: !!orgId,
  });
}

function useTeams() {
  return useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const res = await fetch('/api/teams');
      if (!res.ok) throw new Error('Failed to fetch teams');
      return res.json();
    },
  });
}

export default function KpisPage() {
  const { currentOrg } = useOrganization();
  const [filters, setFilters] = useState<{ teamId: string; quarter: string | null; year: number | null }>({
    teamId: '',
    quarter: null,
    year: new Date().getFullYear(),
  });

  const { data: kpis = [], isLoading } = useKpis({
    orgId: currentOrg?.id,
    teamId: filters.teamId || undefined,
    quarter: filters.quarter,
    year: filters.year,
  });
  const { data: teams = [], isLoading: teamsLoading } = useTeams();

  const years = useMemo(() => Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i), []);
  const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold">KPIs</h1>
          <p className="mt-1 text-sm text-gray-500">Key performance indicators{currentOrg ? ` for ${currentOrg.name}` : ''}</p>
        </div>
        <Link
          href="/kpis/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          New KPI
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <h2 className="text-sm font-medium text-gray-500 mb-3">FILTERS</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="year">Year</label>
            <select id="year" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" value={filters.year || 'all'} onChange={(e) => setFilters((f) => ({ ...f, year: e.target.value === 'all' ? null : parseInt(e.target.value) }))}>
              <option value="all">All Years</option>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="quarter">Quarter</label>
            <select id="quarter" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" value={filters.quarter || 'all'} onChange={(e) => setFilters((f) => ({ ...f, quarter: e.target.value === 'all' ? null : e.target.value }))}>
              <option value="all">All Quarters</option>
              {quarters.map((q) => (
                <option key={q} value={q}>{q}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="team">Team</label>
            <select
              id="team"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              value={filters.teamId || 'all'}
              onChange={(e) => setFilters((f) => ({ ...f, teamId: e.target.value === 'all' ? '' : e.target.value }))}
              disabled={teamsLoading}
            >
              <option value="all">All Teams</option>
              {(teams || []).map((t: any) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : kpis.length === 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6 text-center">
            <h3 className="mt-2 text-sm font-medium text-gray-900">No KPIs</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new KPI.</p>
            <div className="mt-6">
              <Link href="/kpis/new" className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                New KPI
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {kpis.map((k: any) => (
              <li key={k.id}>
                <Link href={`/kpis/${k.id}`} className="block hover:bg-gray-50">
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-blue-600 truncate">{k.name}</p>
                      <div className="ml-2 flex-shrink-0 flex">
                        <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {k.quarter} {k.year}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 space-y-2">
                      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                        <span className="truncate">Team: {k.Team?.name || '—'}</span>
                        {/* KPI Type */}
                        {k.kpiType && (
                          <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs">
                            {k.kpiType === 'QUALITATIVE' ? 'Qualitative' : 'Quantitative'}
                          </span>
                        )}
                        {/* Revenue Impacting */}
                        {typeof k.revenueImpacting === 'boolean' && (
                          <span className={`px-2 py-0.5 rounded-full text-xs ${k.revenueImpacting ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'}`}>
                            {k.revenueImpacting ? 'Revenue Impacting' : 'Not Revenue Impacting'}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {(k.KpiBusinessUnit || []).map((j: any) => (
                          <span key={j.businessUnitId} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                            {j.BusinessUnit?.name || 'Business Unit'}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <span>Target: {k.targetMetric ?? '—'} • Actual: {k.actualMetric ?? '—'}</span>
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
