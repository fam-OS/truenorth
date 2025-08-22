'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { OrganizationWithBusinessUnits } from '@/types/prisma';
import { OrganizationForm } from '@/components/OrganizationForm';

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<OrganizationWithBusinessUnits[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [editingOrg, setEditingOrg] = useState<OrganizationWithBusinessUnits | null>(null);
  // Business Unit UI removed from Organizations page
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
        signal: abortController.current.signal,
        cache: 'no-store' // Prevent caching to ensure fresh data
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
  }, []); // No dependencies needed as we're using refs

  // Business Unit handlers removed

  // Initial data fetch
  useEffect(() => {
    isMounted.current = true;
    void fetchOrganizations();

    return () => {
      isMounted.current = false;
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, []); // Empty dependency array ensures this only runs once on mount

  const handleSaveOrganization = async (data: { name: string; description?: string }) => {
    try {
      setError(null);
      const isEditing = !!editingOrg;
      const url = isEditing ? `/api/organizations/${editingOrg.id}` : '/api/organizations';
      
      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${isEditing ? 'update' : 'create'} organization`);
      }

      await fetchOrganizations();
      setShowCreateOrg(false);
      setEditingOrg(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${editingOrg ? 'update' : 'create'} organization`);
    }
  };

  // Business Unit creation removed

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="min-h-[400px]">
        {/* Modal for creating an organization */}
        {showCreateOrg && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4 relative">
              <button
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 focus:outline-none"
                onClick={() => setShowCreateOrg(false)}
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">
                  {editingOrg ? 'Edit Organization' : 'Create Organization'}
                </h2>
                <OrganizationForm
                  organization={editingOrg || undefined}
                  onSubmit={handleSaveOrganization}
                  onCancel={() => {
                    setShowCreateOrg(false);
                    setEditingOrg(null);
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Business Unit modal removed */}

        {/* Business Unit edit modal removed */}

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
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingOrg(org);
                            setShowCreateOrg(true);
                          }}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={async () => {
                            if (window.confirm(`Delete organization '${org.name}'? This will remove all business units and associated data.`)) {
                              setError(null);
                              const response = await fetch(`/api/organizations/${org.id}`, { method: 'DELETE' });
                              if (!response.ok) {
                                setError('Failed to delete organization');
                              } else {
                                await fetchOrganizations();
                              }
                            }
                          }}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-red-600 bg-red-100 hover:bg-red-200"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    {org.description && (
                      <p className="mt-1 text-sm text-gray-500">{org.description}</p>
                    )}
                  </div>

                  {/* Business Units section removed from Organizations page */}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}