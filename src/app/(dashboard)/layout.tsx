'use client';

import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ClipboardDocumentListIcon,
  BuildingOfficeIcon,
  BuildingStorefrontIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { PresentationChartBarIcon } from '@heroicons/react/24/outline';
import { Squares2X2Icon, ChevronDownIcon, CogIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useSession, signOut } from 'next-auth/react';

function NavLink({ href, children }: { href: string; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`${
        isActive
          ? 'bg-gray-100 text-gray-900'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      } group flex items-center px-3 py-2 text-sm font-medium rounded-md`}
    >
      {children}
    </Link>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { currentOrg, setCurrentOrg } = useOrganization();
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const launcherRef = useRef<HTMLDivElement | null>(null);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  // App entries (exclude Home)
  const apps = useMemo(
    () =>
      [
        { href: '/units-stakeholders', label: 'Business Units & Stakeholders', icon: BuildingOfficeIcon, desc: 'Manage org structure and stakeholders' },
        { href: '/financial', label: 'Financial Management', icon: PresentationChartBarIcon, desc: 'Track costs, forecasts, and actuals' },
        { href: '/initiatives-kpis', label: 'Initiatives & KPIs', icon: PresentationChartBarIcon, desc: 'Plan, execute, and measure outcomes' },
        { href: '/teams', label: 'Team Management', icon: UserGroupIcon, desc: 'Headcount, roles, and team setup' },
        { href: '/ops-reviews', label: 'Team Ops Reviews', icon: PresentationChartBarIcon, desc: 'Quarterly operational reviews' },
        { href: '/feature-request', label: 'Feature Request', icon: ClipboardDocumentListIcon, desc: 'Suggest new features and improvements' },
      ].sort((a, b) => a.label.localeCompare(b.label)),
    []
  );

  // Keyboard focus management
  const itemRefs = useRef<HTMLAnchorElement[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);

  // Load last app and set default focused index when opening
  useEffect(() => {
    if (open) {
      const last = typeof window !== 'undefined' ? localStorage.getItem('lastApp') : null;
      const fallback = '/financial';
      const targetHref = last && apps.some(a => a.href === last) ? last : fallback;
      const idx = apps.findIndex((a) => a.href === targetHref);
      setFocusedIndex(idx >= 0 ? idx : 0);
      // Delay to ensure elements are rendered
      setTimeout(() => {
        const el = itemRefs.current[idx];
        el?.focus();
      }, 0);
    } else {
      setFocusedIndex(-1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Load organizations for the header selector
  const [orgs, setOrgs] = useState<Array<{ id: string; name: string }>>([]);
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch('/api/organizations', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setOrgs(data);
      } catch {}
    };
    load();
    return () => { cancelled = true; };
  }, []);

  // Close on outside click
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const target = e.target as Node;
      if (open && launcherRef.current && !launcherRef.current.contains(target)) {
        setOpen(false);
      }
      if (userMenuOpen && userMenuRef.current && !userMenuRef.current.contains(target)) {
        setUserMenuOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
        setUserMenuOpen(false);
      }
      if (!open) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex((prev) => {
          const next = e.key === 'ArrowDown' ? (prev + 1) % apps.length : (prev - 1 + apps.length) % apps.length;
          const el = itemRefs.current[next];
          el?.focus();
          return next;
        });
      }
      if (e.key === 'Enter' && focusedIndex >= 0) {
        e.preventDefault();
        const app = apps[focusedIndex];
        try { localStorage.setItem('lastApp', app.href); } catch {}
        setOpen(false);
        router.push(app.href);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div ref={launcherRef} className="flex items-center mr-2 relative">
                <button
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={open}
                  aria-controls="app-launcher-menu"
                  onClick={() => setOpen((v) => !v)}
                  className="inline-flex items-center gap-1 px-2 py-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  title="Open app launcher"
                >
                  <Squares2X2Icon className="h-6 w-6 text-gray-700" />
                  <ChevronDownIcon className={`h-4 w-4 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} />
                </button>
                {open && (
                  <div
                    id="app-launcher-menu"
                    role="menu"
                    aria-label="Applications"
                    className="absolute top-12 left-0 z-50 w-80 rounded-md border bg-white shadow-lg p-1"
                  >
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500">Applications</div>
                    <ul className="max-h-96 overflow-auto py-1">
                      {apps.map(({ href, label, icon: Icon, desc }, i) => {
                        const active = pathname === href;
                        return (
                          <li key={href}>
                            <Link
                              href={href}
                              role="menuitem"
                              ref={(el) => { if (el) itemRefs.current[i] = el; }}
                              tabIndex={0}
                              onClick={() => { try { localStorage.setItem('lastApp', href); } catch {}; setOpen(false); }}
                              className={`flex items-start gap-3 px-3 py-2 rounded-md text-sm ${
                                active ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              <Icon className="h-5 w-5 text-gray-500 mt-0.5" />
                              <span>
                                <span className="block leading-5">{label}</span>
                                {desc && <span className="block text-xs text-gray-500 leading-4">{desc}</span>}
                              </span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                    <Link
                href="/api/auth/signin"
                className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Sign in
              </Link>
            </div>
                )}
              </div>
              <Link href="/" className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold">TrueNorth</h1>
              </Link>
            </div>
            <div className="flex items-center">
              {/* spacer to keep left cluster */}
            </div>
            <div className="flex items-center gap-3">
              {orgs.length > 0 && (
                <div className="flex items-center gap-2">
                  <label htmlFor="global-org" className="text-sm text-gray-600">Org</label>
                  <select
                    id="global-org"
                    value={currentOrg?.id || ''}
                    onChange={(e) => {
                      const o = orgs.find(x => x.id === e.target.value);
                      if (o) setCurrentOrg({ id: o.id, name: o.name });
                    }}
                    className="block rounded-md border-gray-300 bg-white py-1.5 pl-2 pr-8 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    {orgs.map((o) => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                </div>
              )}
              {status === 'loading' && (
                <div className="text-sm text-gray-600">Loading...</div>
              )}
              {status === 'authenticated' && session?.user ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {session.user.image && (
                      <img
                        src={session.user.image}
                        alt={session.user.name || 'User'}
                        className="h-8 w-8 rounded-full"
                      />
                    )}
                    <span className="text-sm text-gray-700">
                      {session.user.name || session.user.email}
                    </span>
                  </div>
                  
                  <div ref={userMenuRef} className="relative">
                    <button
                      type="button"
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="inline-flex items-center rounded-md bg-gray-100 px-2 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                      title="User menu"
                    >
                      <CogIcon className="h-4 w-4" />
                    </button>
                    
                    {userMenuOpen && (
                      <div className="absolute right-0 top-10 z-50 w-48 rounded-md border bg-white shadow-lg py-1">
                        <Link
                          href="/settings"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <CogIcon className="h-4 w-4 mr-3 text-gray-500" />
                          Settings
                        </Link>
                        <Link
                          href="/feature-request"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <ClipboardDocumentListIcon className="h-4 w-4 mr-3 text-gray-500" />
                          Feature Request
                        </Link>
                        <Link
                          href="/support"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <QuestionMarkCircleIcon className="h-4 w-4 mr-3 text-gray-500" />
                          Support
                        </Link>
                        <hr className="my-1" />
                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            signOut();
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Sign out
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : status === 'unauthenticated' ? (
                <Link
                  href="/api/auth/signin"
                  className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Sign in
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </nav>

      <main className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}