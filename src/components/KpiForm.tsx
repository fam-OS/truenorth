'use client';

import { useEffect, useMemo, useState } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';

export type KpiFormValues = {
  name: string;
  targetMetric?: number;
  actualMetric?: number;
  forecastedRevenue?: number;
  actualRevenue?: number;
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  year: number;
  organizationId: string;
  teamId: string;
  initiativeId?: string;
};

export function KpiForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel = 'Create KPI',
}: {
  defaultValues?: Partial<KpiFormValues>;
  onSubmit: (values: KpiFormValues) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
}) {
  const { currentOrg } = useOrganization();
  const [teams, setTeams] = useState<Array<{ id: string; name: string }>>([]);
  const [initiatives, setInitiatives] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const quarters: Array<KpiFormValues['quarter']> = ['Q1', 'Q2', 'Q3', 'Q4'];

  const [form, setForm] = useState<KpiFormValues>(() => ({
    name: defaultValues?.name ?? '',
    targetMetric: defaultValues?.targetMetric,
    actualMetric: defaultValues?.actualMetric,
    forecastedRevenue: (defaultValues as any)?.forecastedRevenue,
    actualRevenue: (defaultValues as any)?.actualRevenue,
    quarter: (defaultValues?.quarter as KpiFormValues['quarter']) ?? 'Q1',
    year: defaultValues?.year ?? currentYear,
    organizationId: defaultValues?.organizationId ?? currentOrg?.id ?? '',
    teamId: defaultValues?.teamId ?? '',
    initiativeId: defaultValues?.initiativeId,
  }));

  useEffect(() => {
    setForm((prev) => ({ ...prev, organizationId: currentOrg?.id ?? '' }));
  }, [currentOrg?.id]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const [teamsRes, initsRes] = await Promise.all([
          fetch('/api/teams'),
          currentOrg?.id ? fetch(`/api/initiatives?orgId=${currentOrg.id}`) : Promise.resolve({ ok: true, json: async () => [] }),
        ]);
        if (!teamsRes.ok) throw new Error('Failed to load teams');
        const teamsJson = await teamsRes.json();
        setTeams(teamsJson);
        if (!initsRes.ok) throw new Error('Failed to load initiatives');
        const initsJson = await initsRes.json();
        setInitiatives(initsJson);
      } catch (e) {
        console.error(e);
        setError('Failed to load form data');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [currentOrg?.id]);

  const input = 'mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 placeholder-gray-500';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.organizationId) return setError('Organization is required');
    if (!form.teamId) return setError('Team is required');
    await onSubmit({ ...form });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div>
        <label className="block text-sm font-medium text-gray-700" htmlFor="name">Name</label>
        <input id="name" className={input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700" htmlFor="quarter">Quarter</label>
          <select id="quarter" className={input} value={form.quarter} onChange={(e) => setForm({ ...form, quarter: e.target.value as KpiFormValues['quarter'] })}>
            {quarters.map((q) => (
              <option key={q} value={q}>{q}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700" htmlFor="year">Year</label>
          <select id="year" className={input} value={form.year} onChange={(e) => setForm({ ...form, year: parseInt(e.target.value) })}>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700" htmlFor="teamId">Team</label>
          <select id="teamId" className={input} value={form.teamId} onChange={(e) => setForm({ ...form, teamId: e.target.value })} required>
            <option value="">Select team</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700" htmlFor="targetMetric">Target</label>
          <input id="targetMetric" type="number" step="any" className={input} value={form.targetMetric ?? ''} onChange={(e) => setForm({ ...form, targetMetric: e.target.value === '' ? undefined : Number(e.target.value) })} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700" htmlFor="actualMetric">Actual</label>
          <input id="actualMetric" type="number" step="any" className={input} value={form.actualMetric ?? ''} onChange={(e) => setForm({ ...form, actualMetric: e.target.value === '' ? undefined : Number(e.target.value) })} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700" htmlFor="forecastedRevenue">Forecasted Revenue</label>
          <input
            id="forecastedRevenue"
            type="number"
            step="any"
            className={input}
            value={form.forecastedRevenue ?? ''}
            onChange={(e) => setForm({ ...form, forecastedRevenue: e.target.value === '' ? undefined : Number(e.target.value) })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700" htmlFor="actualRevenue">Actual Revenue</label>
          <input
            id="actualRevenue"
            type="number"
            step="any"
            className={input}
            value={form.actualRevenue ?? ''}
            onChange={(e) => setForm({ ...form, actualRevenue: e.target.value === '' ? undefined : Number(e.target.value) })}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700" htmlFor="initiativeId">Initiative</label>
        <select id="initiativeId" className={input} value={form.initiativeId || ''} onChange={(e) => setForm({ ...form, initiativeId: e.target.value || undefined })}>
          <option value="">None</option>
          {initiatives.map((i) => (
            <option key={i.id} value={i.id}>{i.name}</option>
          ))}
        </select>
      </div>

      <div className="flex justify-end gap-3">
        {onCancel && (
          <button type="button" onClick={onCancel} className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
            Cancel
          </button>
        )}
        <button type="submit" className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
