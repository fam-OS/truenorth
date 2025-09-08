'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type React from 'react';
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
  const [companyAccount, setCompanyAccount] = useState<any>(null);
  const [businessUnits, setBusinessUnits] = useState<BusinessUnitWithDetails[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<BusinessUnitWithDetails | null>(null);
  const [needsCompanyAccount, setNeedsCompanyAccount] = useState(false);
  const [selectedStakeholder, setSelectedStakeholder] = useState<any | null>(null);
  const [unassignedStakeholders, setUnassignedStakeholders] = useState<any[]>([]);
  const [allStakeholders, setAllStakeholders] = useState<any[]>([]);
  const [selectedExistingStakeholderId, setSelectedExistingStakeholderId] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Search state for 3-column overview
  const [searchBU, setSearchBU] = useState('');
  const [searchStake, setSearchStake] = useState('');
  const [searchGoal, setSearchGoal] = useState('');
  const [recentGoals, setRecentGoals] = useState<any[]>([]);
  const isMounted = useRef(false);
  const initialFetchDone = useRef(false);
  const { showToast } = useToast();

  // Stakeholder delete confirmation modal state
  const [isDeleteStakeholderModalOpen, setIsDeleteStakeholderModalOpen] = useState(false);
  const [stakeholderToRemove, setStakeholderToRemove] = useState<null | { id: string; name?: string }>(null);
  const [isDeletingStakeholder, setIsDeletingStakeholder] = useState(false);

  const fetchData = useCallback(async () => {
    if (!isMounted.current) return;
    
    try {
      setIsLoading(true);
      console.log('Fetching business units data...');
      
      // First check for company account
      const accountResponse = await fetch('/api/company-account', {
        cache: 'no-store',
        signal: AbortSignal.timeout(5000)
      });
      
      console.log('Company account response status:', accountResponse.status);
      
      if (!accountResponse.ok) {
        if (accountResponse.status === 404) {
          console.log('No company account found, showing creation prompt');
          setNeedsCompanyAccount(true);
          setIsLoading(false);
          return;
        }
        throw new Error('Failed to fetch company account');
      }
      
      const accountData = await accountResponse.json();
      console.log('Company account data:', accountData);
      setCompanyAccount(accountData);
      setNeedsCompanyAccount(false);
      
      // Fetch business units directly
      const businessUnitsResponse = await fetch('/api/business-units', {
        cache: 'no-store',
        signal: AbortSignal.timeout(5000)
      });
      
      console.log('Business units response status:', businessUnitsResponse.status);
      
      if (!businessUnitsResponse.ok) {
        console.error('Failed to fetch business units');
        setBusinessUnits([]);
        return;
      }
      
      const businessUnitsData = await businessUnitsResponse.json();
      console.log('Business units data:', businessUnitsData);

      if (!isMounted.current) return;

      setBusinessUnits(businessUnitsData);

      // Fetch all stakeholders for global list section
      try {
        const stakeholdersRes = await fetch('/api/stakeholders', { cache: 'no-store', signal: AbortSignal.timeout(5000) });
        if (stakeholdersRes.ok) {
          const sh = await stakeholdersRes.json();
          if (isMounted.current) setAllStakeholders(Array.isArray(sh) ? sh : []);
        } else {
          if (isMounted.current) setAllStakeholders([]);
        }
      } catch {
        if (isMounted.current) setAllStakeholders([]);
      }

      // Fetch recent goals for overview
      try {
        const goalsRes = await fetch('/api/goals?recentDays=30&limit=5', { cache: 'no-store', signal: AbortSignal.timeout(5000) });
        if (goalsRes.ok) {
          const g = await goalsRes.json();
          if (isMounted.current) setRecentGoals(Array.isArray(g) ? g : []);
        } else {
          if (isMounted.current) setRecentGoals([]);
        }
      } catch {
        if (isMounted.current) setRecentGoals([]);
      }

      if (selectedUnit) {
        const updatedUnit = businessUnitsData.find((unit: BusinessUnitWithDetails) => unit.id === selectedUnit.id);
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

  // Load assignable stakeholders when opening add-stakeholder view
  useEffect(() => {
    if (viewMode === 'createStakeholder' && selectedUnit) {
      void (async () => {
        try {
          const res = await fetch(
            `/api/stakeholders?includeAssigned=true&businessUnitId=${encodeURIComponent(selectedUnit.id)}`,
            { cache: 'no-store' }
          );
          if (res.ok) {
            const list = await res.json();
            setUnassignedStakeholders(list);
          } else {
            setUnassignedStakeholders([]);
          }
        } catch (e) {
          setUnassignedStakeholders([]);
        }
      })();
    }
  }, [viewMode, selectedUnit?.id]);

  async function handleCreateBusinessUnit({ name, description }: { name: string; description?: string }) {
    if (!companyAccount) {
      showToast({ title: 'Company account required', description: 'Please create a company account first.', type: 'destructive' });
      return;
    }

    try {
      const response = await fetch('/api/business-units', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, companyAccountId: companyAccount.id }),
      });

      if (!response.ok) throw new Error('Failed to create business unit');
      
      await fetchData();
      setViewMode('list');
      showToast({ title: 'Business unit created', description: `${name} was added successfully.` });
    } catch (err) {
      showToast({ title: 'Failed to create business unit', description: err instanceof Error ? err.message : 'Unknown error', type: 'destructive' });
      throw new Error('Failed to create business unit');
    }
  }

  function handleRemoveStakeholder(s: { id: string; name?: string }) {
    // Open confirmation modal instead of deleting immediately
    setStakeholderToRemove({ id: s.id, name: s.name });
    setIsDeleteStakeholderModalOpen(true);
  }

  async function handleConfirmRemoveStakeholder(e?: React.MouseEvent<HTMLButtonElement>) {
    e?.preventDefault();
    e?.stopPropagation();

    if (!selectedUnit || !stakeholderToRemove) return;
    const stakeholderId = stakeholderToRemove.id;
    try {
      setIsDeletingStakeholder(true);
      console.log('[Stakeholder Delete] Confirming removal…', { businessUnitId: selectedUnit.id, stakeholderId });

      console.log('[Stakeholder Delete] Sending DELETE…');
      const response = await fetch(`/api/business-units/${selectedUnit.id}/stakeholders`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stakeholderId }),
        cache: 'no-store',
        signal: AbortSignal.timeout(10000)
      });

      let raw = '';
      try {
        raw = await response.text();
      } catch {}
      console.log('[Stakeholder Delete] Response:', { status: response.status, ok: response.ok, raw });

      if (!response.ok && response.status !== 204) {
        const msg = raw || 'Failed to remove stakeholder';
        showToast({ title: 'Failed to remove stakeholder', description: `Status ${response.status}: ${msg}`, type: 'destructive' });
        return;
      }

      // Preserve current view after deletion (if initiated from the stakeholders view, stay there)
      const currentView = viewMode;
      await fetchData();
      setViewMode(currentView === 'stakeholders' ? 'stakeholders' : 'detail');
      showToast({ title: 'Stakeholder removed', description: stakeholderToRemove.name ? `${stakeholderToRemove.name} was unlinked from this business unit.` : 'Stakeholder was unlinked from this business unit.' });
      setIsDeleteStakeholderModalOpen(false);
      setStakeholderToRemove(null);
    } catch (err) {
      console.error('[Stakeholder Delete] Error:', err);
      showToast({ title: 'Failed to remove stakeholder', description: err instanceof Error ? err.message : 'Unknown error', type: 'destructive' });
    } finally {
      setIsDeletingStakeholder(false);
    }
  }

  function handleCancelRemoveStakeholder(e?: React.MouseEvent<HTMLButtonElement>) {
    e?.preventDefault();
    e?.stopPropagation();
    setIsDeleteStakeholderModalOpen(false);
    setStakeholderToRemove(null);
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

  async function handleCreateGlobalStakeholder(data: { teamMemberId: string }) {
    try {
      const response = await fetch(`/api/stakeholders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to create stakeholder');
      await fetchData();
      setViewMode('list');
      showToast({ title: 'Stakeholder created', description: `Stakeholder was added successfully.` });
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
    // Allow creating from global modal by using selectedUnit OR the BU chosen in the form
    const targetBU = selectedUnit?.id || data.businessUnitId;
    if (!targetBU) {
      showToast({ title: 'Business unit required', description: 'Please select a Business Unit for this goal.', type: 'destructive' });
      return;
    }
    try {
      setIsSubmitting(true);
      setError('');
      
      const response = await fetch(`/api/business-units/${targetBU}/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        let raw = '';
        try { raw = await response.clone().text(); } catch {}
        let msg = 'Failed to create goal';
        try {
          const json = JSON.parse(raw || '{}');
          msg = json.error || json.message || msg;
        } catch {
          msg = raw || msg;
        }
        throw new Error(msg);
      }
      
      await fetchData();
      setViewMode(selectedUnit ? 'detail' : 'list');
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

  async function handleCreateStakeholder(data: { teamMemberId: string }) {
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
      showToast({ title: 'Stakeholder added', description: `Stakeholder was added to ${selectedUnit.name}.` });
    } catch (err) {
      showToast({ title: 'Failed to add stakeholder', description: err instanceof Error ? err.message : 'Unknown error', type: 'destructive' });
      throw new Error('Failed to create stakeholder');
    }
  }

  const renderContent = () => {
    switch (viewMode) {
      case 'createGoal':
        return (
          <GoalFormModal
            isOpen={true}
            onClose={() => setViewMode(selectedUnit ? 'detail' : 'list')}
            goal={(editingGoal || (selectedUnit ? ({ businessUnitId: selectedUnit.id } as any) : undefined))}
            onSubmit={editingGoal ? handleUpdateGoal : handleCreateGoal}
            isSubmitting={isSubmitting}
          />
        );
      case 'createUnit':
        return (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Create New Business Unit
            </h2>
            <BusinessUnitForm
              onSubmit={handleCreateBusinessUnit}
              onCancel={() => setViewMode('list')}
            />
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
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                  <h2 className="text-lg font-medium text-gray-900">Goals</h2>
                  <button
                    onClick={() => setViewMode('createGoal')}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    New Goal
                  </button>
                </div>
                <GoalList
                  goals={selectedUnit.Goal || []}
                  onEditGoal={handleEditGoal}
                  onSelectGoal={(goal) => {
                    // Navigate to goal detail page
                    window.location.href = `/goals/${goal.id}`;
                  }}
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
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <button
                              onClick={() => window.location.href = `/stakeholders/${stakeholder.id}`}
                              className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline truncate"
                            >
                              {stakeholder.name}
                            </button>
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 whitespace-nowrap">
                              {stakeholder.role}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={(ev) => { ev.preventDefault(); ev.stopPropagation(); handleRemoveStakeholder({ id: stakeholder.id, name: stakeholder.name }); }}
                            className="text-xs text-red-600 hover:text-red-800"
                            title="Remove from this business unit"
                          >
                            Remove
                          </button>
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
              stakeholders={selectedUnit.Stakeholder || []}
              onSelectStakeholder={setSelectedStakeholder}
              onCreateStakeholder={() => setViewMode('createStakeholder')}
              onRemoveStakeholder={(s) => handleRemoveStakeholder({ id: s.id, name: s.name })}
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
              <h1 className="text-2xl font-semibold text-gray-900">Company Business Units</h1>
              {companyAccount && (
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
                  <button
                    onClick={() => { setEditingGoal(null); setViewMode('createGoal'); }}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    New Goal
                  </button>
                </div>
              )}
            </div>
            {needsCompanyAccount ? (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Company Account Required</h3>
                <p className="text-gray-500 mb-4">You need to create a company account before you can add business units.</p>
                <button
                  onClick={() => window.location.href = '/organizations'}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                  Create Company Account
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Column 1: Business Units */}
                <div className="bg-white shadow rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-semibold">Business Units</h2>
                    <button className="text-sm text-blue-600 hover:underline" onClick={() => window.location.href = '/business-units'}>View all</button>
                  </div>
                  <input
                    className="w-full mb-3 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="Search Business Units..."
                    value={searchBU}
                    onChange={(e) => setSearchBU(e.target.value)}
                  />
                  <ul className="divide-y divide-gray-200">
                    {businessUnits
                      .filter((u) => (u.name || '').toLowerCase().includes(searchBU.toLowerCase()))
                      .sort((a, b) => new Date(b.updatedAt || b.createdAt as any).getTime() - new Date(a.updatedAt || a.createdAt as any).getTime())
                      .slice(0, 5)
                      .map((u) => (
                        <li key={u.id} className="py-2 flex justify-between items-center">
                          <button className="text-sm text-blue-600 hover:underline" onClick={() => { setSelectedUnit(u); setViewMode('detail'); }}>{u.name}</button>
                        </li>
                      ))}
                    {businessUnits.length === 0 && (
                      <li className="py-6 text-sm text-gray-500 text-center">No business units</li>
                    )}
                  </ul>
                </div>

                {/* Column 2: Stakeholders */}
                <div className="bg-white shadow rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-semibold">Stakeholders</h2>
                    <button className="text-sm text-blue-600 hover:underline" onClick={() => window.location.href = '/stakeholders'}>View all</button>
                  </div>
                  <input
                    className="w-full mb-3 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="Search Stakeholders..."
                    value={searchStake}
                    onChange={(e) => setSearchStake(e.target.value)}
                  />
                  <ul className="divide-y divide-gray-200">
                    {allStakeholders
                      .filter((s) => (s.name || '').toLowerCase().includes(searchStake.toLowerCase()))
                      .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
                      .slice(0, 5)
                      .map((s) => (
                        <li key={s.id} className="py-2 flex justify-between items-center">
                          <button className="text-sm text-blue-600 hover:underline" onClick={() => window.location.href = `/stakeholders/${s.id}`}>{s.name}</button>
                          <span className="text-xs text-gray-500">{s.role}</span>
                        </li>
                      ))}
                    {allStakeholders.length === 0 && (
                      <li className="py-6 text-sm text-gray-500 text-center">No stakeholders</li>
                    )}
                  </ul>
                </div>

                {/* Column 3: Goals */}
                <div className="bg-white shadow rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-semibold">Goals</h2>
                    <button className="text-sm text-blue-600 hover:underline" onClick={() => window.location.href = '/initiatives-kpis'}>View all</button>
                  </div>
                  <input
                    className="w-full mb-3 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="Search Goals..."
                    value={searchGoal}
                    onChange={(e) => setSearchGoal(e.target.value)}
                  />
                  <ul className="divide-y divide-gray-200">
                    {recentGoals
                      .filter((g) => (g.title || '').toLowerCase().includes(searchGoal.toLowerCase()))
                      .map((g) => (
                        <li key={g.id} className="py-2 flex justify-between items-center">
                          <button className="text-sm text-blue-600 hover:underline" onClick={() => window.location.href = `/goals/${g.id}`}>{g.title}</button>
                          <span className="text-xs text-gray-500">{g.quarter} {g.year} {g.status ? `| ${g.status}` : ''}</span>
                        </li>
                      ))}
                    {recentGoals.length === 0 && (
                      <li className="py-6 text-sm text-gray-500 text-center">No goals</li>
                    )}
                  </ul>
                </div>
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

      {/* Delete Stakeholder Confirmation Modal */}
      {isDeleteStakeholderModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          >
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">Remove stakeholder?</h3>
            </div>
            <div className="px-6 py-4">
              <p className="text-sm text-gray-600">
                {stakeholderToRemove?.name ? (
                  <>Are you sure you want to remove <span className="font-semibold">{stakeholderToRemove.name}</span> from this business unit?</>
                ) : (
                  <>Are you sure you want to remove this stakeholder from this business unit?</>
                )}
              </p>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button
                type="button"
                className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                onClick={handleCancelRemoveStakeholder}
                disabled={isDeletingStakeholder}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                onClick={handleConfirmRemoveStakeholder}
                disabled={isDeletingStakeholder}
              >
                {isDeletingStakeholder ? 'Removing…' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}