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

  // Load the last selected organization from localStorage on initial load
  useEffect(() => {
    try {
      const savedOrg = localStorage.getItem('currentOrg');
      if (savedOrg) {
        setCurrentOrg(JSON.parse(savedOrg));
      }
    } catch (error) {
      console.error('Failed to load organization from localStorage', error);
    } finally {
      setIsLoading(false);
    }
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
