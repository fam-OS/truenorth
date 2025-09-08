"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Team = { id: string; name: string; description?: string | null };

export default function AllTeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  
  const orderedTeams = (() => {
    const arr = [...teams];
    const weight = (t: Team) => (/^executive team$/i.test((t.name || '').trim()) ? 1 : 0);
    arr.sort((a, b) => {
      const dw = weight(a) - weight(b);
      if (dw !== 0) return dw; // non-exec first, exec last
      return (a.name || '').localeCompare(b.name || '');
    });
    return arr;
  })();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/teams", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch teams");
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

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">All Teams ({teams.length})</h1>
        <Link
          href="/organizations"
          className="inline-flex items-center px-3 py-1.5 rounded bg-blue-600 text-white text-sm hover:bg-blue-700"
        >
          New Team
        </Link>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="min-h-[200px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : teams.length === 0 ? (
        <div className="text-sm text-gray-500">No teams yet.</div>
      ) : (
        <ul className="divide-y bg-white rounded-lg shadow">
          {orderedTeams.map((t) => (
            <li key={t.id} className="px-4 py-3 flex items-center justify-between">
              <div>
                <Link href={`/teams/${t.id}`} className="text-blue-600 hover:underline">
                  {t.name}
                </Link>
                {t.description && (
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{t.description}</p>
                )}
              </div>
              <Link href={`/teams/${t.id}`} className="text-xs text-blue-600 hover:underline">
                View
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
