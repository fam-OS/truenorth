'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type KpiItem = {
  id: string;
  name: string;
  targetMetric?: number | null;
  actualMetric?: number | null;
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  year: number;
  metTarget?: boolean | null;
  metTargetPercent?: number | null;
};

function classNames(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function KpiProgress() {
  const [kpis, setKpis] = useState<KpiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentYear = useMemo(() => new Date().getFullYear(), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/kpis?year=${currentYear}`, { cache: 'no-store' });
        if (!res.ok) {
          const raw = await res.text().catch(() => '');
          throw new Error(raw || `Failed to fetch KPIs (${res.status})`);
        }
        const data = await res.json();
        if (!cancelled) setKpis(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load KPIs');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [currentYear]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4 text-sm text-gray-500">Loading KPI progress…</CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-4 text-sm text-red-600">{error}</CardContent>
      </Card>
    );
  }

  if (kpis.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900">KPI Progress — {currentYear}</CardTitle>
        </CardHeader>
        <CardContent className="p-4 text-sm text-gray-500">No KPIs for {currentYear}</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-gray-900">KPI Progress — {currentYear}</CardTitle>
        <Link href="/goals" className="text-sm text-blue-600 hover:underline">View all</Link>
      </CardHeader>
      <CardContent>
        <ul className="divide-y divide-gray-200">
          {kpis.map((kpi) => {
            const target = typeof kpi.targetMetric === 'number' ? kpi.targetMetric : null;
            const actual = typeof kpi.actualMetric === 'number' ? kpi.actualMetric : null;
            const onTrack = typeof kpi.metTarget === 'boolean'
              ? kpi.metTarget
              : (target !== null && actual !== null ? actual >= target : false);
            const pct = target && actual !== null && target !== 0 ? Math.min(100, Math.round((actual / target) * 100)) : null;
            return (
              <li key={kpi.id} className="py-3">
                <div className="flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{kpi.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{kpi.quarter} {kpi.year}</p>
                  </div>
                  <div className="hidden sm:block w-40">
                    {pct !== null ? (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div className={classNames(onTrack ? 'bg-green-600' : 'bg-yellow-600', 'h-2 rounded-full')} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-gray-600 w-10 text-right">{pct}%</span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-500">No data</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={classNames(
                      'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                      onTrack ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    )}>
                      {onTrack ? 'On Track' : 'Needs Attention'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {target !== null && actual !== null ? `${actual} / ${target}` : '—'}
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
