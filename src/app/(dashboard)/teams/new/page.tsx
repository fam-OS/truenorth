"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Organization = { id: string; name: string };

export default function NewTeamPage() {
  const router = useRouter();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [orgId, setOrgId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/organizations", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load organizations");
        const data = await res.json();
        const orgs: Organization[] = Array.isArray(data) ? data.map((o: any) => ({ id: o.id, name: o.name })) : [];
        setOrganizations(orgs);
        if (orgs.length > 0) setOrgId(orgs[0].id);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load organizations");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!orgId || !name.trim()) return;
    try {
      setSubmitting(true);
      setError(null);
      const res = await fetch(`/api/organizations/${orgId}/teams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || undefined }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Failed to create team");
      }
      // Best-effort to get created team; fallback to teams page
      try {
        const created = await res.json();
        if (created?.id) {
          router.push(`/teams/${created.id}`);
          return;
        }
      } catch {}
      router.push("/teams?tab=team-management");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create team");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">Create Team</h1>
          <button
            type="button"
            onClick={() => router.push("/teams?tab=team-management")}
            className="text-sm text-gray-500 hover:underline"
          >
            Back to Teams
          </button>
        </div>

        {loading ? (
          <div className="p-4 text-sm text-gray-500">Loading…</div>
        ) : organizations.length === 0 ? (
          <div className="p-4 text-sm text-yellow-800 bg-yellow-50 rounded">
            You don't have any organizations yet. Please create an <Link href="/organizations" className="underline text-yellow-900">organization</Link> first, then add a team under it.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-700 bg-red-50 rounded">{error}</div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">Organization</label>
              <select
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                value={orgId}
                onChange={(e) => setOrgId(e.target.value)}
                required
              >
                {organizations.map((o) => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Team Name</label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Engineering"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description (optional)</label>
              <textarea
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What does this team own?"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => router.push("/teams?tab=team-management")}
                className="px-3 py-1.5 border rounded text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !orgId || !name.trim()}
                className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm disabled:opacity-50"
              >
                {submitting ? "Creating…" : "Create Team"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
