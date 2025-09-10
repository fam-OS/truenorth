"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import "quill/dist/quill.snow.css";
import { useParams, useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";

type TeamMember = {
  id: string;
  name: string;
  email: string | null; // kept in type for compatibility but hidden in UI
  role: string | null;
  teamId: string | null;
  reportsToId: string | null;
  user?: { name?: string } | null;
  oneOnOneNotes?: string | null;
  lastOneOnOneAt?: string | null;
  goalsNotes?: string | null;
  personalNotes?: string | null;
};

type Team = { id: string; name: string };

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
  const [teams, setTeams] = useState<Team[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const managerOptions = useMemo(
    () => teamMembers.filter((m) => m.id !== member?.id && m.teamId === (member?.teamId ?? undefined)),
    [teamMembers, member?.id, member?.teamId]
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
        // Fetch all members (normalize response shape)
        const listRes = await fetch(`/api/team-members`, { cache: "no-store" });
        if (listRes.ok) {
          const raw = await listRes.json();
          const list: TeamMember[] = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
          if (mounted.current) setTeamMembers(list);
        }

        // Fetch teams for team selector
        const teamsRes = await fetch(`/api/teams`, { cache: "no-store" });
        if (teamsRes.ok) {
          const tRaw = await teamsRes.json();
          const ts: Team[] = Array.isArray(tRaw) ? tRaw : Array.isArray(tRaw?.data) ? tRaw.data : [];
          if (mounted.current) setTeams(ts.map((t: any) => ({ id: t.id, name: t.name })));
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
          role: member.role ?? null,
          reportsToId: member.reportsToId ?? null,
          teamId: member.teamId ?? null,
          oneOnOneNotes: member.oneOnOneNotes ?? null,
          lastOneOnOneAt: member.lastOneOnOneAt ?? null,
          goalsNotes: member.goalsNotes ?? null,
          personalNotes: member.personalNotes ?? null,
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

  async function handleConfirmDelete() {
    if (!member) return;
    try {
      setDeleting(true);
      const res = await fetch(`/api/team-members/${member.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete member");
      showToast({ title: "Member deleted", description: `${member.name} was removed.` });
      router.push(`/teams/${member.teamId}`);
      router.refresh();
    } catch (err) {
      showToast({
        title: "Failed to delete member",
        description: err instanceof Error ? err.message : "Unknown error",
        type: "destructive",
      });
    } finally {
      setDeleting(false);
      setShowConfirm(false);
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

      {/* Top row: Details (left) and 1:1 Notes (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Details (left) */}
        <div className="bg-white shadow rounded-lg p-6 space-y-4 lg:col-span-1">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900"
              value={member.name}
              onChange={(e) => setMember((prev) => (prev ? { ...prev, name: e.target.value } : prev))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <select
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900"
              value={member.role ?? ""}
              onChange={(e) => setMember((prev) => (prev ? { ...prev, role: e.target.value || null } : prev))}
            >
              <option value="">— Select Role —</option>
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

          {/* Email hidden by request */}

          <div>
            <label className="block text-sm font-medium text-gray-700">Team</label>
            <select
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900"
              value={member.teamId ?? ""}
              onChange={(e) => setMember((prev) => (prev ? { ...prev, teamId: e.target.value || null, reportsToId: null } : prev))}
            >
              <option value="">— None —</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Reports to</label>
            <select
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900"
              value={member.reportsToId ?? ""}
              onChange={(e) => setMember((prev) => (prev ? { ...prev, reportsToId: e.target.value || null } : prev))}
            >
              <option value="">— None —</option>
              {managerOptions.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.user?.name || m.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setShowConfirm(true)}
              className="inline-flex items-center px-1 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700"
            >
              Delete Member
            </button>
            <button
              disabled={saving}
              onClick={handleSave}
              className="inline-flex items-center px-1 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        {/* 1:1 Notes (right, double width) */}
        <div className="bg-white shadow rounded-lg p-6 space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">1:1 Notes</h2>
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-600 flex items-center gap-2">
                <label htmlFor="last11" className="text-gray-700">Date of Last 1:1</label>
                <input
                  id="last11"
                  type="date"
                  className="border rounded px-2 py-1 text-sm text-gray-900"
                  value={member.lastOneOnOneAt ? new Date(member.lastOneOnOneAt).toISOString().slice(0,10) : ""}
                  onChange={(e) => setMember((prev) => (prev ? { ...prev, lastOneOnOneAt: e.target.value || null } : prev))}
                />
                <button
                  type="button"
                  className="text-xs px-2 py-1 border rounded hover:bg-gray-50"
                  onClick={() => setMember((prev) => (prev ? { ...prev, lastOneOnOneAt: new Date().toISOString().slice(0,10) } : prev))}
                  title="Set to today"
                >Today</button>
              </div>
            </div>
          </div>
          <div>
            <QuillEditor
              value={member.oneOnOneNotes ?? ""}
              onChange={(html: string) => setMember((prev) => (prev ? { ...prev, oneOnOneNotes: html } : prev))}
            />
            <p className="mt-1 text-xs text-gray-500">Use this editor to capture your 1:1 notes with formatting.</p>
          </div>
        </div>
      </div>

      {/* Below row: Personal life (left) and Goals (right) */}
      <div className="bg-white shadow rounded-lg p-6 space-y-6 lg:col-span-2">
        {/* Personal life rich text (left) */}
        <div className="bg-white shadow rounded-lg p-6 space-y-3 lg:col-span-1">
          <h2 className="text-lg font-semibold text-gray-900">Personal life</h2>
          <p className="text-xs text-gray-500">Spouse name, children's names, school, hometown, hobbies, etc. Keep this respectful and relevant for relationship-building.</p>
          <QuillEditor
            value={member.personalNotes ?? ""}
            onChange={(html: string) => setMember((prev) => (prev ? { ...prev, personalNotes: html } : prev))}
          />
        </div>

        {/* Goals rich text (right, double width) */}
        <div className="bg-white shadow rounded-lg p-6 space-y-3 lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900">Goals</h2>
          <p className="text-xs text-gray-500">Discuss goals for this individual — near-term objectives, growth areas, and alignment to company priorities.</p>
          <QuillEditor
            value={member.goalsNotes ?? ""}
            onChange={(html: string) => setMember((prev) => (prev ? { ...prev, goalsNotes: html } : prev))}
          />
        </div>
      </div>
      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowConfirm(false)} />
          <div className="relative bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-gray-900">Delete Team Member</h3>
            <p className="mt-2 text-sm text-gray-600">Are you sure you want to delete this team member? This action cannot be undone.</p>
            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                onClick={() => setShowConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 text-sm rounded-md border border-red-300 text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                disabled={deleting}
                onClick={() => { void handleConfirmDelete(); }}
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Lightweight wrapper around Quill to work with React 19 without react-quill
function QuillEditor({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const quillRef = useRef<any>(null);
  const focusedRef = useRef<boolean>(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const Quill = (await import('quill')).default;
      if (!mounted || !containerRef.current) return;
      // Clear and create editor element
      containerRef.current.innerHTML = '';
      const editorEl = document.createElement('div');
      editorEl.style.width = '100%';
      containerRef.current.appendChild(editorEl);

      const q = new Quill(editorEl, { theme: 'snow' });
      // Initialize once with provided value
      q.root.innerHTML = value || '';
      q.on('text-change', () => {
        onChange(q.root.innerHTML);
      });
      q.root.addEventListener('focus', () => { focusedRef.current = true; });
      q.root.addEventListener('blur', () => {
        focusedRef.current = false;
        // Ensure latest HTML is pushed on blur
        onChange(q.root.innerHTML);
      });
      quillRef.current = q;
    })();
    return () => {
      mounted = false;
      quillRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const q = quillRef.current;
    // Avoid overwriting user input while focused
    if (!q || !q.root) return;
    if (focusedRef.current) return;
    if (q.root.innerHTML !== (value || '')) {
      q.root.innerHTML = value || '';
    }
  }, [value]);

  return <div ref={containerRef} className="w-full" />;
}
