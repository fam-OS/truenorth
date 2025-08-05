'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { OrganizationWithBusinessUnits } from '@/types/prisma';
import { OrganizationForm } from '@/components/OrganizationForm';

import { BusinessUnitForm } from '@/components/BusinessUnitForm';

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<OrganizationWithBusinessUnits[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [showCreateUnit, setShowCreateUnit] = useState<string | null>(null);
  const [editUnit, setEditUnit] = useState<{ orgId: string; unit: any } | null>(null);
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

    // Handler for editing a business unit
   const handleEditBusinessUnit = async (orgId: string, unitId: string, data: { name: string; description?: string }) => {
     try {
       setError(null);
       const response = await fetch(`/api/organizations/${orgId}/business-units/${unitId}`, {
         method: 'PUT',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(data),
       });
       if (!response.ok) {
         throw new Error('Failed to update business unit');
       }
       await fetchOrganizations();
       setEditUnit(null);
     } catch (err) {
       setError(err instanceof Error ? err.message : 'Failed to update business unit');
     }
   };

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
                <h2 className="text-lg font-semibold mb-4">Create Organization</h2>
                {/* Import OrganizationForm at the top if not already */}
                <OrganizationForm
                  onSubmit={handleCreateOrganization}
                  onCancel={() => setShowCreateOrg(false)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Modal for creating a business unit */}
        {showCreateUnit && !editUnit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4 relative">
              <button
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 focus:outline-none"
                onClick={() => setShowCreateUnit(null)}
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">Add Business Unit</h2>
                <BusinessUnitForm
                  organizationId={showCreateUnit}
                  onSubmit={async (data) => {
                    await handleCreateBusinessUnit(showCreateUnit, data);
                    setShowCreateUnit(null);
                  }}
                  onCancel={() => setShowCreateUnit(null)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Modal for editing a business unit */}
        {editUnit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4 relative">
              <button
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 focus:outline-none"
                onClick={() => setEditUnit(null)}
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">Edit Business Unit</h2>
                <BusinessUnitForm
                  businessUnit={editUnit.unit}
                  organizationId={editUnit.orgId}
                  onSubmit={async (data) => {
                    await handleEditBusinessUnit(editUnit.orgId, editUnit.unit.id, data);
                    setEditUnit(null);
                  }}
                  onCancel={() => setEditUnit(null)}
                />
              </div>
            </div>
          </div>
        )
}

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
                          onClick={() => setShowCreateUnit(org.id)}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200"
                        >
                          Add Business Unit
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
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium text-gray-900">
                                    {unit.name}
                                  </p>
                                  <button
                                    onClick={() => setEditUnit({ orgId: org.id, unit })}
                                    className="inline-flex items-center px-2 py-0.5 border border-transparent text-xs font-medium rounded bg-yellow-100 text-yellow-700 hover:bg-yellow-200 mr-2"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={async () => {
                                      if (window.confirm(`Delete business unit '${unit.name}'?`)) {
                                        setError(null);
                                        const response = await fetch(`/api/organizations/${org.id}/business-units/${unit.id}`, { method: 'DELETE' });
                                        if (!response.ok) {
                                          setError('Failed to delete business unit');
                                        } else {
                                          await fetchOrganizations();
                                        }
                                      }
                                    }}
                                    className="inline-flex items-center px-2 py-0.5 border border-transparent text-xs font-medium rounded bg-red-100 text-red-600 hover:bg-red-200"
                                  >
                                    Delete
                                  </button>
                                </div>
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