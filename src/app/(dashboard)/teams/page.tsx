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

type HeadcountRow = {
  id: string;
  teamId: string;
  organizationId?: string | null;
  year: number;
  role: string;
  level: string;
  salary: number | string;
  q1Forecast: number; q1Actual: number;
  q2Forecast: number; q2Actual: number;
  q3Forecast: number; q3Actual: number;
  q4Forecast: number; q4Actual: number;
  notes?: string | null;
};

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const abortRef = useRef<AbortController | null>(null);
  const [headcount, setHeadcount] = useState<HeadcountRow[]>([]);
  const [hcError, setHcError] = useState<string>("");
  const [hcLoading, setHcLoading] = useState(false);
  const currentYear = new Date().getFullYear();
  const [hcSubmitting, setHcSubmitting] = useState(false);
  const [hcFormOpen, setHcFormOpen] = useState(true);
  const [editing, setEditing] = useState<Record<string, Partial<HeadcountRow>>>({});
  const [rowBusy, setRowBusy] = useState<Record<string, boolean>>({});
  const [hcForm, setHcForm] = useState({
    teamId: "",
    year: currentYear,
    role: "",
    level: "",
    salary: "",
    q1Forecast: 0,
    q1Actual: 0,
    q2Forecast: 0,
    q2Actual: 0,
    q3Forecast: 0,
    q3Actual: 0,
    q4Forecast: 0,
    q4Actual: 0,
    notes: "",
  });

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

  useEffect(() => {
    const loadHeadcount = async () => {
      try {
        setHcError("");
        setHcLoading(true);
        const res = await fetch(`/api/headcount?year=${currentYear}`, { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch headcount data");
        const data = await res.json();
        setHeadcount(Array.isArray(data) ? data : []);
      } catch (e) {
        setHcError(e instanceof Error ? e.message : "Failed to load Headcount Manager");
      } finally {
        setHcLoading(false);
      }
    };
    void loadHeadcount();
  }, [currentYear]);

  function currency(n: number) {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n);
  }

  // Export current headcount rows to CSV (uses visible state and team lookup for names)
  const exportHeadcountCSV = () => {
    try {
      const headers = [
        'Team',
        'Role',
        'Level',
        'Salary',
        'Q1 Forecast','Q1 Actual',
        'Q2 Forecast','Q2 Actual',
        'Q3 Forecast','Q3 Actual',
        'Q4 Forecast','Q4 Actual',
        'Notes',
        'Year',
      ];
      const lines: string[] = [];
      lines.push(headers.join(','));
      for (const r of headcount) {
        const teamName = teams.find((t) => t.id === r.teamId)?.name ?? '';
        const row = [
          teamName,
          r.role,
          r.level,
          String(r.salary),
          String(r.q1Forecast), String(r.q1Actual),
          String(r.q2Forecast), String(r.q2Actual),
          String(r.q3Forecast), String(r.q3Actual),
          String(r.q4Forecast), String(r.q4Actual),
          (r.notes ?? '').replace(/\r?\n/g, ' ').replace(/,/g, ';'),
          String(r.year),
        ];
        lines.push(row.map((v) => `"${(v ?? '').toString().replace(/"/g, '""')}"`).join(','));
      }

      const csv = lines.join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const y = new Date().getFullYear();
      a.href = url;
      a.download = `headcount_${y}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      setHcError(e instanceof Error ? e.message : 'Failed to export CSV');
    }
  };

  const headcountSummary = useMemo(() => {
    let forecastHC = 0;
    let actualHC = 0;
    let forecastSalary = 0;
    let actualSalary = 0;
    for (const r of headcount) {
      const sal = typeof r.salary === 'string' ? parseFloat(r.salary) : r.salary;
      const recForecastHC = (r.q1Forecast + r.q2Forecast + r.q3Forecast + r.q4Forecast);
      const recActualHC = (r.q1Actual + r.q2Actual + r.q3Actual + r.q4Actual);
      forecastHC += recForecastHC;
      actualHC += recActualHC;
      forecastSalary += recForecastHC * sal;
      actualSalary += recActualHC * sal;
    }
    return {
      forecastHC,
      actualHC,
      hcVariance: actualHC - forecastHC,
      forecastSalary,
      actualSalary,
      salaryVariance: actualSalary - forecastSalary,
    };
  }, [headcount]);

  // Inline edit handlers (component scope)
  const beginEdit = (row: HeadcountRow) => {
    setEditing((prev) => ({
      ...prev,
      [row.id]: {
        ...row,
        salary: typeof row.salary === 'string' ? row.salary : String(row.salary),
      },
    }));
  };

  const changeEdit = (id: string, field: keyof HeadcountRow, value: any) => {
    setEditing((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), [field]: value } }));
  };

  const cancelEdit = (id: string) => {
    setEditing((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const saveEdit = async (id: string) => {
    try {
      setRowBusy((b) => ({ ...b, [id]: true }));
      const patch = editing[id];
      if (!patch) return;
      const payload: any = { ...patch };
      if (payload.salary !== undefined) payload.salary = Number(payload.salary);
      const res = await fetch(`/api/headcount/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to save changes');
      const updated = await res.json();
      setHeadcount((rows) => rows.map((r) => (r.id === id ? updated : r)));
      cancelEdit(id);
    } catch (e) {
      setHcError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setRowBusy((b) => ({ ...b, [id]: false }));
    }
  };

  const deleteRow = async (id: string) => {
    try {
      setRowBusy((b) => ({ ...b, [id]: true }));
      const res = await fetch(`/api/headcount/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setHeadcount((rows) => rows.filter((r) => r.id !== id));
      cancelEdit(id);
    } catch (e) {
      setHcError(e instanceof Error ? e.message : 'Failed to delete');
    } finally {
      setRowBusy((b) => ({ ...b, [id]: false }));
    }
  };

  const updateForm = (field: string, value: string | number) => {
    setHcForm((prev) => ({ ...prev, [field]: value }));
  };

  const submitHeadcount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setHcSubmitting(true);
      const payload = {
        ...hcForm,
        salary: hcForm.salary === "" ? 0 : Number(hcForm.salary),
      } as any;
      const res = await fetch("/api/headcount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to create headcount record");
      // Refresh list
      const data = await fetch(`/api/headcount?year=${currentYear}`, { cache: "no-store" }).then((r) => r.json());
      setHeadcount(Array.isArray(data) ? data : []);
      // Reset form minimal
      setHcForm((prev) => ({
        ...prev,
        role: "",
        level: "",
        salary: "",
        q1Forecast: 0,
        q1Actual: 0,
        q2Forecast: 0,
        q2Actual: 0,
        q3Forecast: 0,
        q3Actual: 0,
        q4Forecast: 0,
        q4Actual: 0,
        notes: "",
      }));
    } catch (e) {
      setHcError(e instanceof Error ? e.message : "Failed to create record");
    } finally {
      setHcSubmitting(false);
    }
  };

  // Keep for future normalization if API shape changes again
  const displayMembers = useMemo(() => members, [members]);

  const orderedTeams = useMemo(() => {
    const arr = [...teams];
    const weight = (t: Team) => (/^executive team$/i.test(t.name?.trim() ?? '') ? 1 : 0);
    // Sort by weight first (non-exec before exec), then by name asc
    arr.sort((a, b) => {
      const dw = weight(a) - weight(b);
      if (dw !== 0) return dw;
      return (a.name || '').localeCompare(b.name || '');
    });
    return arr;
  }, [teams]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Team Management</h1>
        <div className="text-sm text-gray-500">Teams and Members</div>
      </div>
      <div>
        <Link href="/org-chart" className="text-sm text-blue-600 hover:underline">
          Visualize Org Chart
        </Link>
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
            <div className="px-4 py-3 border-b font-medium flex items-center justify-between">
              <span>Teams ({teams.length})</span>
              <Link href="/teams/list" className="text-xs text-blue-600 hover:underline">View All Teams</Link>
            </div>
            {teams.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">No teams found.</div>
            ) : (
              <>
              <ul className="divide-y">
                {orderedTeams.slice(0, 5).map((t) => (
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
              
              </>
            )}
          </div>

          {/* Team Members Column */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-3 border-b font-medium flex items-center justify-between">
              <span>Team Members ({members.length})</span>
              <Link href="/team-members/list" className="text-xs text-blue-600 hover:underline">View All Team Members</Link>
            </div>
            {displayMembers.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">No team members found.</div>
            ) : (
              <>
              <ul className="divide-y">
                {displayMembers.slice(0, 5).map((m, idx) => (
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
              
              </>
            )}
          </div>

          {/* Team Planning -> Headcount Manager */}
          <div className="bg-white shadow rounded-lg lg:col-span-2">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <div className="font-medium">Team Planning — Headcount Manager ({currentYear})</div>
              <div className="flex items-center gap-3">
                <button onClick={exportHeadcountCSV} type="button" className="text-xs px-2 py-1 border rounded hover:bg-gray-50">Export CSV</button>
              </div>
            </div>
            {hcError && <div className="p-3 text-sm text-red-700 bg-red-50">{hcError}</div>}
            {hcLoading ? (
              <div className="p-6 text-sm text-gray-500">Loading headcount…</div>
            ) : (
              <>
              <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-sm items-start">
                <div className="min-w-0">
                  <div className="text-gray-500">Total Forecast HC</div>
                  <div className="font-semibold truncate leading-snug" title={`${headcountSummary.forecastHC}`}>{headcountSummary.forecastHC}</div>
                </div>
                <div className="min-w-0">
                  <div className="text-gray-500">Total Actual HC</div>
                  <div className="font-semibold truncate leading-snug" title={`${headcountSummary.actualHC}`}>{headcountSummary.actualHC}</div>
                </div>
                <div className="min-w-0">
                  <div className="text-gray-500">HC Variance</div>
                  <div className="font-semibold truncate leading-snug" title={`${headcountSummary.hcVariance}`}>{headcountSummary.hcVariance}</div>
                </div>
                <div className="min-w-0">
                  <div className="text-gray-500">Forecast Salary</div>
                  <div className="font-semibold truncate leading-snug" title={currency(headcountSummary.forecastSalary)}>{currency(headcountSummary.forecastSalary)}</div>
                </div>
                <div className="min-w-0">
                  <div className="text-gray-500">Actual Salary</div>
                  <div className="font-semibold truncate leading-snug" title={currency(headcountSummary.actualSalary)}>{currency(headcountSummary.actualSalary)}</div>
                </div>
              </div>
            {headcount.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">No records yet. Add one below.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Team</th>
                      <th className="px-3 py-2 text-left">Role</th>
                      <th className="px-3 py-2 text-left">Level</th>
                      <th className="px-3 py-2 text-right">Salary</th>
                      <th className="px-3 py-2 text-right">Q1 F</th>
                      <th className="px-3 py-2 text-right">Q1 A</th>
                      <th className="px-3 py-2 text-right">Q2 F</th>
                      <th className="px-3 py-2 text-right">Q2 A</th>
                      <th className="px-3 py-2 text-right">Q3 F</th>
                      <th className="px-3 py-2 text-right">Q3 A</th>
                      <th className="px-3 py-2 text-right">Q4 F</th>
                      <th className="px-3 py-2 text-right">Q4 A</th>
                      <th className="px-3 py-2 text-left">Notes</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {headcount.map((r) => {
                      const isEditing = !!editing[r.id];
                      const edit = editing[r.id] as any;
                      const teamName = teams.find((t) => t.id === r.teamId)?.name || '—';
                      return (
                        <tr key={r.id} className="align-top">
                          <td className="px-3 py-2 whitespace-nowrap cursor-pointer" onDoubleClick={() => beginEdit(r)} title="Double-click to edit row">
                            {isEditing ? (
                              <select className="w-36 border rounded px-2 py-1" value={(edit.teamId ?? r.teamId) || ''}
                                onChange={(e) => changeEdit(r.id, 'teamId', e.target.value)}>
                                <option value="">—</option>
                                {teams.map((t) => (
                                  <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                              </select>
                            ) : (
                              <span>{teamName}</span>
                            )}
                          </td>
                          <td className="px-3 py-2 cursor-pointer" onDoubleClick={() => beginEdit(r)} title="Double-click to edit row">
                            {isEditing ? (
                              <input className="w-36 border rounded px-2 py-1" value={edit.role ?? r.role}
                                onChange={(e) => changeEdit(r.id, 'role', e.target.value)} />
                            ) : (
                              <span>{r.role}</span>
                            )}
                          </td>
                          <td className="px-3 py-2 cursor-pointer" onDoubleClick={() => beginEdit(r)} title="Double-click to edit row">
                            {isEditing ? (
                              <input className="w-28 border rounded px-2 py-1" value={edit.level ?? r.level}
                                onChange={(e) => changeEdit(r.id, 'level', e.target.value)} />
                            ) : (
                              <span>{r.level}</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-right cursor-pointer" onDoubleClick={() => beginEdit(r)} title="Double-click to edit row">
                            {isEditing ? (
                              <input type="number" step="0.01" className="w-28 border rounded px-2 py-1 text-right" value={edit.salary ?? r.salary}
                                onChange={(e) => changeEdit(r.id, 'salary', e.target.value)} />
                            ) : (
                              <span>{currency(typeof r.salary === 'string' ? parseFloat(r.salary) : r.salary)}</span>
                            )}
                          </td>
                          {(['q1Forecast','q1Actual','q2Forecast','q2Actual','q3Forecast','q3Actual','q4Forecast','q4Actual'] as const).map((field) => (
                            <td key={field} className="px-3 py-2 text-right cursor-pointer" onDoubleClick={() => beginEdit(r)} title="Double-click to edit row">
                              {isEditing ? (
                                <input type="number" className="w-20 border rounded px-2 py-1 text-right" value={(edit as any)[field] ?? (r as any)[field]}
                                  onChange={(e) => changeEdit(r.id, field as any, Number(e.target.value))} />
                              ) : (
                                <span>{(r as any)[field]}</span>
                              )}
                            </td>
                          ))}
                          <td className="px-3 py-2">
                            {isEditing ? (
                              <input className="w-56 border rounded px-2 py-1" value={edit.notes ?? r.notes ?? ''}
                                onChange={(e) => changeEdit(r.id, 'notes', e.target.value)} />
                            ) : (
                              <span className="text-gray-600 line-clamp-2 max-w-[18rem]">{r.notes}</span>
                            )}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-right">
                            {isEditing ? (
                              <div className="flex items-center gap-2 justify-end">
                                <button disabled={rowBusy[r.id]} onClick={() => saveEdit(r.id)} type="button" className="px-2 py-1 bg-blue-600 text-white rounded disabled:opacity-50">{rowBusy[r.id] ? 'Saving…' : 'Save'}</button>
                                <button disabled={rowBusy[r.id]} onClick={() => cancelEdit(r.id)} type="button" className="px-2 py-1 border rounded">Cancel</button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 justify-end">
                                <button onClick={() => beginEdit(r)} type="button" className="px-2 py-1 border rounded">Edit</button>
                                <button disabled={rowBusy[r.id]} onClick={() => deleteRow(r.id)} type="button" className="px-2 py-1 border rounded text-red-600">{rowBusy[r.id] ? 'Deleting…' : 'Delete'}</button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
            )}
          </div>

          {/* Headcount Tracker (Create) */}
          <div className="bg-white shadow rounded-lg lg:col-span-2">
            <div className="px-4 py-3 border-b flex items-center justify-between gap-2">
              <div className="font-medium">Headcount Tracker — Add Record</div>
              <button
                type="button"
                onClick={() => setHcFormOpen((v) => !v)}
                className="text-xs px-2 py-1 border rounded hover:bg-gray-50"
                aria-expanded={hcFormOpen}
                aria-controls="headcount-add-form"
              >
                {hcFormOpen ? 'Hide' : 'Show'}
              </button>
            </div>
            {hcFormOpen && (
            <form id="headcount-add-form" onSubmit={submitHeadcount} className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div>
                <label className="block text-gray-600 mb-1">Team</label>
                <select
                  className="w-full border rounded px-2 py-1"
                  value={hcForm.teamId}
                  onChange={(e) => updateForm("teamId", e.target.value)}
                  required
                >
                  <option value="">Select team…</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-600 mb-1">Year</label>
                <input type="number" className="w-full border rounded px-2 py-1" value={hcForm.year}
                  onChange={(e) => updateForm("year", Number(e.target.value))} required />
              </div>
              <div>
                <label className="block text-gray-600 mb-1">Role</label>
                <input type="text" className="w-full border rounded px-2 py-1" value={hcForm.role}
                  onChange={(e) => updateForm("role", e.target.value)} required />
              </div>
              <div>
                <label className="block text-gray-600 mb-1">Level</label>
                <input type="text" className="w-full border rounded px-2 py-1" value={hcForm.level}
                  onChange={(e) => updateForm("level", e.target.value)} required />
              </div>
              <div>
                <label className="block text-gray-600 mb-1">Salary (USD)</label>
                <input type="number" step="0.01" className="w-full border rounded px-2 py-1" value={hcForm.salary}
                  onChange={(e) => updateForm("salary", e.target.value)} required />
              </div>
              <div>
                <label className="block text-gray-600 mb-1">Q1 Forecast</label>
                <input type="number" className="w-full border rounded px-2 py-1" value={hcForm.q1Forecast}
                  onChange={(e) => updateForm("q1Forecast", Number(e.target.value))} min={0} />
                <p className="mt-1 text-xs text-gray-500">Forecasted count of individuals</p>
              </div>
              <div>
                <label className="block text-gray-600 mb-1">Q1 Actual</label>
                <input type="number" className="w-full border rounded px-2 py-1" value={hcForm.q1Actual}
                  onChange={(e) => updateForm("q1Actual", Number(e.target.value))} min={0} />
                <p className="mt-1 text-xs text-gray-500">Actual count of individuals</p>
              </div>
              <div>
                <label className="block text-gray-600 mb-1">Q2 Forecast</label>
                <input type="number" className="w-full border rounded px-2 py-1" value={hcForm.q2Forecast}
                  onChange={(e) => updateForm("q2Forecast", Number(e.target.value))} min={0} />
                <p className="mt-1 text-xs text-gray-500">Forecasted count of individuals</p>
              </div>
              <div>
                <label className="block text-gray-600 mb-1">Q2 Actual</label>
                <input type="number" className="w-full border rounded px-2 py-1" value={hcForm.q2Actual}
                  onChange={(e) => updateForm("q2Actual", Number(e.target.value))} min={0} />
                <p className="mt-1 text-xs text-gray-500">Actual count of individuals</p>
              </div>
              <div>
                <label className="block text-gray-600 mb-1">Q3 Forecast</label>
                <input type="number" className="w-full border rounded px-2 py-1" value={hcForm.q3Forecast}
                  onChange={(e) => updateForm("q3Forecast", Number(e.target.value))} min={0} />
                <p className="mt-1 text-xs text-gray-500">Forecasted count of individuals</p>
              </div>
              <div>
                <label className="block text-gray-600 mb-1">Q3 Actual</label>
                <input type="number" className="w-full border rounded px-2 py-1" value={hcForm.q3Actual}
                  onChange={(e) => updateForm("q3Actual", Number(e.target.value))} min={0} />
                <p className="mt-1 text-xs text-gray-500">Actual count of individuals</p>
              </div>
              <div>
                <label className="block text-gray-600 mb-1">Q4 Forecast</label>
                <input type="number" className="w-full border rounded px-2 py-1" value={hcForm.q4Forecast}
                  onChange={(e) => updateForm("q4Forecast", Number(e.target.value))} min={0} />
                <p className="mt-1 text-xs text-gray-500">Forecasted count of individuals</p>
              </div>
              <div>
                <label className="block text-gray-600 mb-1">Q4 Actual</label>
                <input type="number" className="w-full border rounded px-2 py-1" value={hcForm.q4Actual}
                  onChange={(e) => updateForm("q4Actual", Number(e.target.value))} min={0} />
                <p className="mt-1 text-xs text-gray-500">Actual count of individuals</p>
              </div>
              <div className="md:col-span-2 lg:col-span-4">
                <label className="block text-gray-600 mb-1">Notes</label>
                <textarea className="w-full border rounded px-2 py-1" rows={2} value={hcForm.notes}
                  onChange={(e) => updateForm("notes", e.target.value)} />
              </div>
              <div className="md:col-span-2 lg:col-span-4 flex items-center gap-3">
                <button type="submit" disabled={hcSubmitting || !hcForm.teamId || !hcForm.role || !hcForm.level || !hcForm.salary}
                  className="inline-flex items-center px-3 py-1.5 rounded bg-blue-600 text-white disabled:opacity-50">
                  {hcSubmitting ? "Saving…" : "Add Record"}
                </button>
                <div className="text-xs text-gray-500">Adds a headcount line that rolls into the manager totals above.</div>
              </div>
            </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
