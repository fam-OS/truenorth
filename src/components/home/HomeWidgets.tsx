'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

type Initiative = {
  id: string;
  name: string;
  status?: 'NOT_STARTED' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | null;
};

type TeamMemberLite = {
  id: string;
  name: string;
  role: string | null;
  lastOneOnOneAt: string | null; // ISO
};

type Kpi = {
  id: string;
  name: string;
  targetMetric: number | null;
  actualMetric: number | null;
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  year: number;
  Team?: { name?: string } | null;
};

export default function HomeWidgets() {
  const { currentOrg } = useOrganization();

  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [initiativesLoading, setInitiativesLoading] = useState(false);

  const [members, setMembers] = useState<TeamMemberLite[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  const [kpis, setKpis] = useState<Kpi[]>([]);
  const [kpisLoading, setKpisLoading] = useState(false);

  // Load Initiatives by org
  useEffect(() => {
    let active = true;
    async function load() {
      if (!currentOrg?.id) return;
      setInitiativesLoading(true);
      try {
        const res = await fetch(`/api/initiatives?orgId=${encodeURIComponent(currentOrg.id)}`);
        if (res.ok) {
          const data = await res.json();
          if (active) setInitiatives(data || []);
        }
      } finally {
        if (active) setInitiativesLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [currentOrg?.id]);

  // Load company-wide team members (with lastOneOnOneAt)
  useEffect(() => {
    let active = true;
    async function load() {
      setMembersLoading(true);
      try {
        const res = await fetch('/api/team-members');
        if (res.ok) {
          const data = await res.json();
          if (active) setMembers(data || []);
        }
      } finally {
        if (active) setMembersLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, []);

  // Load KPIs by org
  useEffect(() => {
    let active = true;
    async function load() {
      if (!currentOrg?.id) return;
      setKpisLoading(true);
      try {
        const res = await fetch(`/api/kpis?orgId=${encodeURIComponent(currentOrg.id)}`);
        if (res.ok) {
          const data = await res.json();
          if (active) setKpis(data || []);
        }
      } finally {
        if (active) setKpisLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [currentOrg?.id]);

  const initiativeStatusCounts = useMemo(() => {
    const counts: Record<string, number> = { NOT_STARTED: 0, IN_PROGRESS: 0, ON_HOLD: 0, COMPLETED: 0 };
    for (const i of initiatives) {
      const key = i.status || 'NOT_STARTED';
      counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
  }, [initiatives]);

  function daysSince(dateIso: string | null): number | null {
    if (!dateIso) return null;
    const then = new Date(dateIso).getTime();
    const now = Date.now();
    return Math.floor((now - then) / (1000 * 60 * 60 * 24));
  }

  const overdueOneOnOnes = useMemo(() => {
    return (members || [])
      .map((m) => ({ ...m, days: daysSince(m.lastOneOnOneAt) }))
      .filter((m) => m.days === null || (m.days !== null && m.days >= 7))
      .sort((a, b) => (b.days ?? 9999) - (a.days ?? 9999));
  }, [members]);

  const kpiSummaries = useMemo(() => {
    return (kpis || [])
      .map((k) => {
        const target = k.targetMetric ?? 0;
        const actual = k.actualMetric ?? 0;
        const diff = actual - target;
        const pct = target > 0 ? Math.round((actual / target) * 100) : null;
        return { ...k, target, actual, diff, pct };
      })
      .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
      .slice(0, 6);
  }, [kpis]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Initiatives by Status */}
      <Card role="button" onClick={() => { window.location.href = '/initiatives-kpis'; }} className="cursor-pointer hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle>Initiatives by Status</CardTitle>
        </CardHeader>
        <CardContent>
          {(!currentOrg?.id) ? (
            <div className="text-sm text-gray-500">Select an organization to view initiatives.</div>
          ) : initiativesLoading ? (
            <div className="text-sm text-gray-500">Loading initiatives…</div>
          ) : initiatives.length === 0 ? (
            <div className="text-sm text-gray-500">No initiatives yet. <Link className="text-blue-600 underline" href="/initiatives/new">Create one</Link>.</div>
          ) : (
            <div className="space-y-3">
              {([
                { key: 'NOT_STARTED', label: 'Not Started', color: 'bg-gray-200 text-gray-800' },
                { key: 'IN_PROGRESS', label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
                { key: 'ON_HOLD', label: 'On Hold', color: 'bg-yellow-100 text-yellow-800' },
                { key: 'COMPLETED', label: 'Completed', color: 'bg-green-100 text-green-800' },
              ] as const).map(({ key, label, color }) => (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${color}`}>{label}</span>
                  </div>
                  <div className="text-sm font-medium">{initiativeStatusCounts[key] || 0}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Last 1:1 > 1 week */}
      <Card>
        <CardHeader>
          <CardTitle>1:1s Overdue</CardTitle>
        </CardHeader>
        <CardContent>
          {membersLoading ? (
            <div className="text-sm text-gray-500">Loading team…</div>
          ) : overdueOneOnOnes.length === 0 ? (
            <div className="text-sm text-green-700">All caught up on 1:1s! 🎉</div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {overdueOneOnOnes.map((m) => (
                <li key={m.id} className="py-2 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      <Link href={`/team-members/${m.id}`} className="hover:underline">{m.name}</Link>
                    </div>
                    <div className="text-xs text-gray-500">{m.role || '—'}</div>
                  </div>
                  <div className={`text-xs ${m.days && m.days > 14 ? 'text-red-600' : 'text-yellow-700'}`}>
                    {m.lastOneOnOneAt ? `${m.days}d ago` : 'Never'}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* KPIs: Target vs Actual */}
      <Card>
        <CardHeader>
          <CardTitle>KPIs — Target vs Actual</CardTitle>
        </CardHeader>
        <CardContent>
          {(!currentOrg?.id) ? (
            <div className="text-sm text-gray-500">Select an organization to view KPIs.</div>
          ) : kpisLoading ? (
            <div className="text-sm text-gray-500">Loading KPIs…</div>
          ) : kpis.length === 0 ? (
            <div className="text-sm text-gray-500">No KPIs yet. <Link className="text-blue-600 underline" href="/kpis/new">Create one</Link>.</div>
          ) : (
            <ul className="space-y-3">
              {kpiSummaries.map((k) => {
                const pct = k.pct ?? 0;
                const good = pct >= 100;
                return (
                  <li key={k.id} className="border rounded p-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-gray-900 truncate pr-2">
                        <Link href={`/kpis/${k.id}`} className="hover:underline">{k.name}</Link>
                      </div>
                      <div className={`text-xs ${good ? 'text-green-700' : 'text-gray-600'}`}>{k.quarter} {k.year}</div>
                    </div>
                    <div className="text-xs text-gray-500">Team: {k.Team?.name || '—'}</div>
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span>Target: {k.target}</span>
                        <span>Actual: {k.actual}</span>
                        <span className={good ? 'text-green-700' : 'text-red-600'}>
                          {k.diff >= 0 ? '+' : ''}{k.diff}
                        </span>
                      </div>
                      <div className="mt-1 h-2 bg-gray-200 rounded">
                        <div className={`h-2 rounded ${good ? 'bg-green-600' : 'bg-blue-600'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="mt-3 text-right">
            <Link href="/kpis" className="text-xs text-blue-600 underline">View all KPIs</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
