'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { BusinessUnitList } from '@/components/BusinessUnitList';
import { BusinessUnitForm } from '@/components/BusinessUnitForm';
import { GoalList } from '@/components/GoalList';
import { GoalForm } from '@/components/GoalForm';
import { StakeholderList } from '@/components/StakeholderList';
import { StakeholderForm } from '@/components/StakeholderForm';
import { BusinessUnitEditForm } from '@/components/BusinessUnitEditForm';
import type { BusinessUnitWithDetails } from '@/types/prisma';

type ViewMode = 'list' | 'detail' | 'createUnit' | 'createGoal' | 'createStakeholder' | 'stakeholders' | 'editUnit';

export default function BusinessUnitsPage() {
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [businessUnits, setBusinessUnits] = useState<BusinessUnitWithDetails[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<BusinessUnitWithDetails | null>(null);
  const [selectedOrg, setSelectedOrg] = useState<any | null>(null);
  const [selectedStakeholder, setSelectedStakeholder] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const isMounted = useRef(false);
  const initialFetchDone = useRef(false);

  const fetchData = useCallback(async () => {
    if (!isMounted.current) return;
    
    try {
      const response = await fetch('/api/organizations');
      if (!response.ok) throw new Error('Failed to fetch organizations');
      const data = await response.json();
      
      if (isMounted.current) {
        setOrganizations(data);
        const units = data.flatMap((org: any) => 
          (org.businessUnits || []).map((unit: any) => ({
            ...unit,
            organization: org,
            stakeholders: unit.stakeholders || [],
            metrics: unit.metrics || [],
            goals: unit.goals || [],
          }))
        );
        setBusinessUnits(units);

        if (selectedUnit) {
          const updatedUnit = units.find(unit => unit.id === selectedUnit.id);
          if (updatedUnit) setSelectedUnit(updatedUnit);
        }

        if (!initialFetchDone.current) {
          initialFetchDone.current = true;
        }
      }
    } catch (err) {
      if (isMounted.current) {
        setError('Failed to load business units');
        console.error(err);
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [selectedUnit]);

  useEffect(() => {
    isMounted.current = true;
    void fetchData();
    return () => {
      isMounted.current = false;
    };
  }, [fetchData]);

  async function handleCreateBusinessUnit(data: { name: string; description?: string; orgId: string }) {
    try {
      const response = await fetch(`/api/organizations/${data.orgId}/business-units`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to create business unit');
      
      await fetchData();
      setViewMode('list');
      setSelectedOrg(null);
    } catch (err) {
      throw new Error('Failed to create business unit');
    }
  }

  async function handleUpdateBusinessUnit(data: { name: string; description?: string }) {
    if (!selectedUnit) return;

    try {
      const response = await fetch(`/api/business-units/${selectedUnit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to update business unit');
      
      await fetchData();
      setViewMode('detail');
    } catch (err) {
      throw new Error('Failed to update business unit');
    }
  }

  async function handleCreateGoal(data: { 
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    stakeholderId: string;
    requirements?: string;
  }) {
    if (!selectedUnit) return;

    try {
      const response = await fetch(`/api/business-units/${selectedUnit.id}/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to create goal');
      
      await fetchData();
      setViewMode('detail');
    } catch (err) {
      throw new Error('Failed to create goal');
    }
  }

  async function handleCreateStakeholder(data: {
    name: string;
    title: string;
    role: string;
    email: string;
  }) {
    if (!selectedUnit) return;

    try {
      const response = await fetch(`/api/business-units/${selectedUnit.id}/stakeholders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to create stakeholder');
      
      await fetchData();
      setViewMode('stakeholders');
    } catch (err) {
      throw new Error('Failed to create stakeholder');
    }
  }

  const renderContent = () => {
    switch (viewMode) {
      case 'createUnit':
        return (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Create New Business Unit
            </h2>
            <div className="bg-white shadow rounded-lg p-6">
              <div className="mb-4">
                <label htmlFor="organization" className="block text-sm font-medium text-gray-700">
                  Organization
                </label>
                <select
                  id="organization"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  value={selectedOrg?.id || ''}
                  onChange={(e) => {
                    const org = organizations.find(o => o.id === e.target.value);
                    setSelectedOrg(org || null);
                  }}
                >
                  <option value="">Select an organization</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>
              {selectedOrg && (
                <BusinessUnitForm
                  orgId={selectedOrg.id}
                  onSubmit={handleCreateBusinessUnit}
                  onCancel={() => setViewMode('list')}
                />
              )}
            </div>
          </div>
        );

      case 'editUnit':
        return selectedUnit ? (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Edit Business Unit
              </h2>
              <button
                onClick={() => setViewMode('detail')}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <BusinessUnitEditForm
                businessUnit={selectedUnit}
                onSubmit={handleUpdateBusinessUnit}
                onCancel={() => setViewMode('detail')}
              />
            </div>
          </div>
        ) : null;

      case 'detail':
        return selectedUnit ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {selectedUnit.name}
                </h2>
                <p className="text-sm text-gray-500">
                  {selectedUnit.organization.name}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setViewMode('editUnit')}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Edit Business Unit
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Back to Business Units
                </button>
              </div>
            </div>
            {selectedUnit.description && (
              <p className="text-gray-500">{selectedUnit.description}</p>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border-t border-gray-200 pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Goals</h3>
                  <button
                    onClick={() => setViewMode('createGoal')}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Add Goal
                  </button>
                </div>
                <GoalList
                  goals={selectedUnit.goals || []}
                  onSelectGoal={() => {}}
                  onCreateGoal={() => setViewMode('createGoal')}
                />
              </div>

              <div className="border-t border-gray-200 pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Stakeholders</h3>
                  <button
                    onClick={() => setViewMode('stakeholders')}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                  >
                    View All
                  </button>
                </div>
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                  <ul className="divide-y divide-gray-200">
                    {(selectedUnit.stakeholders || []).slice(0, 3).map((stakeholder) => (
                      <li key={stakeholder.id} className="px-4 py-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-blue-600">{stakeholder.name}</p>
                            <p className="text-sm text-gray-500">{stakeholder.title}</p>
                          </div>
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {stakeholder.role}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                  {(selectedUnit.stakeholders || []).length > 3 && (
                    <div className="px-4 py-3 bg-gray-50 text-center">
                      <button
                        onClick={() => setViewMode('stakeholders')}
                        className="text-sm text-blue-600 hover:text-blue-900"
                      >
                        View all {selectedUnit.stakeholders.length} stakeholders
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null;

      case 'createGoal':
        return selectedUnit ? (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Create New Goal for {selectedUnit.name}
            </h2>
            <GoalForm
              businessUnit={selectedUnit}
              onSubmit={handleCreateGoal}
              onCancel={() => setViewMode('detail')}
            />
          </div>
        ) : null;

      case 'stakeholders':
        return selectedUnit ? (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Stakeholders - {selectedUnit.name}
              </h2>
              <button
                onClick={() => setViewMode('detail')}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Back to Business Unit
              </button>
            </div>
            <StakeholderList
              stakeholders={selectedUnit.stakeholders || []}
              onSelectStakeholder={setSelectedStakeholder}
              onCreateStakeholder={() => setViewMode('createStakeholder')}
            />
          </div>
        ) : null;

      case 'createStakeholder':
        return selectedUnit ? (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Add Stakeholder to {selectedUnit.name}
            </h2>
            <StakeholderForm
              businessUnit={selectedUnit}
              onSubmit={handleCreateStakeholder}
              onCancel={() => setViewMode('stakeholders')}
            />
          </div>
        ) : null;

      default:
        return (
          <>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-semibold text-gray-900">Business Units</h1>
              {organizations.length > 0 && (
                <button
                  onClick={() => setViewMode('createUnit')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                  New Business Unit
                </button>
              )}
            </div>
            {organizations.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Organizations Found</h3>
                <p className="text-gray-500">Create an organization first to add business units.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {organizations.map((org) => (
                  <div key={org.id} className="space-y-4">
                    <h2 className="text-lg font-medium text-gray-900">{org.name}</h2>
                    <BusinessUnitList
                      businessUnits={businessUnits.filter(unit => unit.organization.id === org.id)}
                      onCreateUnit={() => {
                        setSelectedOrg(org);
                        setViewMode('createUnit');
                      }}
                      onSelectUnit={(unit) => {
                        setSelectedUnit(unit);
                        setViewMode('detail');
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {error && (
        <div className="rounded-md bg-red-50 p-4 mb-6">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}
      
      {!initialFetchDone.current || isLoading ? (
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        renderContent()
      )}
    </div>
  );
}