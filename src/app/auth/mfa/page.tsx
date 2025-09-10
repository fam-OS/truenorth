"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MfaPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [remember, setRemember] = useState<boolean>(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "error" | "resent" | "success">("idle");
  const [error, setError] = useState<string | null>(null);

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setError(null);
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, rememberDevice: remember })
      });
      console.log('[MFA][client] Verify response:', res.status);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.warn('[MFA][client] Verify failed:', data);
        throw new Error(data.error || "Invalid or expired code");
      }
      setStatus("success");
      // Force a hard reload so NextAuth session/JWT callbacks re-run and pick up the cleared OTP
      setTimeout(() => {
        window.location.replace("/");
      }, 300);
    } catch (e: any) {
      setStatus("error");
      setError(e?.message || "Verification failed");
    }
  }

  async function resend() {
    setError(null);
    try {
      const res = await fetch("/api/auth/otp/request", { method: "POST" });
      if (!res.ok) throw new Error("Failed to resend code");
      setStatus("resent");
    } catch (e: any) {
      setStatus("error");
      setError(e?.message || "Failed to resend code");
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-gray-900">Two-Step Verification</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Enter the 6-digit code we emailed you. The code expires in 10 minutes.
          </p>
          <form onSubmit={verify} className="space-y-4">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="w-full border rounded-md px-3 py-2 text-base"
              placeholder="123456"
              required
              disabled={status === 'submitting' || status === 'success'}
            />
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                disabled={status === 'submitting' || status === 'success'}
                className="h-4 w-4"
              />
              Remember this device for 6 months
            </label>
            {error && <p className="text-sm text-red-600">{error}</p>}
            {status === "resent" && (
              <p className="text-sm text-green-700">A new code has been sent to your email.</p>
            )}
            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                disabled={status === "submitting" || status === 'success'}
              >
                {status === "submitting" ? "Verifying…" : "Verify"}
              </button>
              <button
                type="button"
                onClick={resend}
                className="text-sm text-blue-600 hover:underline"
                disabled={status === 'submitting' || status === 'success'}
              >
                Resend code
              </button>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                className="text-sm text-gray-500 hover:underline ml-auto"
              >
                Sign out
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
