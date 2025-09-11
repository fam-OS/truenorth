"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type Metrics = {
  recentUsers: Array<{ id: string; email: string | null; name?: string | null; firstName?: string | null; lastName?: string | null; createdAt: string }>;
  totals: { users: number; organizations: number; teams: number; initiatives: number; stakeholders: number };
  auth: { oauthCountDistinctUsers: number; oauthAccountRecords: number; emailOnlyCount: number };
  avgSessionMinutes: number;
  featureRequests: Array<{ id: string; title: string; category: string; priority: string; status: string; createdAt: string; userId: string }>;
  supportRequests: Array<{ id: string; subject: string; category: string; priority: string; status: string; createdAt: string; userId: string }>;
};

export default function AdminDashboardPage() {
  const [data, setData] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [signupSort, setSignupSort] = useState<'newest' | 'oldest'>('newest');

  async function loadMetrics() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/metrics", { cache: "no-store" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({} as any));
        throw new Error(j?.error || `Request failed (${res.status})`);
      }
      const json = (await res.json()) as Metrics;
      setData(json);
      setLastUpdated(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load admin metrics");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    (async () => { if (active) await loadMetrics(); })();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6 min-h-[300px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
        {error === "Forbidden" && (
          <p className="mt-3 text-sm text-gray-600">This page is restricted to admin users. Ensure your email is listed in the ADMIN_EMAILS env variable.</p>
        )}
      </div>
    );
  }

  if (!data) return null;

  const fullName = (u: Metrics["recentUsers"][number]) => {
    const fn = (u.firstName || "").trim();
    const ln = (u.lastName || "").trim();
    const joined = [fn, ln].filter(Boolean).join(" ");
    return joined || u.name || u.email || u.id;
  };

  const sortedUsers = (data?.recentUsers || []).slice().sort((a, b) => {
    const aTime = new Date(a.createdAt).getTime();
    const bTime = new Date(b.createdAt).getTime();
    return signupSort === 'newest' ? bTime - aTime : aTime - bTime;
  });

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">Private metrics & requests overview</p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <div className="text-xs text-gray-500">Updated {lastUpdated.toLocaleTimeString()}</div>
          )}
          <Button onClick={loadMetrics} variant="gradient" size="sm">Refresh</Button>
          <Button asChild variant="outline" size="sm"><Link href="/">Back to App</Link></Button>
        </div>
      </div>

      {/* Top metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="text-xs text-gray-500">Total Users</div>
          <div className="text-xl font-semibold">{data.totals.users}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-gray-500">Organizations</div>
          <div className="text-xl font-semibold">{data.totals.organizations}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-gray-500">Teams</div>
          <div className="text-xl font-semibold">{data.totals.teams}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-gray-500">Stakeholders</div>
          <div className="text-xl font-semibold">{data.totals.stakeholders}</div>
        </div>
      </div>

      {/* Auth mix & session */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-4">
          <h2 className="text-lg font-semibold mb-3">Auth Mix</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-500">OAuth Users</div>
              <div className="font-semibold">{data.auth.oauthCountDistinctUsers}</div>
            </div>
            <div>
              <div className="text-gray-500">Email-only Users</div>
              <div className="font-semibold">{data.auth.emailOnlyCount}</div>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <h2 className="text-lg font-semibold mb-3">Average Time in App</h2>
          <div className="text-2xl font-semibold">{data.avgSessionMinutes}m</div>
          <p className="text-xs text-gray-500 mt-1">Approx. based on active session TTL</p>
        </div>
        <div className="card p-4">
          <h2 className="text-lg font-semibold mb-3">Initiatives</h2>
          <div className="text-2xl font-semibold">{data.totals.initiatives}</div>
          <p className="text-xs text-gray-500 mt-1">Total initiatives across all orgs</p>
        </div>
      </div>

      {/* Recent signups */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b font-medium flex items-center justify-between">
          <span>Recent Signups</span>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500">Sort</span>
            <select
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={signupSort}
              onChange={(e) => setSignupSort(e.target.value as any)}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>
        </div>
        {data.recentUsers.length === 0 ? (
          <div className="p-4 text-sm text-gray-500">No recent signups</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedUsers.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-2">{fullName(u)}</td>
                  <td className="px-4 py-2">{u.email}</td>
                  <td className="px-4 py-2">{new Date(u.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b font-medium">Feature Requests</div>
          {data.featureRequests.length === 0 ? (
            <div className="p-4 text-sm text-gray-500">None</div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {data.featureRequests.map((fr) => (
                <li key={fr.id} className="px-4 py-3 hover:bg-gray-50">
                  <Link href={`/admin/feature-requests/${fr.id}`} className="block">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{fr.title}</div>
                      <div className="text-xs text-gray-500">{fr.priority}</div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{fr.category} • {fr.status}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{new Date(fr.createdAt).toLocaleString()}</div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b font-medium">Support Requests</div>
          {data.supportRequests.length === 0 ? (
            <div className="p-4 text-sm text-gray-500">None</div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {data.supportRequests.map((sr) => (
                <li key={sr.id} className="px-4 py-3 hover:bg-gray-50">
                  <Link href={`/admin/support-requests/${sr.id}`} className="block">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{sr.subject}</div>
                      <div className="text-xs text-gray-500">{sr.priority}</div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{sr.category} • {sr.status}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{new Date(sr.createdAt).toLocaleString()}</div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
