"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import type React from 'react';
import Link from 'next/link';
import type { Task } from '@prisma/client';
import { TaskList } from '@/components/TaskList';
import { useToast } from '@/components/ui/toast';
import { OrganizationForm } from '@/components/OrganizationForm';
import CEOGoals from '@/components/CEOGOALS';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import type { OrganizationWithBusinessUnits } from '@/types/prisma';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Tooltip } from '@/components/ui/tooltip';

type TaskWithNotes = Task & { notes: { id: string; content: string; createdAt?: Date }[] };
type Team = { id: string; name: string; description?: string | null };
type BusinessUnit = { id: string; name: string };
type Initiative = { id: string; name: string; releaseDate?: string | Date | null; owner?: { name?: string | null } | null; type?: 'CAPITALIZABLE' | 'OPERATIONAL_EFFICIENCY' | 'KTLO' | null };
type Kpi = { id: string; name: string; quarter: 'Q1'|'Q2'|'Q3'|'Q4'; year: number; initiativeId?: string | null; metTargetPercent?: number | null; forecastedRevenue?: number | null; actualRevenue?: number | null };

export default function DashboardPage() {
  const { currentOrg } = useOrganization();
  const [tasks, setTasks] = useState<TaskWithNotes[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationWithBusinessUnits[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Toast
  const { showToast } = useToast();

  // Organizations/Teams UI state (mirrors Organizations page)
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [editingOrg, setEditingOrg] = useState<OrganizationWithBusinessUnits | null>(null);
  const [orgTeams, setOrgTeams] = useState<Record<string, Team[]>>({});
  const [orgBusinessUnits, setOrgBusinessUnits] = useState<Record<string, BusinessUnit[]>>({});
  const [showCreateTeamForOrg, setShowCreateTeamForOrg] = useState<string | null>(null);
  const [editTeam, setEditTeam] = useState<{ orgId: string; team: Team } | null>(null);
  const [ceoGoals, setCeoGoals] = useState<{ id?: string; description: string }[]>([
    { description: '' },
    { description: '' },
    { description: '' },
    { description: '' },
    { description: '' },
  ]);

  // lifecycle helpers for fetch cancellation
  const isMounted = useRef(false);
  const abortController = useRef<AbortController | null>(null);
  const vtAbort = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      // cancel previous
      if (abortController.current) abortController.current.abort();
      abortController.current = new AbortController();

      const [tasksRes, orgsRes] = await Promise.all([
        fetch('/api/tasks', { cache: 'no-store', signal: abortController.current.signal }),
        fetch('/api/organizations', { cache: 'no-store', signal: abortController.current.signal }),
      ]);
      if (!tasksRes.ok) throw new Error('Failed to fetch tasks');
      if (!orgsRes.ok) throw new Error('Failed to fetch organizations');
      const [tasksData, orgsData] = await Promise.all([tasksRes.json(), orgsRes.json()]);
      if (isMounted.current) {
        setTasks(tasksData || []);
        setOrganizations(orgsData || []);
      }
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') {
        return;
      }
      setError(e instanceof Error ? e.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  // fetch business units for each org (for Value Tracker filter)
  const fetchBusinessUnits = useCallback(async (orgId: string) => {
    try {
      const res = await fetch(`/api/organizations/${orgId}/business-units`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch business units');
      const data: BusinessUnit[] = await res.json();
      setOrgBusinessUnits((prev) => ({ ...prev, [orgId]: data }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch business units');
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    void fetchData();
    return () => {
      isMounted.current = false;
      if (abortController.current) abortController.current.abort();
    };
  }, [fetchData]);

  // fetch teams for each org
  const fetchTeams = useCallback(async (orgId: string) => {
    try {
      const res = await fetch(`/api/organizations/${orgId}/teams`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch teams');
      const data: Team[] = await res.json();
      setOrgTeams((prev) => ({ ...prev, [orgId]: data }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch teams');
    }
  }, []);

  useEffect(() => {
    if (organizations.length > 0) {
      organizations.forEach((org) => {
        if (!orgTeams[org.id]) fetchTeams(org.id);
        if (!orgBusinessUnits[org.id]) fetchBusinessUnits(org.id);
      });
    }
  }, [organizations, orgTeams, orgBusinessUnits, fetchTeams, fetchBusinessUnits]);

  // Value Tracker state
  const [selectedBU, setSelectedBU] = useState<string | undefined>(undefined); // undefined means All
  const [selectedQuarter, setSelectedQuarter] = useState<'Q1'|'Q2'|'Q3'|'Q4'|'ALL'>('ALL');
  const [selectedYear, setSelectedYear] = useState<number | 'ALL'>('ALL');
  const [vtInitiatives, setVtInitiatives] = useState<Initiative[]>([]);
  const [vtKpis, setVtKpis] = useState<Kpi[]>([]);
  const [vtLoading, setVtLoading] = useState(false);

  // Removed inline BU creation UI/state

  // Fetch Value Tracker data
  const fetchValueTracker = useCallback(async (orgId?: string, buId?: string, q?: string | 'ALL', y?: number | 'ALL') => {
    if (!orgId) { setVtInitiatives([]); setVtKpis([]); return; }
    try {
      setVtLoading(true);
      if (vtAbort.current) vtAbort.current.abort();
      vtAbort.current = new AbortController();
      const paramsInitiatives = new URLSearchParams({ orgId });
      if (buId) paramsInitiatives.set('businessUnitId', buId);
      const paramsKpis = new URLSearchParams({ orgId });
      if (buId) paramsKpis.set('businessUnitId', buId);
      if (q && q !== 'ALL') paramsKpis.set('quarter', q);
      if (y && y !== 'ALL') paramsKpis.set('year', String(y));
      const [iRes, kRes] = await Promise.all([
        fetch(`/api/initiatives?${paramsInitiatives.toString()}`, { cache: 'no-store', signal: vtAbort.current.signal }),
        fetch(`/api/kpis?${paramsKpis.toString()}`, { cache: 'no-store', signal: vtAbort.current.signal }),
      ]);
      if (!iRes.ok) throw new Error('Failed to fetch initiatives');
      if (!kRes.ok) throw new Error('Failed to fetch KPIs');
      const [iData, kData] = await Promise.all([iRes.json(), kRes.json()]);
      setVtInitiatives(iData || []);
      setVtKpis(kData || []);
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return;
      setError(e instanceof Error ? e.message : 'Failed to load Value Tracker');
    } finally {
      setVtLoading(false);
    }
  }, []);

  // Trigger VT fetch when selections change or orgs/business units load
  useEffect(() => {
    const orgId = currentOrg?.id || organizations[0]?.id;
    void fetchValueTracker(orgId, selectedBU, selectedQuarter, selectedYear);
  }, [currentOrg, organizations, selectedBU, selectedQuarter, selectedYear, fetchValueTracker]);

  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const groupInitiativesByMonth = (items: Initiative[]) => {
    const groups: Record<string, Initiative[]> = {};
    items.forEach((it) => {
      const d = it.releaseDate ? new Date(it.releaseDate) : undefined;
      const key = d ? monthNames[d.getMonth()] : 'No Release Date';
      if (!groups[key]) groups[key] = [];
      groups[key].push(it);
    });
    // order by month order when possible, keep 'No Release Date' last
    const orderedKeys = Object.keys(groups).sort((a, b) => {
      if (a === 'No Release Date') return 1;
      if (b === 'No Release Date') return -1;
      return monthNames.indexOf(a) - monthNames.indexOf(b);
    });
    return { groups, orderedKeys };
  };

  // CRUD handlers copied from Organizations page
  const handleSaveOrganization = async (data: { name: string; description?: string }) => {
    try {
      let response: Response;
      if (editingOrg) {
        response = await fetch(`/api/organizations/${editingOrg.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      } else {
        response = await fetch('/api/organizations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      }
      if (!response.ok) throw new Error('Failed to save organization');
      await fetchData();
      setShowCreateOrg(false);
      setEditingOrg(null);
      showToast({ title: `Organization ${editingOrg ? 'updated' : 'created'}`, description: `${data.name} saved successfully.` });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save organization');
      showToast({ title: 'Failed to save organization', description: err instanceof Error ? err.message : 'Unknown error', type: 'destructive' });
    }
  };

  const handleCreateTeam = async (orgId: string, data: { name: string; description?: string }) => {
    try {
      const response = await fetch(`/api/organizations/${orgId}/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create team');
      await fetchTeams(orgId);
      setShowCreateTeamForOrg(null);
      showToast({ title: 'Team created', description: `${data.name} was added successfully.` });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create team');
      showToast({ title: 'Failed to create team', description: err instanceof Error ? err.message : 'Unknown error', type: 'destructive' });
    }
  };

  const handleUpdateTeam = async (orgId: string, teamId: string, data: { name: string; description?: string }) => {
    try {
      const response = await fetch(`/api/teams/${teamId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update team');
      await fetchTeams(orgId);
      setEditTeam(null);
      showToast({ title: 'Team updated', description: 'Changes were saved.' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update team');
      showToast({ title: 'Failed to update team', description: err instanceof Error ? err.message : 'Unknown error', type: 'destructive' });
    }
  };

  const handleDeleteTeam = async (orgId: string, teamId: string) => {
    if (!window.confirm('Are you sure you want to delete this team?')) return;
    try {
      const response = await fetch(`/api/teams/${teamId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete team');
      await fetchTeams(orgId);
      showToast({ title: 'Team deleted', description: 'Team was removed.' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete team');
      showToast({ title: 'Failed to delete team', description: err instanceof Error ? err.message : 'Unknown error', type: 'destructive' });
    }
  };

  const handleSaveCEOGoals = async (goals: { id?: string; description: string }[]) => {
    try {
      // TODO: Integrate API when available
      setCeoGoals(goals);
    } catch (error) {
      console.error('Failed to save CEO goals:', error);
      throw error;
    }
  };

  // Local TeamForm component (from Organizations page)
  const TeamForm = ({
    team,
    onSubmit,
    onCancel,
  }: {
    team?: Team;
    onSubmit: (data: { name: string; description?: string }) => Promise<void> | void;
    onCancel: () => void;
  }) => {
    const [name, setName] = useState(team?.name || '');
    const [description, setDescription] = useState(team?.description || '');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!name.trim()) return;
      try {
        setIsSubmitting(true);
        await onSubmit({ name, description: description || undefined });
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <form onSubmit={handleSubmit} className="mt-2 p-4 bg-gray-50 rounded-lg">
        <div className="space-y-3">
          <div>
            <label htmlFor="team-name" className="block text-sm font-medium text-gray-700">
              Team Name
            </label>
            <input
              type="text"
              id="team-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Enter team name"
            />
          </div>
          <div>
            <label htmlFor="team-description" className="block text-sm font-medium text-gray-700">
              Description (Optional)
            </label>
            <textarea
              id="team-description"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Enter team description"
            />
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Team'}
            </button>
          </div>
        </div>
      </form>
    );
  };

  const topOrg = organizations[0];
  const myTasks = tasks.slice(0, 5);

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {loading ? (
        <div className="min-h-[300px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* Organizations page content: CEO Goals + Organizations list */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* CEO Goals */}
            <div>
              <CEOGoals initialGoals={ceoGoals} onSave={handleSaveCEOGoals} />
            </div>

            {/* Organizations Section */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                <h1 className="text-xl font-semibold text-gray-900">My Organization</h1>
                <button
                  onClick={() => {
                    setEditingOrg(null);
                    setShowCreateOrg(true);
                  }}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  New Organization
                </button>
              </div>

              {organizations.length === 0 ? (
                <div className="text-center py-12">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Organizations</h3>
                  <p className="text-gray-500">Get started by creating your first organization.</p>
                  <button
                    onClick={() => setShowCreateOrg(true)}
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    New Organization
                  </button>
                </div>
              ) : (
                <div className="border-t border-gray-200">
                  <ul className="divide-y divide-gray-200">
                    {organizations.map((org) => (
                      <li key={org.id} className="group hover:bg-gray-50">
                        <div className="px-4 py-4 sm:px-6">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <Link
                                href={`/organizations/${org.id}`}
                                className="text-sm font-medium text-blue-600 hover:text-blue-900 truncate"
                              >
                                {org.name}
                              </Link>
                              {org.description && (
                                <p className="mt-1 text-sm text-gray-500 line-clamp-2">{org.description}</p>
                              )}
                            </div>
                            <div className="ml-4 flex-shrink-0 flex space-x-2 opacity-0 group-hover:opacity-100">
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  setEditingOrg(org);
                                  setShowCreateOrg(true);
                                }}
                                className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                title="Edit organization"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={async (e) => {
                                  e.preventDefault();
                                  if (window.confirm(`Are you sure you want to delete "${org.name}"?`)) {
                                    try {
                                      const response = await fetch(`/api/organizations/${org.id}`, { method: 'DELETE' });
                                      if (!response.ok) throw new Error('Failed to delete organization');
                                      await fetchData();
                                      showToast({ title: 'Organization deleted', description: `${org.name} was removed.` });
                                    } catch (err) {
                                      setError(err instanceof Error ? err.message : 'Failed to delete organization');
                                      showToast({ title: 'Failed to delete organization', description: err instanceof Error ? err.message : 'Unknown error', type: 'destructive' });
                                    }
                                  }
                                }}
                                className="p-1 rounded-full text-gray-400 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                title="Delete organization"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          {/* Teams Section */}
                          <div className="mt-4">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Teams</h4>
                              <button
                                onClick={() => setShowCreateTeamForOrg(org.id)}
                                className="text-xs text-blue-600 hover:text-blue-800"
                                title="Add team"
                              >
                                + Add Team
                              </button>
                            </div>

                            {/* Create Team Form */}
                            {showCreateTeamForOrg === org.id && (
                              <TeamForm
                                onSubmit={(data) => handleCreateTeam(org.id, data)}
                                onCancel={() => setShowCreateTeamForOrg(null)}
                              />
                            )}

                            {/* Edit Team Form */}
                            {editTeam?.orgId === org.id && editTeam.team && (
                              <TeamForm
                                team={editTeam.team}
                                onSubmit={(data) => handleUpdateTeam(org.id, editTeam.team.id, data)}
                                onCancel={() => setEditTeam(null)}
                              />
                            )}

                            {/* Teams List */}
                            {orgTeams[org.id]?.length > 0 && (
                              <ul className="mt-2 space-y-2">
                                {orgTeams[org.id].map((team) => (
                                  <li key={team.id} className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded-md">
                                    <div>
                                      <Link href={`/teams/${team.id}`} className="text-sm font-medium text-blue-600 hover:underline">
                                        {team.name}
                                      </Link>
                                      {team.description && <p className="text-xs text-gray-500 mt-1">{team.description}</p>}
                                    </div>
                                    <div className="flex space-x-2">
                                      <button
                                        onClick={() => setEditTeam({ orgId: org.id, team })}
                                        className="text-gray-400 hover:text-blue-600"
                                        title="Edit team"
                                      >
                                        <PencilIcon className="h-3.5 w-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteTeam(org.id, team.id)}
                                        className="text-gray-400 hover:text-red-600"
                                        title="Delete team"
                                      >
                                        <TrashIcon className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Create/Edit Organization Modal */}
          {showCreateOrg && (
            <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
              {/* Backdrop */}
              <div className="fixed inset-0 bg-gray-500/75" aria-hidden="true"></div>

              {/* Dialog content wrapper */}
              <div className="flex min-h-full items-center justify-center p-4 text-center">
                <div className="relative z-50 w-full sm:max-w-lg text-left align-middle">
                  <div className="overflow-hidden rounded-lg bg-white p-6 shadow-xl">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">{editingOrg ? 'Edit Organization' : 'Create Organization'}</h3>
                    <div className="mt-4">
                      <OrganizationForm
                        organization={editingOrg || undefined}
                        onSubmit={handleSaveOrganization}
                        onCancel={() => {
                          setShowCreateOrg(false);
                          setEditingOrg(null);
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Removed duplicated summary row to avoid double content on Home */}

          {/* Value Tracker */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Value Tracker</h2>
            </div>
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Unit</label>
                <select
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  value={selectedBU || ''}
                  onChange={(e) => setSelectedBU(e.target.value || undefined)}
                >
                  <option value="">All Business Units</option>
                  {(currentOrg?.id || organizations[0]?.id) && orgBusinessUnits[(currentOrg?.id || organizations[0]?.id) as string]?.map((bu) => (
                    <option key={bu.id} value={bu.id}>{bu.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quarter</label>
                <select
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  value={selectedQuarter}
                  onChange={(e) => setSelectedQuarter((e.target.value || 'ALL') as any)}
                >
                  <option value="">All</option>
                  <option value="Q1">Q1</option>
                  <option value="Q2">Q2</option>
                  <option value="Q3">Q3</option>
                  <option value="Q4">Q4</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <select
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  value={selectedYear === 'ALL' ? '' : String(selectedYear)}
                  onChange={(e) => {
                    const v = e.target.value;
                    setSelectedYear(v ? parseInt(v, 10) : 'ALL');
                  }}
                >
                  <option value="">All</option>
                  {Array.from({ length: 7 }).map((_, idx) => {
                    const y = new Date().getFullYear() - 3 + idx;
                    return <option key={y} value={y}>{y}</option>;
                  })}
                </select>
              </div>
            </div>

            {vtLoading ? (
              <div className="min-h-[120px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Initiatives by Release Month */}
                <div>
                  <h3 className="text-md font-semibold mb-2">Initiatives by Release Month</h3>
                  {vtInitiatives.length === 0 ? (
                    <p className="text-gray-500">No initiatives for the selected Business Unit.</p>
                  ) : (
                    (() => {
                      const { groups, orderedKeys } = groupInitiativesByMonth(vtInitiatives);
                      return (
                        <div className="space-y-3">
                          {orderedKeys.map((month) => (
                            <div key={month} className="border rounded-md">
                              <div className="px-3 py-2 bg-gray-50 font-medium">{month}</div>
                              <ul className="divide-y">
                                {groups[month].map((i) => (
                                  <li key={i.id} className="px-3 py-2 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Link href={`/initiatives/${i.id}`} className="text-sm text-blue-600 hover:underline">
                                        {i.name}
                                      </Link>
                                      {i.type && (
                                        <Tooltip
                                          content={`Initiative Type: ${
                                            i.type === 'CAPITALIZABLE'
                                              ? 'Capitalizable'
                                              : i.type === 'OPERATIONAL_EFFICIENCY'
                                              ? 'Operational Efficiency'
                                              : 'KTLO'
                                          }`}
                                          side="top"
                                        >
                                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 border">
                                            {i.type === 'CAPITALIZABLE' && 'Capitalizable'}
                                            {i.type === 'OPERATIONAL_EFFICIENCY' && 'Operational Efficiency'}
                                            {i.type === 'KTLO' && 'KTLO'}
                                          </span>
                                        </Tooltip>
                                      )}
                                    </div>
                                    <span className="text-xs text-gray-500">{i.owner?.name || ''}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      );
                    })()
                  )}
                </div>

                {/* KPIs for selection */}
                <div>
                  <h3 className="text-md font-semibold mb-2">KPIs</h3>
                  {vtKpis.length === 0 ? (
                    <p className="text-gray-500">No KPIs for the selected filters.</p>
                  ) : (
                    <ul className="divide-y rounded-md border">
                      {vtKpis.map((k) => (
                        <li key={k.id} className="px-3 py-2">
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                              <span className="text-sm text-gray-800">{k.name}</span>
                              {typeof k.metTargetPercent === 'number' && (
                                <span className="text-xs text-gray-600">% to Target: {k.metTargetPercent.toFixed(0)}%</span>
                              )}
                              <div className="text-xs text-gray-600 mt-0.5">
                                <span className="mr-3">Forecasted: {k.forecastedRevenue ?? '—'}</span>
                                <span>Actual: {k.actualRevenue ?? '—'}</span>
                              </div>
                              {typeof k.forecastedRevenue === 'number' && typeof k.actualRevenue === 'number' && k.forecastedRevenue !== 0 && (
                                <Tooltip
                                  content={`${((k.actualRevenue / k.forecastedRevenue) * 100).toFixed(0)}% of forecast (${k.actualRevenue} / ${k.forecastedRevenue})`}
                                  side="top"
                                >
                                  <div className="mt-1 w-40 bg-gray-100 rounded h-2 overflow-hidden">
                                    <div
                                      className="bg-green-500 h-2"
                                      style={{ width: `${Math.min(100, (k.actualRevenue / k.forecastedRevenue) * 100).toFixed(0)}%` }}
                                    />
                                  </div>
                                </Tooltip>
                              )}
                            </div>
                            <span className="text-xs text-gray-500">{k.quarter} {k.year}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* My Tasks */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">My Tasks</h2>
              <Link href="/tasks" className="text-sm text-blue-600 hover:text-blue-700">
                Open Tasks
              </Link>
            </div>
            {myTasks.length > 0 ? (
              <TaskList tasks={myTasks as any} onTaskClick={() => { /* no-op on home */ }} />
            ) : (
              <p className="text-gray-500">No tasks yet.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}