"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useMemo } from "react";

type Team = { id: string; name: string; description?: string | null };

type TeamMember = {
  id: string;
  name?: string; // legacy fallback
  role?: string | null;
  title?: string | null;
  teamId?: string | null;
  user?: { name?: string; email?: string } | null;
};

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        if (abortRef.current) abortRef.current.abort();
        abortRef.current = new AbortController();
        const signal = abortRef.current.signal;
        const [tRes, mRes] = await Promise.all([
          fetch("/api/teams", { cache: "no-store", signal }),
          fetch("/api/team-members", { cache: "no-store", signal }),
        ]);
        if (!tRes.ok) throw new Error("Failed to fetch teams");
        if (!mRes.ok) throw new Error("Failed to fetch team members");
        const [tData, mData] = await Promise.all([tRes.json(), mRes.json()]);
        setTeams(Array.isArray(tData) ? tData : []);
        const normalizedMembers = Array.isArray(mData)
          ? mData
          : Array.isArray((mData as any)?.data)
          ? (mData as any).data
          : [];
        setMembers(normalizedMembers);
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") return;
        setError(e instanceof Error ? e.message : "Failed to load Team Management");
      } finally {
        setLoading(false);
      }
    };
    void load();
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  // Keep for future normalization if API shape changes again
  const displayMembers = useMemo(() => members, [members]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Team Management</h1>
        <div className="text-sm text-gray-500">Teams and Members</div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="min-h-[200px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Teams Column */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-3 border-b font-medium">Teams</div>
            {teams.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">No teams found.</div>
            ) : (
              <ul className="divide-y">
                {teams.map((t) => (
                  <li key={t.id} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <Link href={`/teams/${t.id}`} className="text-sm text-blue-600 hover:underline">
                        {t.name}
                      </Link>
                      {t.description && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{t.description}</p>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">{members.filter((m) => m.teamId === t.id).length} members</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Team Members Column */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-3 border-b font-medium">Team Members ({members.length})</div>
            {displayMembers.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">No team members found.</div>
            ) : (
              <ul className="divide-y">
                {members.map((m, idx) => (
                  <li key={m.id ?? `row-${idx}`} className="px-4 py-3 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      {m.id ? (
                        <Link href={`/team-members/${m.id}`} className="text-sm text-gray-800 hover:underline">
                          {m.user?.name || m.name || "(no name)"}
                        </Link>
                      ) : (
                        <span className="text-sm text-gray-800">{m.user?.name || m.name || "(no name)"}</span>
                      )}
                      <div className="text-xs text-gray-500 truncate">{m.role || m.title || "Member"}</div>
                    </div>
                    {m.id && (
                      <Link href={`/team-members/${m.id}`} className="text-xs text-blue-600 hover:underline ml-3 whitespace-nowrap">
                        View Member
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
              
            )}
          </div>
        </div>
      )}
    </div>
  );
}
