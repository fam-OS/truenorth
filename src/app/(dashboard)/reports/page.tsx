"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type ReportType =
  | "initiatives_at_risk"
  | "initiatives_by_owner"
  | "goals_by_status"
  | "stakeholders_list";

type Organization = { id: string; name: string };
type BusinessUnit = { id: string; name: string; organizationId?: string | null };

const reportTypeOptions: { value: ReportType; label: string }[] = [
  { value: "initiatives_at_risk", label: "Initiatives – At Risk" },
  { value: "initiatives_by_owner", label: "Initiatives – By Owner" },
  { value: "goals_by_status", label: "Goals – By Status (select a BU)" },
  { value: "stakeholders_list", label: "Stakeholders – Directory" },
];

function downloadCSV(filename: string, rows: any[]) {
  if (!rows || rows.length === 0) {
    return;
  }
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(",")]
    .concat(
      rows.map((row) =>
        headers
          .map((h) => {
            const val = row[h];
            if (val == null) return "";
            const s = String(val).replace(/"/g, '""');
            return `"${s}"`;
          })
          .join(",")
      )
    )
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>("initiatives_at_risk");
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);
  const [orgId, setOrgId] = useState<string>("");
  const [businessUnitId, setBusinessUnitId] = useState<string>("");
  const [ownerId, setOwnerId] = useState<string>("");
  const [status, setStatus] = useState<string>("IN_PROGRESS");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<any[]>([]);

  // Load Organizations and Business Units for filters
  useEffect(() => {
    async function loadFilters() {
      try {
        setError(null);
        const [orgRes, buRes] = await Promise.all([
          fetch("/api/organizations"),
          fetch("/api/business-units"),
        ]);
        const [orgData, buData] = await Promise.all([orgRes.json(), buRes.json()]);
        setOrganizations(Array.isArray(orgData) ? orgData : orgData?.organizations ?? []);
        setBusinessUnits(Array.isArray(buData) ? buData : buData?.businessUnits ?? []);
      } catch (e) {
        console.error("[Reports] Failed loading filters", e);
      }
    }
    loadFilters();
  }, []);

  const filteredBusinessUnits = useMemo(() => {
    if (!orgId) return businessUnits;
    return businessUnits.filter((b) => b.organizationId === orgId);
  }, [businessUnits, orgId]);

  async function runReport() {
    try {
      setLoading(true);
      setError(null);
      let data: any[] = [];

      if (reportType === "initiatives_at_risk") {
        const params = new URLSearchParams();
        if (orgId) params.set("orgId", orgId);
        const res = await fetch(`/api/initiatives?${params.toString()}`);
        const list = await res.json();
        data = (list || []).filter((i: any) => i.atRisk === true);
      }

      if (reportType === "initiatives_by_owner") {
        const params = new URLSearchParams();
        if (orgId) params.set("orgId", orgId);
        if (ownerId) params.set("ownerId", ownerId);
        const res = await fetch(`/api/initiatives?${params.toString()}`);
        data = await res.json();
      }

      if (reportType === "goals_by_status") {
        // For now require Business Unit for performance and clarity
        if (!businessUnitId) {
          setRows([]);
          setError("Select a Business Unit to view goals.");
          setLoading(false);
          return;
        }
        const res = await fetch(`/api/business-units/${businessUnitId}/goals`);
        const all = await res.json();
        data = (all || []).filter((g: any) => (status ? g.status === status : true));
      }

      if (reportType === "stakeholders_list") {
        const res = await fetch(`/api/stakeholders`);
        data = await res.json();
        // Optionally filter by org if available on item
        if (orgId) {
          data = data.filter((s: any) => s.organizationId === orgId || s.orgId === orgId);
        }
      }

      setRows(Array.isArray(data) ? data : []);
    } catch (e: any) {
      console.error("[Reports] runReport error", e);
      setError(e?.message || "Failed to run report");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  const displayRows = useMemo(() => {
    // Map known report shapes into a flat table-friendly structure
    if (reportType === "initiatives_at_risk" || reportType === "initiatives_by_owner") {
      return rows.map((r: any) => ({
        id: r.id,
        name: r.name,
        organizationId: r.organizationId || "",
        ownerId: r.ownerId || "",
        businessUnitId: r.businessUnitId || "",
        status: r.status || "",
        type: r.type || "",
        atRisk: r.atRisk ? "Yes" : "No",
        releaseDate: r.releaseDate ? new Date(r.releaseDate).toISOString().slice(0, 10) : "",
      }));
    }
    if (reportType === "goals_by_status") {
      return rows.map((g: any) => ({
        id: g.id,
        title: g.title,
        status: g.status,
        quarter: g.quarter,
        year: g.year,
        stakeholderId: g.stakeholderId || "",
      }));
    }
    if (reportType === "stakeholders_list") {
      return rows.map((s: any) => ({
        id: s.id,
        name: s.name || s.fullName || "",
        role: s.role || "",
        organizationId: s.organizationId || "",
        email: s.email || "",
      }));
    }
    return rows;
  }, [rows, reportType]);

  const headers = useMemo(() => (displayRows[0] ? Object.keys(displayRows[0]) : []), [displayRows]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Reports</h1>
        <div className="text-sm text-gray-500">Quick canned reports with simple filters</div>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Report</label>
          <select
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            value={reportType}
            onChange={(e) => setReportType(e.target.value as ReportType)}
          >
            {reportTypeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Organization (optional)</label>
          <select
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            value={orgId}
            onChange={(e) => {
              setOrgId(e.target.value);
              setBusinessUnitId("");
            }}
          >
            <option value="">All</option>
            {organizations.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Business Unit (optional)</label>
          <select
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            value={businessUnitId}
            onChange={(e) => setBusinessUnitId(e.target.value)}
          >
            <option value="">All</option>
            {filteredBusinessUnits.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {reportType === "initiatives_by_owner" && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Owner (Team Member ID, optional)</label>
            <input
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="tm_123..."
              value={ownerId}
              onChange={(e) => setOwnerId(e.target.value)}
            />
          </div>
        )}

        {reportType === "goals_by_status" && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Goal Status</label>
            <select
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="NOT_STARTED">Not Started</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="ON_HOLD">On Hold</option>
              <option value="COMPLETED">Completed</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">Select a Business Unit to filter goals.</p>
          </div>
        )}
      </div>

      <div className="mt-6 flex gap-3">
        <button
          onClick={runReport}
          className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none"
          disabled={loading}
        >
          {loading ? "Running..." : "Run Report"}
        </button>
        <button
          onClick={() => downloadCSV(`${reportType}.csv`, displayRows)}
          className="inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          disabled={!displayRows.length}
        >
          Export CSV
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-md bg-yellow-50 p-3 text-sm text-yellow-800">{error}</div>
      )}

      <div className="mt-6 overflow-auto">
        {displayRows.length === 0 ? (
          <div className="text-sm text-gray-500">No results. Adjust filters and run report.</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {headers.map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {displayRows.map((row, idx) => (
                <tr key={idx}>
                  {headers.map((h) => (
                    <td key={h} className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                      {String(row[h] ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
