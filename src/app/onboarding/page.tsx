"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const LEVEL_OPTIONS = [
  "Founder / owner",
  "C-level",
  "VP",
  "Director",
  "Manager",
  "Supervisor",
  "Team Lead",
  "Individual Contributor",
] as const;

const INDUSTRY_OPTIONS = [
  "Tech",
  "Financial Services",
  "Healthcare or BioTech",
  "Renewable Energy",
  "Automotive",
  "Retail / e-commerce",
  "Real Estate",
  "Transportation / logistics",
  "Manufacturing",
  "Other",
] as const;

const LEADERSHIP_STYLE_OPTIONS = [
  "Democracy",
  "Laissez-faire",
  "Autocracy",
  "Transformational leadership",
  "Transactional",
  "Servant",
  "Bureaucratic",
  "Visionary",
  "Coaching leadership",
  "Transformational",
  "Delegative leadership",
  "Pacesetting",
  "Situational",
  "Authoritarian leadership",
  "Authoritative",
  "Charismatic",
  "Coaching",
  "Participative leadership",
  "Affiliative",
  "Strategic leadership",
  "Authentic leadership",
  "Adaptive leadership",
] as const;

export default function OnboardingPage() {
  const { status, data } = useSession();
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [level, setLevel] = useState<(typeof LEVEL_OPTIONS)[number] | "">("");
  const [industry, setIndustry] = useState<(typeof INDUSTRY_OPTIONS)[number] | "">("");
  const [styles, setStyles] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/api/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    if (data?.user?.email) setEmail(data.user.email);
  }, [data?.user?.email]);

  const disableSubmit = useMemo(() => {
    return (
      !firstName.trim() ||
      !lastName.trim() ||
      !email.trim() ||
      !company.trim() ||
      !level ||
      !industry ||
      styles.length === 0 ||
      submitting
    );
  }, [firstName, lastName, email, company, level, industry, styles.length, submitting]);

  function toggleStyle(s: string) {
    setStyles((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          company,
          level,
          industry,
          leadershipStyles: styles,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || 'Failed to save onboarding');
      }
      setDone(true);
      router.replace('/organizations');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="animate-pulse h-8 w-48 bg-gray-200 rounded" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-semibold text-gray-900">Welcome! Let’s get to know you</h1>
      <p className="mt-1 text-sm text-gray-600">This helps us personalize your experience. Our tool is meant to help you perform better at work by helping you become more connected to business goals.</p>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">First Name</label>
            <input
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base px-3 py-2 text-gray-900"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Last Name</label>
            <input
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base px-3 py-2 text-gray-900"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base px-3 py-2 text-gray-900"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <p className="mt-1 text-xs text-gray-500">We won't spam you. Spam is the devil!</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Name of your company</label>
          <input
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base px-3 py-2 text-gray-900"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Your level</label>
            <select
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base px-3 py-2 text-gray-900"
              value={level}
              onChange={(e) => setLevel(e.target.value as any)}
            >
              <option value="">— Select —</option>
              {LEVEL_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Industry</label>
            <select
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base px-3 py-2 text-gray-900"
              value={industry}
              onChange={(e) => setIndustry(e.target.value as any)}
            >
              <option value="">— Select —</option>
              {INDUSTRY_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Leadership style</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {LEADERSHIP_STYLE_OPTIONS.map((opt) => {
              const active = styles.includes(opt);
              return (
                <button
                  type="button"
                  key={opt}
                  onClick={() => toggleStyle(opt)}
                  className={`text-left text-xs sm:text-sm px-3 py-2 rounded-md border ${
                    active ? "bg-blue-50 border-blue-400 text-blue-700" : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                  aria-pressed={active}
                >
                  {opt}
                </button>
              );
            })}
          </div>
          {styles.length > 0 && (
            <p className="mt-1 text-xs text-gray-500">Selected: {styles.join(", ")}</p>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
            onClick={() => router.push("/")}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={disableSubmit}
            className="px-4 py-2 text-sm rounded-md border border-transparent text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Submit"}
          </button>
        </div>
      </form>

      {done && (
        <div className="mt-4 text-sm text-green-700">Thanks! Your preferences were saved.</div>
      )}
    </div>
  );
}
