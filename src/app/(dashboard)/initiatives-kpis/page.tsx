'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useOrganization } from '@/contexts/OrganizationContext';

function useInitiatives(params: { orgId?: string; ownerId?: string; businessUnitId?: string }) {
  const { orgId, ownerId, businessUnitId } = params;
  return useQuery({
    queryKey: ['initiatives', orgId, ownerId, businessUnitId],
    queryFn: async () => {
      const search = new URLSearchParams();
      if (orgId) search.set('orgId', orgId);
      if (ownerId) search.set('ownerId', ownerId);
      if (businessUnitId) search.set('businessUnitId', businessUnitId);
      const res = await fetch(`/api/initiatives?${search.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch initiatives');
      return res.json();
    },
    // Initiatives should load even without org selection
    enabled: true,
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

export default function InitiativesAndKpisPage() {
  const { currentOrg } = useOrganization();

  // Initiatives filters
  const [initFilters, setInitFilters] = useState<{ year: number | null; quarter: string | null; ownerId: string; businessUnitId: string }>(
    { year: null, quarter: null, ownerId: '', businessUnitId: '' }
  );

  // KPIs filters
  const [kpiFilters, setKpiFilters] = useState<{ teamId: string; quarter: string | null; year: number | null }>(
    { teamId: '', quarter: null, year: null }
  );

  const { data: initiatives = [], isLoading: initsLoading } = useInitiatives({
    orgId: currentOrg?.id,
    ownerId: initFilters.ownerId || undefined,
    businessUnitId: initFilters.businessUnitId || undefined,
  });
  const { data: members = [], isLoading: membersLoading } = useTeamMembers();
  const { data: kpis = [], isLoading: kpisLoading } = useKpis({
    orgId: currentOrg?.id,
    teamId: kpiFilters.teamId || undefined,
    quarter: kpiFilters.quarter,
    year: kpiFilters.year,
  });

  const years = useMemo(() => Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i), []);
  const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];

  // Owner filter should list all members (not scoped to current org)
  const allMembers = useMemo(() => (members || []), [members]);

  // Load all organizations and their business units to populate BU filter
  const [allBusinessUnits, setAllBusinessUnits] = useState<Array<{ id: string; name: string; orgId: string }>>([]);
  useEffect(() => {
    let aborted = false;
    const loadBUs = async () => {
      try {
        const orgRes = await fetch('/api/organizations', { cache: 'no-store' });
        if (!orgRes.ok) throw new Error('Failed to fetch organizations');
        const orgs: Array<{ id: string; name: string }> = await orgRes.json();
        const buLists = await Promise.all(
          orgs.map(async (o) => {
            const buRes = await fetch(`/api/organizations/${o.id}/business-units`, { cache: 'no-store' });
            if (!buRes.ok) return [] as any[];
            const bus: Array<{ id: string; name: string }> = await buRes.json();
            return bus.map((b) => ({ id: b.id, name: b.name, orgId: o.id }));
          })
        );
        if (!aborted) setAllBusinessUnits(buLists.flat());
      } catch {
        if (!aborted) setAllBusinessUnits([]);
      }
    };
    void loadBUs();
    return () => {
      aborted = true;
    };
  }, []);

  // Client-side filtered initiatives
  const filteredInitiatives = useMemo(() => {
    return (initiatives || []).filter((i: any) => {
      if (initFilters.year) {
        if (!i.releaseDate) return false;
        const y = new Date(i.releaseDate).getFullYear();
        if (y !== initFilters.year) return false;
      }
      if (initFilters.quarter) {
        if (!i.releaseDate) return false;
        const m = new Date(i.releaseDate).getMonth();
        const q = m <= 2 ? 'Q1' : m <= 5 ? 'Q2' : m <= 8 ? 'Q3' : 'Q4';
        if (q !== initFilters.quarter) return false;
      }
      if (initFilters.ownerId && i.ownerId !== initFilters.ownerId) return false;
      return true;
    });
  }, [initiatives, initFilters]);

  // Build active filters summary for banner
  const initActiveFilterParts = useMemo(() => {
    const parts: string[] = [];
    if (initFilters.year) parts.push(`Year: ${initFilters.year}`);
    if (initFilters.quarter) parts.push(`Quarter: ${initFilters.quarter}`);
    if (initFilters.ownerId) {
      const owner = allMembers.find((m: any) => m.id === initFilters.ownerId);
      const ownerName = owner ? (owner.user?.name || owner.name || owner.email || owner.id) : initFilters.ownerId;
      parts.push(`Owner: ${ownerName}`);
    }
    if (initFilters.businessUnitId) {
      const bu = allBusinessUnits.find((b) => b.id === initFilters.businessUnitId);
      parts.push(`Business Unit: ${bu?.name || initFilters.businessUnitId}`);
    }
    return parts;
  }, [initFilters, allMembers, allBusinessUnits]);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Initiatives & KPIs</h1>
          {currentOrg && <p className="mt-1 text-sm text-gray-500">Overview for {currentOrg.name}</p>}
        </div>
        <div className="flex gap-2">
          <Link href="/initiatives/new" className="inline-flex items-center px-3 py-2 text-sm rounded-md text-white bg-blue-600 hover:bg-blue-700">New Initiative</Link>
          <Link href="/kpis/new" className="inline-flex items-center px-3 py-2 text-sm rounded-md text-white bg-blue-600 hover:bg-blue-700">New KPI</Link>
        </div>
      </div>

      {/* Initiatives section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Initiatives</h2>
          <Link href="/initiatives" className="text-sm text-blue-600 hover:underline">View all</Link>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-3">FILTERS</h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="init-year">Year</label>
              <select id="init-year" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" value={initFilters.year || 'all'} onChange={(e) => setInitFilters((f) => ({ ...f, year: e.target.value === 'all' ? null : parseInt(e.target.value) }))}>
                <option value="all">All Years</option>
                {years.map((y) => (<option key={y} value={y}>{y}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="init-quarter">Quarter</label>
              <select id="init-quarter" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" value={initFilters.quarter || 'all'} onChange={(e) => setInitFilters((f) => ({ ...f, quarter: e.target.value === 'all' ? null : e.target.value }))}>
                <option value="all">All Quarters</option>
                {quarters.map((q) => (<option key={q} value={q}>{q}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="init-owner">Owner</label>
              <select id="init-owner" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" value={initFilters.ownerId || 'all'} onChange={(e) => setInitFilters((f) => ({ ...f, ownerId: e.target.value === 'all' ? '' : e.target.value }))} disabled={membersLoading}>
                <option value="all">All Owners</option>
                {allMembers.map((m: any) => (
                  <option key={m.id} value={m.id}>
                    {(m.user?.name || m.name) + (m.team?.name ? ` — ${m.team.name}` : '')}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="init-bu">Business Unit</label>
              <select
                id="init-bu"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                value={initFilters.businessUnitId || 'all'}
                onChange={(e) => setInitFilters((f) => ({ ...f, businessUnitId: e.target.value === 'all' ? '' : e.target.value }))}
              >
                <option value="all">All Business Units</option>
                {allBusinessUnits.map((bu) => (
                  <option key={bu.id} value={bu.id}>{bu.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {initActiveFilterParts.length > 0 && (
          <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800 text-sm">
            <span className="font-medium">Active filters:</span>
            <span className="ml-1">{initActiveFilterParts.join(' • ')}</span>
            {Array.isArray(initiatives) && initiatives.length > filteredInitiatives.length && (
              <span className="ml-2">({initiatives.length - filteredInitiatives.length} hidden)</span>
            )}
          </div>
        )}

        {initsLoading ? (
          <div className="flex items-center justify-center min-h-[160px]"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div></div>
        ) : filteredInitiatives.length === 0 ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6 text-center">
              <h3 className="mt-2 text-sm font-medium text-gray-900">No Initiatives</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new initiative.</p>
              <div className="mt-6">
                <Link href="/initiatives/new" className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">New Initiative</Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {filteredInitiatives.map((i: any) => (
                <li key={i.id}>
                  <Link href={`/initiatives/${i.id}`} className="block hover:bg-gray-50">
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-blue-600 truncate">{i.name}</p>
                        {i.releaseDate && (
                          <p className="ml-2 text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">Releases {new Date(i.releaseDate).toLocaleDateString()}</p>
                        )}
                      </div>
                      {i.summary && (<p className="mt-2 text-sm text-gray-500 line-clamp-2">{i.summary}</p>)}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* KPIs section (still org-scoped) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">KPIs</h2>
          <Link href="/kpis" className="text-sm text-blue-600 hover:underline">View all</Link>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-3">FILTERS</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="kpi-year">Year</label>
              <select id="kpi-year" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" value={kpiFilters.year || 'all'} onChange={(e) => setKpiFilters((f) => ({ ...f, year: e.target.value === 'all' ? null : parseInt(e.target.value) }))}>
                <option value="all">All Years</option>
                {years.map((y) => (<option key={y} value={y}>{y}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="kpi-quarter">Quarter</label>
              <select id="kpi-quarter" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" value={kpiFilters.quarter || 'all'} onChange={(e) => setKpiFilters((f) => ({ ...f, quarter: e.target.value === 'all' ? null : e.target.value }))}>
                <option value="all">All Quarters</option>
                {quarters.map((q) => (<option key={q} value={q}>{q}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="kpi-team">Team</label>
              <input id="kpi-team" placeholder="Filter by team ID" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" value={kpiFilters.teamId} onChange={(e) => setKpiFilters((f) => ({ ...f, teamId: e.target.value }))} />
            </div>
          </div>
        </div>

        {!currentOrg ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6 text-center">
              <h3 className="mt-2 text-sm font-medium text-gray-900">Select an organization to view KPIs</h3>
              <p className="mt-1 text-sm text-gray-500">KPIs are scoped to a specific organization.</p>
            </div>
          </div>
        ) : kpisLoading ? (
          <div className="flex items-center justify-center min-h-[160px]"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div></div>
        ) : kpis.length === 0 ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6 text-center">
              <h3 className="mt-2 text-sm font-medium text-gray-900">No KPIs</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new KPI.</p>
              <div className="mt-6">
                <Link href="/kpis/new" className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">New KPI</Link>
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
                          <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">{k.quarter} {k.year}</p>
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-gray-500"><span className="truncate">Team: {k.team?.name || '—'}</span></p>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0"><span>Target: {k.targetMetric ?? '—'} • Actual: {k.actualMetric ?? '—'}</span></div>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
