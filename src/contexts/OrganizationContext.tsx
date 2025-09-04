'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

type Organization = {
  id: string;
  name: string;
  // Add other organization fields as needed
};

type OrganizationContextType = {
  currentOrg: Organization | null;
  setCurrentOrg: (org: Organization | null) => void;
  isLoading: boolean;
};

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load the last selected organization from localStorage, or default to user's org
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        // 1) Check URL for explicit organization id (query or path)
        let orgIdFromUrl: string | null = null;
        try {
          const loc = window.location;
          const sp = new URLSearchParams(loc.search);
          orgIdFromUrl = sp.get('orgId');
          if (!orgIdFromUrl) {
            // Try to parse from path: /organizations/{id}
            const parts = loc.pathname.split('/').filter(Boolean);
            const idx = parts.indexOf('organizations');
            if (idx >= 0 && parts[idx + 1]) {
              orgIdFromUrl = parts[idx + 1];
            }
          }
        } catch {}

        // Fetch all orgs once if needed (for validation and lookup)
        async function getAllOrgs(): Promise<Array<{ id: string; name: string }>> {
          try {
            const res = await fetch('/api/organizations', { cache: 'no-store' });
            if (!res.ok) return [];
            return (await res.json()) as Array<{ id: string; name: string }>;
          } catch {
            return [];
          }
        }

        // If URL provides orgId, use it (and persist) when valid
        if (orgIdFromUrl) {
          const orgs = await getAllOrgs();
          const match = orgs.find((o) => o.id === orgIdFromUrl);
          if (match && !cancelled) {
            setCurrentOrg({ id: match.id, name: match.name });
            try { localStorage.setItem('currentOrg', JSON.stringify({ id: match.id, name: match.name })); } catch {}
            return;
          }
        }

        const savedOrg = localStorage.getItem('currentOrg');
        if (savedOrg) {
          // Validate saved org still exists
          const parsed = JSON.parse(savedOrg) as { id: string; name: string };
          const orgs = await getAllOrgs();
          const match = orgs.find((o) => o.id === parsed.id);
          if (match && !cancelled) {
            setCurrentOrg({ id: match.id, name: match.name });
            return;
          }
        }

        // Try to get logged-in user's default org
        try {
          const meRes = await fetch('/api/me', { cache: 'no-store' });
          if (meRes.ok) {
            const me = await meRes.json();
            const defaultOrg = me?.organization || me?.defaultOrganization || null;
            if (defaultOrg && !cancelled) {
              setCurrentOrg({ id: defaultOrg.id, name: defaultOrg.name });
              return;
            }
          }
        } catch {}

        // Fallback: select the first available organization automatically
        try {
          const orgs = await getAllOrgs();
          if (orgs.length >= 1 && !cancelled) {
            setCurrentOrg({ id: orgs[0].id, name: orgs[0].name });
            return;
          }
        } catch {}
      } catch (error) {
        console.error('Failed to initialize organization', error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    init();
    return () => { cancelled = true; };
  }, []);

  // Save the current organization to localStorage whenever it changes
  const handleSetCurrentOrg = (org: Organization | null) => {
    if (org) {
      localStorage.setItem('currentOrg', JSON.stringify(org));
    } else {
      localStorage.removeItem('currentOrg');
    }
    setCurrentOrg(org);
  };

  return (
    <OrganizationContext.Provider 
      value={{
        currentOrg,
        setCurrentOrg: handleSetCurrentOrg,
        isLoading
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
}
