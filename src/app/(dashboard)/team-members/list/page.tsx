"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Member = { id: string; name?: string; email?: string | null; role?: string | null };

export default function AllTeamMembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/team-members", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch team members");
        const raw = await res.json();
        const data: Member[] = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
        setMembers(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load team members");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">All Team Members ({members.length})</h1>
        <Link
          href="/organizations"
          className="inline-flex items-center px-3 py-1.5 rounded bg-blue-600 text-white text-sm hover:bg-blue-700"
        >
          New Team Member
        </Link>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="min-h-[200px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : members.length === 0 ? (
        <div className="text-sm text-gray-500">No team members yet.</div>
      ) : (
        <ul className="divide-y bg-white rounded-lg shadow">
          {members.map((m) => (
            <li key={m.id} className="px-4 py-3 flex items-center justify-between">
              <div>
                <Link href={`/team-members/${m.id}`} className="text-blue-600 hover:underline">
                  {m.name || "(no name)"}
                </Link>
                <div className="text-xs text-gray-500 mt-0.5">{m.role || "Member"} • {m.email || "no email"}</div>
              </div>
              <Link href={`/team-members/${m.id}`} className="text-xs text-blue-600 hover:underline">
                View
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
