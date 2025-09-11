"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// Keep types local to page for simplicity
 type Team = { id: string; name: string };
 type CostRow = {
  id: string;
  teamId: string;
  organizationId?: string | null;
  year: number;
  type: "SOFTWARE" | "TRAINING" | "SALARY" | "OTHER";
  q1Forecast: number; q1Actual: number;
  q2Forecast: number; q2Actual: number;
  q3Forecast: number; q3Actual: number;
  q4Forecast: number; q4Actual: number;
  notes?: string | null;
 };

export default function FinancialPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [costs, setCosts] = useState<CostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [editing, setEditing] = useState<Record<string, Partial<CostRow>>>({});
  const [rowBusy, setRowBusy] = useState<Record<string, boolean>>({});

  // Create form
  const [form, setForm] = useState({
    teamId: "",
    year: new Date().getFullYear(),
    type: "SOFTWARE" as CostRow["type"],
    q1Forecast: 0, q1Actual: 0,
    q2Forecast: 0, q2Actual: 0,
    q3Forecast: 0, q3Actual: 0,
    q4Forecast: 0, q4Actual: 0,
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Ensure numeric fields are numbers to avoid string concatenation in totals
  const normalizeCost = (r: any): CostRow => ({
    ...r,
    year: Number(r.year),
    q1Forecast: Number(r.q1Forecast) || 0,
    q1Actual: Number(r.q1Actual) || 0,
    q2Forecast: Number(r.q2Forecast) || 0,
    q2Actual: Number(r.q2Actual) || 0,
    q3Forecast: Number(r.q3Forecast) || 0,
    q3Actual: Number(r.q3Actual) || 0,
    q4Forecast: Number(r.q4Forecast) || 0,
    q4Actual: Number(r.q4Actual) || 0,
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const [tRes, cRes] = await Promise.all([
          fetch("/api/teams", { cache: "no-store" }),
          fetch(`/api/costs?year=${year}`, { cache: "no-store" }),
        ]);
        if (!tRes.ok) throw new Error("Failed to fetch teams");
        if (!cRes.ok) throw new Error("Failed to fetch costs");
        const [tData, cData] = await Promise.all([tRes.json(), cRes.json()]);
        setTeams(Array.isArray(tData) ? tData : []);
        setCosts(Array.isArray(cData) ? cData.map(normalizeCost) : []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load Financial Management");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [year]);

  // Inline editing helpers
  const beginEdit = (row: CostRow) => {
    setEditing((prev) => ({
      ...prev,
      [row.id]: { ...row },
    }));
  };

  const changeEdit = (id: string, field: keyof CostRow, value: any) => {
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
      // Ensure numeric fields are numbers
      const numFields: (keyof CostRow)[] = ['q1Forecast','q1Actual','q2Forecast','q2Actual','q3Forecast','q3Actual','q4Forecast','q4Actual','year'];
      const payload: any = { ...patch };
      for (const f of numFields) if (payload[f] !== undefined) payload[f] = Number(payload[f]);
      const res = await fetch(`/api/costs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to save changes');
      const updated = normalizeCost(await res.json());
      setCosts((rows) => rows.map((r) => (r.id === id ? updated : r)));
      cancelEdit(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setRowBusy((b) => ({ ...b, [id]: false }));
    }
  };

  const deleteRow = async (id: string) => {
    try {
      setRowBusy((b) => ({ ...b, [id]: true }));
      const res = await fetch(`/api/costs/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setCosts((rows) => rows.filter((r) => r.id !== id));
      cancelEdit(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete');
    } finally {
      setRowBusy((b) => ({ ...b, [id]: false }));
    }
  };

  const totals = useMemo(() => {
    let forecast = 0;
    let actual = 0;
    for (const r of costs) {
      const f = r.q1Forecast + r.q2Forecast + r.q3Forecast + r.q4Forecast;
      const a = r.q1Actual + r.q2Actual + r.q3Actual + r.q4Actual;
      forecast += f;
      actual += a;
    }
    return { forecast, actual, variance: actual - forecast };
  }, [costs]);

  // Variance color by threshold
  const varianceClass = (forecast: number, variance: number) => {
    if (forecast <= 0) {
      if (variance > 0) return "text-red-600"; // any overage when no budget
      if (variance < 0) return "text-green-600"; // under with no budget
      return "";
    }
    const pct = Math.abs(variance) / forecast; // fraction of budget

    if (variance < 0) {
      const underPct = -variance / forecast;
      // >15% under = green
      if (underPct > 0.15) return "text-green-600";
      // Between 10–15% under = green
      if (underPct > 0.10) return "text-green-600";
      // <=10% under = yellow
      return "text-yellow-600";
    }

    // Over side: within 10% = yellow
    if (pct <= 0.10) return "text-yellow-600";
    // Over >5% = red
    if (variance / forecast > 0.05) return "text-red-600";
    return "";
  };

  function currency(n: number) {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
  }

  // Export current costs to CSV
  const exportCostsCSV = () => {
    try {
      const headers = [
        'Team',
        'Type',
        'Year',
        'Q1 Forecast','Q1 Actual',
        'Q2 Forecast','Q2 Actual',
        'Q3 Forecast','Q3 Actual',
        'Q4 Forecast','Q4 Actual',
        'Notes',
      ];
      const lines: string[] = [];
      lines.push(headers.join(','));
      for (const r of costs) {
        const teamName = teams.find((t) => t.id === r.teamId)?.name ?? '';
        const row = [
          teamName,
          r.type,
          String(r.year),
          String(r.q1Forecast), String(r.q1Actual),
          String(r.q2Forecast), String(r.q2Actual),
          String(r.q3Forecast), String(r.q3Actual),
          String(r.q4Forecast), String(r.q4Actual),
          (r.notes ?? '').replace(/\r?\n/g, ' ').replace(/,/g, ';'),
        ];
        lines.push(row.map((v) => `"${(v ?? '').toString().replace(/"/g, '""')}"`).join(','));
      }
      const csv = lines.join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `costs_${year}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to export CSV');
    }
  };

  const updateForm = (field: string, value: any) => setForm((p) => ({ ...p, [field]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload: any = { ...form };
      const res = await fetch("/api/costs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to create cost record");
      // refresh
      const data = await fetch(`/api/costs?year=${year}`, { cache: "no-store" }).then((r) => r.json());
      setCosts(Array.isArray(data) ? data.map(normalizeCost) : []);
      setForm((p) => ({ ...p, teamId: "", type: "SOFTWARE", q1Forecast: 0, q1Actual: 0, q2Forecast: 0, q2Actual: 0, q3Forecast: 0, q3Actual: 0, q4Forecast: 0, q4Actual: 0, notes: "" }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create record");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Financial Management</h1>
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-600">Year</label>
          <input type="number" className="w-24 border rounded px-2 py-1 text-sm" value={year} onChange={(e) => setYear(Number(e.target.value))} />
        </div>
      </div>

      {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="min-h-[200px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary */}
          <div className="card">
            <div className="px-4 py-3 border-b font-medium">Totals ({year})</div>
            <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-sm">
              <div>
                <div className="text-gray-500">Total Forecast</div>
                <div className="font-semibold">{currency(totals.forecast)}</div>
              </div>
              <div>
                <div className="text-gray-500">Total Actual</div>
                <div className="font-semibold">{currency(totals.actual)}</div>
              </div>
              <div>
                <div className="text-gray-500">Variance</div>
                <div className={`font-semibold ${varianceClass(totals.forecast, totals.variance)}`} title={totals.forecast > 0 ? `${((totals.variance / totals.forecast) * 100).toFixed(1)}%` : undefined}>
                  {currency(totals.variance)}
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="card">
            <div className="px-4 py-3 border-b font-medium flex items-center justify-between">
              <span>Costs</span>
              <button onClick={exportCostsCSV} type="button" className="text-xs px-2 py-1 border rounded hover:bg-gray-50">Export CSV</button>
            </div>
            {costs.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">No cost records. Add one below.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Team</th>
                      <th className="px-3 py-2 text-left">Type</th>
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
                    {costs.map((r) => {
                      const teamName = teams.find((t) => t.id === r.teamId)?.name || '—';
                      const isEditing = !!editing[r.id];
                      const edit = editing[r.id] as any;
                      return (
                        <tr key={r.id}>
                          <td className="px-3 py-2 whitespace-nowrap cursor-pointer" onDoubleClick={() => beginEdit(r)} title="Double-click to edit row">
                            {isEditing ? (
                              <select className="w-40 border rounded px-2 py-1" value={(edit.teamId ?? r.teamId) || ''} onChange={(e) => changeEdit(r.id, 'teamId', e.target.value)}>
                                <option value="">—</option>
                                {teams.map((t) => (
                                  <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                              </select>
                            ) : (
                              <span>{teamName}</span>
                            )}
                          </td>
                          <td className="px-3 py-2 cursor-pointer" onDoubleClick={() => beginEdit(r)}>
                            {isEditing ? (
                              <select className="w-36 border rounded px-2 py-1" value={edit.type ?? r.type} onChange={(e) => changeEdit(r.id, 'type', e.target.value as any)}>
                                {(["SOFTWARE","TRAINING","SALARY","OTHER"] as const).map((t) => (
                                  <option key={t} value={t}>{t}</option>
                                ))}
                              </select>
                            ) : (
                              <span>{r.type}</span>
                            )}
                          </td>
                          {(['q1Forecast','q1Actual','q2Forecast','q2Actual','q3Forecast','q3Actual','q4Forecast','q4Actual'] as const).map((field) => (
                            <td key={field} className="px-3 py-2 text-right cursor-pointer" onDoubleClick={() => beginEdit(r)}>
                              {isEditing ? (
                                <input type="number" className="w-24 border rounded px-2 py-1 text-right" value={(edit as any)[field] ?? (r as any)[field]}
                                  onChange={(e) => changeEdit(r.id, field as any, Number(e.target.value))} />
                              ) : (
                                <span>{(r as any)[field]}</span>
                              )}
                            </td>
                          ))}
                          <td className="px-3 py-2 cursor-pointer" onDoubleClick={() => beginEdit(r)}>
                            {isEditing ? (
                              <input className="w-56 border rounded px-2 py-1" value={edit.notes ?? r.notes ?? ''} onChange={(e) => changeEdit(r.id, 'notes', e.target.value)} />
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
          </div>

          {/* Create */}
          <div className="card">
            <div className="px-4 py-3 border-b font-medium">Add Cost</div>
            <form onSubmit={submit} className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div>
                <label className="block text-gray-600 mb-1">Team</label>
                <select className="w-full border rounded px-2 py-1" value={form.teamId} onChange={(e) => updateForm("teamId", e.target.value)} required>
                  <option value="">Select team…</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-600 mb-1">Year</label>
                <input type="number" className="w-full border rounded px-2 py-1" value={form.year} onChange={(e) => updateForm("year", Number(e.target.value))} required />
              </div>
              <div>
                <label className="block text-gray-600 mb-1">Type</label>
                <select className="w-full border rounded px-2 py-1" value={form.type} onChange={(e) => updateForm("type", e.target.value)}>
                  {(["SOFTWARE","TRAINING","SALARY","OTHER"] as const).map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2 lg:col-span-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                {(["q1Forecast","q1Actual","q2Forecast","q2Actual","q3Forecast","q3Actual","q4Forecast","q4Actual"] as const).map((field) => (
                  <div key={field}>
                    <label className="block text-gray-600 mb-1">{field}</label>
                    <input type="number" className="w-full border rounded px-2 py-1" value={(form as any)[field]} onChange={(e) => updateForm(field, Number(e.target.value))} min={0} />
                  </div>
                ))}
              </div>
              <div className="md:col-span-2 lg:col-span-4">
                <label className="block text-gray-600 mb-1">Notes</label>
                <textarea className="w-full border rounded px-2 py-1" rows={2} value={form.notes} onChange={(e) => updateForm("notes", e.target.value)} />
              </div>
              <div className="md:col-span-2 lg:col-span-4 flex items-center gap-3">
                <Button type="submit" disabled={submitting || !form.teamId} variant="gradient" size="sm">
                  {submitting ? "Saving…" : "Add Cost"}
                </Button>
                <div className="text-xs text-gray-500">Adds a cost record that rolls into the totals above.</div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
