"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Member = {
  id: string;
  name?: string | null;
  email?: string | null;
  role?: string | null;
  reportsToId?: string | null;
  teamId?: string | null;
};

type TreeNode = Member & { children: TreeNode[] };

function roleBadge(role?: string | null): { label: string; className: string } {
  const r = (role || "").trim().toLowerCase();
  if (r === "ceo" || r === "founder") return { label: role || "CEO", className: "bg-purple-100 text-purple-700" };
  if (["cfo", "cio", "cto", "coo"].includes(r)) return { label: role || "Executive", className: "bg-indigo-100 text-indigo-700" };
  if (r === "executive") return { label: "Executive", className: "bg-indigo-100 text-indigo-700" };
  if (r === "director") return { label: "Director", className: "bg-blue-100 text-blue-700" };
  if (r === "manager") return { label: "Manager", className: "bg-green-100 text-green-700" };
  return { label: role || "Team Member", className: "bg-gray-100 text-gray-700" };
}

function memberSort(a: Member, b: Member) {
  const an = (a.name || "").toLowerCase();
  const bn = (b.name || "").toLowerCase();
  return an.localeCompare(bn);
}

export default function OrgChartPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [teamNameById, setTeamNameById] = useState<Record<string, string>>({});

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        // Base fetch
        const res = await fetch("/api/team-members", { cache: "no-store" });
        const baseOk = res.ok;
        const raw = baseOk ? await res.json() : [];
        const baseMembers: Member[] = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];

        // Supplement with per-team members to ensure completeness (some data may be scoped differently)
        const teamsRes = await fetch("/api/teams", { cache: "no-store" });
        const teams = teamsRes.ok ? await teamsRes.json() : [];
        const teamIds: string[] = Array.isArray(teams) ? teams.map((t: any) => t.id).filter(Boolean) : [];
        const nameMap: Record<string, string> = Array.isArray(teams)
          ? teams.reduce((acc: Record<string, string>, t: any) => { if (t?.id && t?.name) acc[t.id] = t.name; return acc; }, {})
          : {};

        // Limit to first 10 teams to avoid excessive requests
        const limitedTeamIds = teamIds.slice(0, 10);
        const teamMemberLists = await Promise.all(
          limitedTeamIds.map(async (tid) => {
            try {
              const r = await fetch(`/api/teams/${tid}/members`, { cache: "no-store" });
              if (!r.ok) return [] as Member[];
              const data = await r.json();
              return Array.isArray(data) ? (data as Member[]) : [];
            } catch {
              return [] as Member[];
            }
          })
        );
        const supplemental = teamMemberLists.flat();

        // Merge unique by id
        const byId = new Map<string, Member>();
        [...baseMembers, ...supplemental].forEach((m) => {
          if (m && m.id) {
            const prev = byId.get(m.id) || {};
            byId.set(m.id, { ...prev, ...m });
          }
        });

        setMembers(Array.from(byId.values()));
        setTeamNameById(nameMap);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load org chart");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const filteredMembers = useMemo(() => {
    if (!search.trim()) return members;
    const q = search.trim().toLowerCase();
    return members.filter((m) => (m.name || "").toLowerCase().includes(q) || (m.role || "").toLowerCase().includes(q));
  }, [members, search]);

  const tree = useMemo<TreeNode[]>(() => {
    const map = new Map<string, TreeNode>();
    filteredMembers.forEach((m) => map.set(m.id, { ...m, children: [] }));
    const roots: TreeNode[] = [];

    // Link children
    map.forEach((node) => {
      const parentId = node.reportsToId || undefined;
      if (parentId && map.has(parentId)) {
        map.get(parentId)!.children.push(node);
      }
    });

    // Preferred roots: Founder or CEO
    const founders = Array.from(map.values()).filter((n) => {
      const r = (n.role || "").toLowerCase();
      return r === "founder" || r === "ceo";
    });

    if (founders.length > 0) {
      founders.forEach((f) => roots.push(f));
      // If founders exist, attach any unassigned members (without manager and not founder/CEO)
      // under the first founder to make the chart more informative when data is sparse.
      const top = roots[0];
      const unassigned = Array.from(map.values()).filter((n) => {
        const parentId = n.reportsToId || undefined;
        const role = (n.role || "").toLowerCase();
        return (!parentId || !map.has(parentId)) && !(role === "founder" || role === "ceo");
      });
      // Avoid duplicates: only add those not already present as children of any root
      const isAlreadyPlaced = (id: string) => {
        const visit = (node: TreeNode): boolean =>
          node.children.some((c) => c.id === id || visit(c));
        return roots.some((r) => r.id === id || visit(r));
      };
      unassigned.forEach((n) => {
        if (!isAlreadyPlaced(n.id)) top.children.push(n);
      });
    } else {
      // Fallback: members without manager
      map.forEach((node) => {
        const parentId = node.reportsToId || undefined;
        if (!parentId || !map.has(parentId)) {
          roots.push(node);
        }
      });
    }

    // Sort children by name
    const sortTree = (n: TreeNode) => {
      n.children.sort(memberSort);
      n.children.forEach(sortTree);
    };
    roots.forEach(sortTree);

    // Ensure roots are unique and sorted by role weight then name
    const uniq = Array.from(new Map(roots.map((r) => [r.id, r])).values());
    uniq.sort((a, b) => {
      const ra = (a.role || "").toLowerCase();
      const rb = (b.role || "").toLowerCase();
      const weight = (r: string) => {
        if (r === "ceo" || r === "founder") return 5;
        if (["cfo", "cio", "cto", "coo", "executive"].includes(r)) return 4;
        if (r === "director") return 3;
        if (r === "manager") return 2;
        return 1;
      };
      const dw = weight(rb) - weight(ra);
      return dw !== 0 ? dw : memberSort(a, b);
    });
    return uniq;
  }, [filteredMembers]);

  const toggle = (id: string) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const Node = ({ node, depth = 0 }: { node: TreeNode; depth?: number }) => {
    const badge = roleBadge(node.role);
    const isOpen = expanded[node.id] ?? true; // default expanded
    return (
      <li>
        <div className="flex items-start gap-2">
          {node.children.length > 0 ? (
            <button
              type="button"
              onClick={() => toggle(node.id)}
              className="mt-0.5 h-5 w-5 flex items-center justify-center rounded border text-xs"
              aria-expanded={isOpen}
              aria-controls={`children-${node.id}`}
              title={isOpen ? "Collapse" : "Expand"}
            >
              {isOpen ? "−" : "+"}
            </button>
          ) : (
            <span className="mt-0.5 h-5 w-5 inline-flex items-center justify-center text-gray-300">•</span>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Link href={`/team-members/${node.id}`} className="text-sm text-blue-600 hover:underline truncate">
                {node.name || "(no name)"}
              </Link>
              <span className={`text-[10px] px-2 py-0.5 rounded ${badge.className}`}>{badge.label}</span>
              {node.teamId && teamNameById[node.teamId] && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-orange-100 text-orange-700" title={teamNameById[node.teamId]}>
                  {teamNameById[node.teamId]}
                </span>
              )}
            </div>
            {node.email && <div className="text-xs text-gray-500 truncate">{node.email}</div>}
          </div>
        </div>
        {node.children.length > 0 && isOpen && (
          <ul id={`children-${node.id}`} className="ml-6 mt-2 space-y-2 border-l pl-4">
            {node.children.map((c) => (
              <Node key={c.id} node={c} depth={depth + 1} />
            ))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Organization Chart</h1>
        <div className="text-sm text-gray-500">Founder/CEO at the top</div>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Search by name or role"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-80 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
        />
        <button
          type="button"
          onClick={() => setExpanded({})}
          className="px-2 py-1 text-xs border rounded hover:bg-gray-50"
        >
          Collapse All
        </button>
        <button
          type="button"
          onClick={() => {
            const next: Record<string, boolean> = {};
            members.forEach((m) => { next[m.id] = true; });
            setExpanded(next);
          }}
          className="px-2 py-1 text-xs border rounded hover:bg-gray-50"
        >
          Expand All
        </button>
      </div>

      {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {loading ? (
        <div className="min-h-[200px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-4">
          {tree.length === 0 ? (
            <div className="text-sm text-gray-500">No members to display.</div>
          ) : (
            <ul className="space-y-3">
              {tree.map((root) => (
                <Node key={root.id} node={root} />
              ))}
            </ul>
          )}
          <div className="mt-6 text-xs text-gray-500 flex items-center gap-3">
            <span className="font-medium">Legend:</span>
            <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-700">Founder/CEO</span>
            <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">Executive</span>
            <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700">Director</span>
            <span className="px-2 py-0.5 rounded bg-green-100 text-green-700">Manager</span>
            <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700">Team Member</span>
            <span className="px-2 py-0.5 rounded bg-orange-100 text-orange-700">Team</span>
          </div>
        </div>
      )}
    </div>
  );
}
