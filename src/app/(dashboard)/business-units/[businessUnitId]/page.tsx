"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { StakeholderList } from "@/components/StakeholderList";
import { useToast } from "@/components/ui/toast";

export default function BusinessUnitDetailPage() {
  const params = useParams<{ businessUnitId: string }>();
  const router = useRouter();
  const { showToast } = useToast();
  const mounted = useRef(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [unit, setUnit] = useState<any | null>(null);
  const [hasTeamMembers, setHasTeamMembers] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    mounted.current = true;
    (async () => {
      try {
        setLoading(true);
        // Fetch all BUs then pick the one by id (keeps compatibility if no GET /api/business-units/:id route)
        const buRes = await fetch("/api/business-units", { cache: "no-store" });
        if (!buRes.ok) throw new Error("Failed to load business units");
        const list = await buRes.json();
        const target = (Array.isArray(list) ? list : []).find((b: any) => b.id === params.businessUnitId);
        if (!target) throw new Error("Business unit not found");
        if (!mounted.current) return;
        setUnit(target);

        // Check team members availability (to guide stakeholder creation)
        try {
          const tmRes = await fetch("/api/team-members", { cache: "no-store" });
          if (tmRes.ok) {
            const tm = await tmRes.json();
            setHasTeamMembers(Array.isArray(tm) ? tm.length > 0 : false);
          } else {
            setHasTeamMembers(undefined);
          }
        } catch {
          setHasTeamMembers(undefined);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load business unit");
      } finally {
        if (mounted.current) setLoading(false);
      }
    })();
    return () => { mounted.current = false; };
  }, [params.businessUnitId]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="min-height-[300px] flex items-center justify-center text-sm text-gray-600">Loading…</div>
      </div>
    );
  }

  if (error || !unit) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-red-600">{error || "Business unit not found"}</div>
        <div className="mt-4">
          <Link href="/business-units" className="text-sm text-blue-600 hover:underline">Back to Business Units</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{unit.name}</h1>
          {unit.description && <p className="text-gray-600 mt-1">{unit.description}</p>}
        </div>
        <div className="flex items-center gap-3">
          <Link href="/business-units" className="text-sm text-gray-500 hover:text-gray-700">Back</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Stakeholders */}
        <div className="bg-white shadow rounded-lg">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Stakeholders</h2>
            <Link href={`/business-units?tab=detail&bu=${encodeURIComponent(unit.id)}`} className="text-sm text-blue-600 hover:text-blue-700">
              Manage in BU page
            </Link>
          </div>
          <div className="p-4">
            <StakeholderList
              stakeholders={unit.Stakeholder || unit.stakeholders || []}
              onSelectStakeholder={(s) => { window.location.href = `/stakeholders/${s.id}`; }}
              onCreateStakeholder={() => { window.location.href = `/business-units?tab=stakeholders&bu=${encodeURIComponent(unit.id)}`; }}
              hasTeamMembers={hasTeamMembers}
            />
          </div>
        </div>

        {/* Goals */}
        <div className="bg-white shadow rounded-lg">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Goals</h2>
            <div className="flex items-center gap-3">
              <Link href={`/initiatives-kpis`} className="text-sm text-blue-600 hover:text-blue-700">View all</Link>
              <button
                onClick={() => { window.location.href = `/goals/new?businessUnitId=${encodeURIComponent(unit.id)}`; }}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                New Goal
              </button>
            </div>
          </div>
          <div className="p-4">
            {(unit.Goal || unit.goals || []).length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-500">No goals</div>
            ) : (
              <ul className="divide-y">
                {(unit.Goal || unit.goals || []).slice(0, 5).map((g: any) => (
                  <li key={g.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{g.title}</div>
                      {g.description && <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">{g.description}</div>}
                    </div>
                    <Link href={`/goals/${g.id}`} className="text-xs text-blue-600 hover:underline">View</Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="text-sm text-gray-700">Quick actions</div>
        <div className="mt-2 flex flex-wrap gap-2">
          <Link href={`/teams/new`} className="text-xs px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700">Add Team</Link>
          <Link href={`/team-members/new`} className="text-xs px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700">Add Team Member</Link>
          <Link href={`/initiatives/new?businessUnitId=${encodeURIComponent(unit.id)}`} className="text-xs px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700">New Initiative</Link>
          <Link href={`/kpis/new?businessUnitId=${encodeURIComponent(unit.id)}`} className="text-xs px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700">New KPI</Link>
        </div>
      </div>
    </div>
  );
}
