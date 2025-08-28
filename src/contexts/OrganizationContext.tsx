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
        const savedOrg = localStorage.getItem('currentOrg');
        if (savedOrg) {
          if (!cancelled) setCurrentOrg(JSON.parse(savedOrg));
          return;
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
          const orgRes = await fetch('/api/organizations', { cache: 'no-store' });
          if (orgRes.ok) {
            const orgs: Array<{ id: string; name: string }> = await orgRes.json();
            if (orgs.length >= 1 && !cancelled) {
              setCurrentOrg({ id: orgs[0].id, name: orgs[0].name });
              return;
            }
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
