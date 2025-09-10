"use client";

import React from "react";
import Link from "next/link";

export default function OneOnOnesPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">1:1 Management</h1>
        <div className="text-sm text-gray-500">Prepare, run, and track effective one‑on‑ones</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Guidance and resources */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-3 border-b font-medium">Quick Start</div>
            <div className="p-4 text-sm text-gray-700 space-y-2">
              <p>Use this page to manage recurring 1:1s, share agendas, and track notes and action items.</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Create a shared agenda before each meeting</li>
                <li>Capture notes and decisions during the session</li>
                <li>Assign clear owners and due dates to action items</li>
              </ul>
              <div className="mt-2">
                <Link href="/teams?tab=team-management" className="text-blue-600 hover:underline text-xs">
                  Go back to Team Management
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Placeholders for upcoming features */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-3 border-b font-medium flex items-center justify-between">
              <span>Upcoming 1:1s</span>
              <button className="text-xs px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700">Schedule</button>
            </div>
            <div className="p-4 text-sm text-gray-500">No 1:1s scheduled yet.</div>
          </div>

          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-3 border-b font-medium flex items-center justify-between">
              <span>Shared Agenda</span>
              <button className="text-xs px-2 py-1 border rounded hover:bg-gray-50">New Agenda</button>
            </div>
            <div className="p-4 text-sm text-gray-500">Create agendas to align before each 1:1.</div>
          </div>

          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-3 border-b font-medium flex items-center justify-between">
              <span>Notes & Decisions</span>
              <button className="text-xs px-2 py-1 border rounded hover:bg-gray-50">Add Note</button>
            </div>
            <div className="p-4 text-sm text-gray-500">Keep an ongoing log of highlights and decisions.</div>
          </div>

          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-3 border-b font-medium flex items-center justify-between">
              <span>Action Items</span>
              <button className="text-xs px-2 py-1 border rounded hover:bg-gray-50">New Item</button>
            </div>
            <div className="p-4 text-sm text-gray-500">Track follow-ups with owners and due dates.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
