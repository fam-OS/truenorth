"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";

type TeamMember = {
  id: string;
  name: string;
  email: string | null;
  role: string | null;
  teamId: string;
  reportsToId: string | null;
};

export default function TeamMemberDetailPage() {
  const params = useParams<{ memberId: string }>();
  const router = useRouter();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const mounted = useRef(false);

  const [member, setMember] = useState<TeamMember | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  const managerOptions = useMemo(
    () => teamMembers.filter((m) => m.id !== member?.id),
    [teamMembers, member?.id]
  );

  useEffect(() => {
    mounted.current = true;
    const load = async () => {
      try {
        setLoading(true);
        // Load the member first to learn teamId, then load team members for dropdown
        const mRes = await fetch(`/api/team-members/${params.memberId}`, { cache: "no-store" });
        if (!mRes.ok) throw new Error("Failed to load team member");
        const m: TeamMember = await mRes.json();
        if (!mounted.current) return;
        setMember(m);
        // Fetch team members for the same team (ignore errors but try best)
        const listRes = await fetch(`/api/teams/${m.teamId}/members`, { cache: "no-store" });
        if (listRes.ok) {
          const list: TeamMember[] = await listRes.json();
          if (mounted.current) setTeamMembers(list);
        }
      } catch (err) {
        if (mounted.current) {
          setError("Failed to load team member");
          showToast({
            title: "Failed to load team member",
            description: err instanceof Error ? err.message : "Unknown error",
            type: "destructive",
          });
        }
      } finally {
        if (mounted.current) setLoading(false);
      }
    };
    void load();
    return () => {
      mounted.current = false;
    };
  }, [params.memberId, showToast]);

  async function handleSave() {
    if (!member) return;
    try {
      setSaving(true);
      setError("");
      const res = await fetch(`/api/team-members/${member.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: member.name,
          email: member.email ?? null,
          role: member.role ?? null,
          reportsToId: member.reportsToId ?? null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Failed to save");
      }
      const updated = (await res.json()) as TeamMember;
      setMember(updated);
      showToast({ title: "Member updated", description: "Changes were saved." });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save";
      setError(message);
      showToast({ title: "Failed to save member", description: message, type: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!member) return;
    try {
      const confirmed = confirm(`Delete member ${member.name}? This cannot be undone.`);
      if (!confirmed) return;
      const res = await fetch(`/api/team-members/${member.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete member");
      showToast({ title: "Member deleted", description: `${member.name} was removed.` });
      // Navigate back to the team page
      router.push(`/teams/${member.teamId}`);
    } catch (err) {
      showToast({
        title: "Failed to delete member",
        description: err instanceof Error ? err.message : "Unknown error",
        type: "destructive",
      });
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="min-h-[300px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-red-600">Team member not found</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Team Member Detail</h1>
        <button onClick={() => router.push(`/teams/${member.teamId}`)} className="text-sm text-gray-500 hover:text-gray-700">
          Back to Team
        </button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      <div className="bg-white shadow rounded-lg p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900"
            value={member.name}
            onChange={(e) => setMember({ ...member, name: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Role</label>
          <input
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900"
            value={member.role ?? ""}
            onChange={(e) => setMember({ ...member, role: e.target.value })}
            placeholder="e.g., Manager"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900"
            value={member.email ?? ""}
            onChange={(e) => setMember({ ...member, email: e.target.value })}
            placeholder="name@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Reports to</label>
          <select
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900"
            value={member.reportsToId ?? ""}
            onChange={(e) => setMember({ ...member, reportsToId: e.target.value || null })}
          >
            <option value="">— None —</option>
            {managerOptions.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-between">
          <button
            type="button"
            onClick={handleDelete}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700"
          >
            Delete Member
          </button>
          <button
            disabled={saving}
            onClick={handleSave}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
