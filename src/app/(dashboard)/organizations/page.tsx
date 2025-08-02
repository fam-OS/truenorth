'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { OrganizationWithBusinessUnits } from '@/types/prisma';

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<OrganizationWithBusinessUnits[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [showCreateUnit, setShowCreateUnit] = useState<string | null>(null);
  const isMounted = useRef(false);
  const initialFetchDone = useRef(false);
  const abortController = useRef<AbortController | null>(null);

  const fetchOrganizations = useCallback(async () => {
    if (!isMounted.current) return;

    // Cancel any pending requests
    if (abortController.current) {
      abortController.current.abort();
    }
    abortController.current = new AbortController();

    try {
      const response = await fetch('/api/organizations', {
        signal: abortController.current.signal
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch organizations');
      }

      const data = await response.json();
      
      if (isMounted.current) {
        setOrganizations(data);
        if (!initialFetchDone.current) {
          initialFetchDone.current = true;
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return; // Ignore aborted requests
      }
      if (isMounted.current) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    void fetchOrganizations();

    return () => {
      isMounted.current = false;
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, [fetchOrganizations]);

  const handleCreateOrganization = async (data: { name: string; description?: string }) => {
    try {
      setError(null);
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create organization');
      }

      await fetchOrganizations();
      setShowCreateOrg(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create organization');
    }
  };

  const handleCreateBusinessUnit = async (orgId: string, data: { name: string; description?: string }) => {
    try {
      setError(null);
      const response = await fetch(`/api/organizations/${orgId}/business-units`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create business unit');
      }

      await fetchOrganizations();
      setShowCreateUnit(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create business unit');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="min-h-[400px]">
        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-6">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {!initialFetchDone.current || isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : organizations.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Organizations</h3>
            <p className="text-gray-500">Get started by creating your first organization.</p>
            <button
              onClick={() => setShowCreateOrg(true)}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Create Organization
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-semibold text-gray-900">My Organizations</h1>
              <button
                onClick={() => setShowCreateOrg(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                New Organization
              </button>
            </div>

            <div className="grid gap-6">
              {organizations.map((org) => (
                <div
                  key={org.id}
                  className="bg-white shadow rounded-lg overflow-hidden"
                >
                  <div className="px-6 py-5">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-semibold text-gray-900">{org.name}</h2>
                      <button
                        onClick={() => setShowCreateUnit(org.id)}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200"
                      >
                        Add Business Unit
                      </button>
                    </div>
                    {org.description && (
                      <p className="mt-1 text-sm text-gray-500">{org.description}</p>
                    )}
                  </div>

                  {org.businessUnits && org.businessUnits.length > 0 && (
                    <div className="border-t border-gray-200">
                      <div className="px-6 py-4">
                        <h3 className="text-sm font-medium text-gray-900">Business Units</h3>
                        <div className="mt-3 grid gap-3">
                          {org.businessUnits.map((unit) => (
                            <div
                              key={unit.id}
                              className="flex items-center justify-between py-2"
                            >
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {unit.name}
                                </p>
                                {unit.description && (
                                  <p className="text-sm text-gray-500">
                                    {unit.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}