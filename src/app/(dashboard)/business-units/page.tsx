'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { BusinessUnitList } from '@/components/BusinessUnitList';
import { BusinessUnitForm } from '@/components/BusinessUnitForm';
import { GoalList } from '@/components/GoalList';
import { GoalFormModal } from '@/components/GoalFormModal';
import { StakeholderList } from '@/components/StakeholderList';
import { StakeholderForm } from '@/components/StakeholderForm';
import { BusinessUnitEditForm } from '@/components/BusinessUnitEditForm';
import type { BusinessUnitWithDetails } from '@/types/prisma';
import { useToast } from '@/components/ui/toast';

type ViewMode = 'list' | 'detail' | 'createUnit' | 'createGoal' | 'createStakeholder' | 'stakeholders' | 'editUnit' | 'createGlobalStakeholder';

export default function BusinessUnitsPage() {
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [businessUnits, setBusinessUnits] = useState<BusinessUnitWithDetails[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<BusinessUnitWithDetails | null>(null);
  const [selectedOrg, setSelectedOrg] = useState<any | null>(null);
  const [selectedStakeholder, setSelectedStakeholder] = useState<any | null>(null);
  const [unassignedStakeholders, setUnassignedStakeholders] = useState<any[]>([]);
  const [selectedExistingStakeholderId, setSelectedExistingStakeholderId] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isMounted = useRef(false);
  const initialFetchDone = useRef(false);
  const { showToast } = useToast();

  const fetchData = useCallback(async () => {
    if (!isMounted.current) return;
    
    try {
      setIsLoading(true);
      const response = await fetch('/api/organizations', {
        cache: 'no-store', // Prevent caching
        signal: AbortSignal.timeout(5000) // Add timeout to prevent hanging requests
      });
      
      if (!response.ok) throw new Error('Failed to fetch organizations');
      const data = await response.json();
      
      if (!isMounted.current) return;
      
      setOrganizations(data);
      const units = data.flatMap((org: any) => 
        (org.businessUnits || []).map((unit: any) => {
          // Flatten goals from all stakeholders
          const allGoals = (unit.stakeholders || []).flatMap(
            (stakeholder: any) => (stakeholder.goals || []).map((goal: any) => ({
              ...goal,
              stakeholderName: stakeholder.name,
            }))
          );
          
          return {
            ...unit,
            organization: org,
            stakeholders: unit.stakeholders || [],
            metrics: unit.metrics || [],
            goals: allGoals,
          };
        })
      );
      setBusinessUnits(units);

      if (selectedUnit) {
        const updatedUnit = units.find((unit: BusinessUnitWithDetails) => unit.id === selectedUnit.id);
        if (updatedUnit) setSelectedUnit(updatedUnit);
      }

      if (!initialFetchDone.current) {
        initialFetchDone.current = true;
      }
    } catch (err) {
      if (isMounted.current && !(err instanceof DOMException && err.name === 'AbortError')) {
        setError('Failed to load business units');
        console.error(err);
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [selectedUnit]);

  // Initial data fetch
  useEffect(() => {
    isMounted.current = true;
    const controller = new AbortController();
    
    // Only fetch if we haven't loaded data yet or if we need to refresh
    if (!initialFetchDone.current || businessUnits.length === 0) {
      void fetchData();
    }
    
    return () => {
      isMounted.current = false;
      controller.abort();
    };
  }, []); // Empty dependency array ensures this only runs once on mount

  // Load unassigned stakeholders when opening add-stakeholder view
  useEffect(() => {
    if (viewMode === 'createStakeholder') {
      void (async () => {
        try {
          const res = await fetch('/api/stakeholders?unassigned=true', { cache: 'no-store' });
          if (res.ok) {
            const list = await res.json();
            setUnassignedStakeholders(list);
          }
        } catch (e) {
          // ignore
        }
      })();
    }
  }, [viewMode]);

  async function handleCreateBusinessUnit({ name, description, organizationId }: { name: string; description?: string; organizationId: string }) {
    try {
      const response = await fetch(`/api/organizations/${organizationId}/business-units`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      });

      if (!response.ok) throw new Error('Failed to create business unit');
      
      await fetchData();
      setViewMode('list');
      setSelectedOrg(null);
      showToast({ title: 'Business unit created', description: `${name} was added successfully.` });
    } catch (err) {
      showToast({ title: 'Failed to create business unit', description: err instanceof Error ? err.message : 'Unknown error', type: 'destructive' });
      throw new Error('Failed to create business unit');
    }
  }

  async function handleLinkExistingStakeholder() {
    if (!selectedUnit || !selectedExistingStakeholderId) return;
    try {
      const response = await fetch(`/api/business-units/${selectedUnit.id}/stakeholders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stakeholderId: selectedExistingStakeholderId }),
      });
      if (!response.ok) throw new Error('Failed to link stakeholder');
      await fetchData();
      setViewMode('stakeholders');
      showToast({ title: 'Stakeholder linked', description: 'Stakeholder has been linked to the business unit.' });
    } catch (err) {
      showToast({ title: 'Failed to link stakeholder', description: err instanceof Error ? err.message : 'Unknown error', type: 'destructive' });
      throw new Error('Failed to link stakeholder');
    }
  }

  async function handleCreateGlobalStakeholder(data: {
    name: string;
    role: string;
    email?: string;
  }) {
    try {
      const response = await fetch(`/api/stakeholders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to create stakeholder');
      await fetchData();
      setViewMode('list');
      showToast({ title: 'Stakeholder created', description: `${data.name} was added successfully.` });
    } catch (err) {
      showToast({ title: 'Failed to create stakeholder', description: err instanceof Error ? err.message : 'Unknown error', type: 'destructive' });
      throw new Error('Failed to create stakeholder');
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
      showToast({ title: 'Business unit updated', description: 'Changes were saved.' });
    } catch (err) {
      showToast({ title: 'Failed to update business unit', description: err instanceof Error ? err.message : 'Unknown error', type: 'destructive' });
      throw new Error('Failed to update business unit');
    }
  }

  const handleEditGoal = (goal: any) => {
    setEditingGoal(goal);
    // Open the Goal form modal in edit mode
    setViewMode('createGoal');
  };

  const handleCreateNewGoal = () => {
    setEditingGoal(null);
    setViewMode('createGoal');
  };

  async function handleCreateGoal(data: any) {
    if (!selectedUnit) return;

    try {
      setIsSubmitting(true);
      setError('');
      
      const response = await fetch(`/api/business-units/${selectedUnit.id}/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create goal');
      }
      
      await fetchData();
      setViewMode('detail');
      showToast({ title: 'Goal created', description: 'Goal was created successfully.' });
    } catch (err) {
      console.error('Error creating goal:', err);
      setError(err instanceof Error ? err.message : 'Failed to create goal');
      showToast({ title: 'Failed to create goal', description: err instanceof Error ? err.message : 'Unknown error', type: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateGoal = async (data: any) => {
    if (!selectedUnit || !editingGoal) return;

    try {
      setIsSubmitting(true);
      setError('');
      
      const response = await fetch(`/api/business-units/${selectedUnit.id}/goals/${editingGoal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update goal');
      }
      
      await fetchData();
      setViewMode('detail');
      showToast({ title: 'Goal updated', description: 'Goal changes were saved.' });
    } catch (err) {
      console.error('Error updating goal:', err);
      setError(err instanceof Error ? err.message : 'Failed to update goal');
      showToast({ title: 'Failed to update goal', description: err instanceof Error ? err.message : 'Unknown error', type: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  async function handleCreateStakeholder(data: {
    name: string;
    role: string;
    email?: string;
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
      showToast({ title: 'Stakeholder added', description: `${data.name} was added to ${selectedUnit.name}.` });
    } catch (err) {
      showToast({ title: 'Failed to add stakeholder', description: err instanceof Error ? err.message : 'Unknown error', type: 'destructive' });
      throw new Error('Failed to create stakeholder');
    }
  }

  const renderContent = () => {
    switch (viewMode) {
      case 'createGoal':
        return selectedUnit ? (
          <GoalFormModal
            isOpen={true}
            onClose={() => setViewMode('detail')}
            goal={editingGoal || undefined}
            onSubmit={editingGoal ? handleUpdateGoal : handleCreateGoal}
            isSubmitting={isSubmitting}
          />
        ) : null;
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
                  organizationId={selectedOrg.id}
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
                  onEditGoal={handleEditGoal}
                  onCreateGoal={handleCreateNewGoal}
                />
              </div>

              <div className="border-t border-gray-200 pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Stakeholders</h3>
                  <button
                    onClick={() => setViewMode('createStakeholder')}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                  >
                    New Stakeholder
                  </button>
                </div>
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                  <ul className="divide-y divide-gray-200">
                    {(selectedUnit.stakeholders || []).slice(0, 3).map((stakeholder) => (
                      <li key={stakeholder.id} className="px-4 py-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-blue-600">{stakeholder.name}</p>
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
                        View All Stakeholders
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ): null;

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
            <div className="bg-white shadow rounded-lg p-4 mb-6">
              <h3 className="text-md font-medium text-gray-900 mb-2">Link Existing Stakeholder</h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  className="mt-1 block w-full sm:w-auto rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  value={selectedExistingStakeholderId}
                  onChange={(e) => setSelectedExistingStakeholderId(e.target.value)}
                >
                  <option value="">Select a stakeholder</option>
                  {unassignedStakeholders.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.email ? `(${s.email})` : ''}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={!selectedExistingStakeholderId}
                  onClick={handleLinkExistingStakeholder}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  Link to Business Unit
                </button>
              </div>
            </div>
            <StakeholderForm
              businessUnit={selectedUnit}
              onSubmit={handleCreateStakeholder}
              onCancel={() => setViewMode('stakeholders')}
            />
          </div>
        ) : null;

      case 'createGlobalStakeholder':
        return (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Add Stakeholder</h2>
              <button
                onClick={() => setViewMode('list')}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
            <StakeholderForm
              onSubmit={handleCreateGlobalStakeholder}
              onCancel={() => setViewMode('list')}
            />
          </div>
        );

      default:
        return (
          <>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-semibold text-gray-900">Business Units</h1>
              {organizations.length > 0 && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setViewMode('createGlobalStakeholder')}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
                  >
                    New Stakeholder
                  </button>
                  <button
                    onClick={() => setViewMode('createUnit')}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                  >
                    New Business Unit
                  </button>
                </div>
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
                  <div key={org.id}>
                    <BusinessUnitList
                      businessUnits={businessUnits.filter(unit => unit.organization.id === org.id)}
                      onSelectUnit={(unit) => {
                        setSelectedUnit(unit);
                        setViewMode('detail');
                      }}
                      onAddStakeholder={(unit) => {
                        setSelectedUnit(unit);
                        setViewMode('createStakeholder');
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