"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/ui/toast";

export default function DeleteOpsReviewButton({ id }: { id: string }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setDeleting(true);
      const res = await fetch(`/api/ops-reviews/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `Failed to delete (status ${res.status})`);
      }
      showToast({ title: "Review deleted", description: "The ops review was removed." });
      router.push("/ops-reviews");
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to delete";
      showToast({ title: "Delete failed", description: msg, type: "destructive" });
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        className="inline-flex items-center px-3 py-2 border border-red-300 text-sm font-medium rounded-md shadow-sm text-red-700 bg-white hover:bg-red-50"
      >
        Delete Review
      </button>

      {confirmOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => !deleting && setConfirmOpen(false)} />
          <div className="relative bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-gray-900">Delete Review</h3>
            <p className="mt-2 text-sm text-gray-600">Are you sure you want to delete this ops review? This action cannot be undone.</p>
            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                onClick={() => setConfirmOpen(false)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 text-sm rounded-md border border-red-300 text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                disabled={deleting}
                onClick={() => { void handleDelete(); }}
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
