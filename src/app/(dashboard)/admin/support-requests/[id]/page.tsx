"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type SupportRequest = {
  id: string;
  subject: string;
  description: string;
  steps?: string | null;
  category: string;
  priority: string;
  status: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  User?: { id: string; email: string | null; name: string | null } | null;
};

export default function AdminSupportRequestDetailPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<SupportRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [me, setMe] = useState<{ email: string | null; name: string | null } | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/support-requests/${params.id}`, { cache: "no-store" });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.error || `Request failed (${res.status})`);
        if (active) setData(json as SupportRequest);
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "Failed to load support request");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [params.id]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch('/api/admin/whoami', { cache: 'no-store' });
        const json = await res.json().catch(() => ({}));
        if (res.ok && active) setMe(json as any);
      } catch {}
    })();
    return () => { active = false; };
  }, []);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setSent(null);
    if (!reply.trim()) return;
    try {
      setSending(true);
      const res = await fetch(`/api/admin/support-requests/${params.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: reply }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || `Failed (${res.status})`);
      setSent('Reply sent successfully');
      setReply("");
    } catch (err) {
      setSent(err instanceof Error ? err.message : 'Failed to send');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Support Request</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm"><Link href="/admin">Back to Admin</Link></Button>
        </div>
      </div>

      {loading ? (
        <div className="min-h-[200px] flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"/></div>
      ) : error ? (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>
      ) : !data ? null : (
        <div className="card p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs text-gray-500">ID: {data.id}</div>
              <h2 className="text-xl font-semibold mt-1">{data.subject}</h2>
              <div className="mt-1 text-sm text-gray-500">{new Date(data.createdAt).toLocaleString()} • Updated {new Date(data.updatedAt).toLocaleString()}</div>
            </div>
            <div className="text-right text-sm">
              <div><span className="text-gray-500">Priority:</span> <span className="font-medium">{data.priority}</span></div>
              <div><span className="text-gray-500">Status:</span> <span className="font-medium">{data.status}</span></div>
              <div><span className="text-gray-500">Category:</span> <span className="font-medium">{data.category}</span></div>
            </div>
          </div>

          <div>
            <div className="text-sm font-medium text-gray-700 mb-1">Description</div>
            <div className="text-sm text-gray-900 whitespace-pre-wrap">{data.description}</div>
          </div>

          {data.steps && (
            <div>
              <div className="text-sm font-medium text-gray-700 mb-1">Steps to Reproduce</div>
              <div className="text-sm text-gray-900 whitespace-pre-wrap">{data.steps}</div>
            </div>
          )}

          <div className="pt-2 border-t">
            <div className="text-sm text-gray-600">Submitted by: {data.User?.name || data.User?.email || data.userId}</div>
          </div>

          <div className="pt-4 border-t space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">You are replying as: <span className="font-medium">{me?.email || '—'}</span></div>
              <div className="text-sm text-gray-600">Sending to: <span className="font-medium">{data.User?.email || '—'}</span></div>
            </div>
            <form onSubmit={handleSend} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Response</label>
                <textarea
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  rows={5}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Type your response..."
                  required
                />
              </div>
              {sent && <div className={`text-sm ${sent.includes('success') ? 'text-green-700' : 'text-red-700'}`}>{sent}</div>}
              <div className="flex justify-end">
                <Button type="submit" variant="gradient" size="sm" disabled={sending || !reply.trim()}>
                  {sending ? 'Sending…' : 'Send Email Reply'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
