"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type Team = { id: string; name: string };

export default function NewTeamMemberPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>("");
  const [form, setForm] = useState({
    name: "",
    role: "",
    teamId: "",
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/teams", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load teams");
        const data = await res.json();
        setTeams(Array.isArray(data) ? data : []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load teams");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload: any = {
        name: form.name,
        role: form.role, // required
        teamId: form.teamId,
      };
      const res = await fetch("/api/team-members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const raw = await res.clone().text();
      if (!res.ok) {
        let msg = "Failed to create team member";
        try { const j = JSON.parse(raw); msg = j?.error || msg; } catch {}
        throw new Error(`${msg} (status ${res.status})`);
      }
      const member = await res.json();
      router.push(`/team-members/${member.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create team member");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">New Team Member</h1>
        <p className="text-sm text-gray-500 mt-1">Create a new team member and assign them to a team.</p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 mb-4">{error}</div>
      )}

      {loading ? (
        <div className="min-h-[200px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <form onSubmit={submit} className="card p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          {/* Email removed per requirement */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <select
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              required
            >
              <option value="">Select Role</option>
              <option value="CEO">CEO</option>
              <option value="COO">COO</option>
              <option value="CTO">CTO</option>
              <option value="CIO">CIO</option>
              <option value="CFO">CFO</option>
              <option value="Executive">Executive</option>
              <option value="Director">Director</option>
              <option value="Manager">Manager</option>
              <option value="Team Member">Team Member</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Team</label>
            <select
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              value={form.teamId}
              onChange={(e) => setForm({ ...form, teamId: e.target.value })}
              required
            >
              <option value="">Select a team</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="outline" size="sm" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" disabled={saving} variant="gradient" size="sm">
              {saving ? "Creating…" : "Create Member"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
