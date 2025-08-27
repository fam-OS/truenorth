'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { StakeholderList } from '@/components/StakeholderList';
import { BusinessUnitList } from '@/components/BusinessUnitList';
import type { BusinessUnitWithDetails } from '@/types/prisma';
import { useToast } from '@/components/ui/toast';

export default function UnitsAndStakeholdersPage() {
  const { showToast } = useToast();
  const mounted = useRef(false);

  const [organizations, setOrganizations] = useState<any[]>([]);
  const [businessUnits, setBusinessUnits] = useState<BusinessUnitWithDetails[]>([]);
  const [stakeholders, setStakeholders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    if (!mounted.current) return;
    try {
      setLoading(true);
      const [orgRes, shRes] = await Promise.all([
        fetch('/api/organizations', { cache: 'no-store', signal: AbortSignal.timeout(5000) }),
        fetch('/api/stakeholders', { cache: 'no-store', signal: AbortSignal.timeout(5000) }),
      ]);
      if (!orgRes.ok) throw new Error('Failed to fetch organizations');
      if (!shRes.ok) throw new Error('Failed to fetch stakeholders');

      const [orgs, shs] = await Promise.all([orgRes.json(), shRes.json()]);
      if (!mounted.current) return;

      setOrganizations(orgs);
      setStakeholders(shs || []);

      const units = orgs.flatMap((org: any) =>
        (org.businessUnits || []).map((unit: any) => ({
          ...unit,
          organization: org,
          stakeholders: unit.stakeholders || [],
          metrics: unit.metrics || [],
          goals: (unit.stakeholders || []).flatMap((s: any) => (s.goals || []).map((g: any) => ({ ...g, stakeholderName: s.name }))),
        }))
      );
      setBusinessUnits(units);
    } catch (err) {
      if (mounted.current) {
        setError('Failed to load data');
        showToast({ title: 'Failed to load', description: err instanceof Error ? err.message : 'Unknown error', type: 'destructive' });
      }
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    mounted.current = true;
    void fetchData();
    return () => { mounted.current = false; };
  }, [fetchData]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Business Units & Stakeholders</h1>
        <div className="flex items-center gap-2 text-sm">
          <Link href="/business-units" className="text-blue-600 hover:underline">Manage Units</Link>
          <span className="text-gray-300">•</span>
          <Link href="/stakeholders" className="text-blue-600 hover:underline">Manage Stakeholders</Link>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 mb-6">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {loading ? (
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : organizations.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Organizations Found</h3>
          <p className="text-gray-500">Create an organization first to add business units and stakeholders.</p>
        </div>
      ) : (
        <div className="space-y-8">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Business Units</h2>
              <Link href="/business-units" className="text-sm text-blue-600 hover:underline">View all</Link>
            </div>
            <div className="space-y-6">
              {organizations.map((org) => (
                <div key={org.id}>
                  <BusinessUnitList
                    businessUnits={businessUnits.filter((u) => u.organization.id === org.id)}
                    onSelectUnit={(unit) => location.assign(`/business-units`)}
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Stakeholders</h2>
              <Link href="/stakeholders" className="text-sm text-blue-600 hover:underline">View all</Link>
            </div>
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <StakeholderList
                stakeholders={stakeholders}
                onSelectStakeholder={(s) => location.assign(`/stakeholders/${s.id}`)}
                onCreateStakeholder={() => location.assign('/stakeholders')}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
