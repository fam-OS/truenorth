'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PencilIcon, XMarkIcon, CheckIcon, PlusIcon } from '@heroicons/react/24/outline';

interface OrganizationProfileProps {
  organization: {
    id: string;
    name: string;
    description?: string | null;
    founderId?: string | null;
    employees?: string | null;
    headquarters?: string | null;
    launchedDate?: string | null;
    isPrivate?: boolean;
    tradedAs?: string | null;
    corporateIntranet?: string | null;
    glassdoorLink?: string | null;
    linkedinLink?: string | null;
    founder?: {
      id: string;
      name: string;
      role?: string | null;
    } | null;
    businessUnits?: Array<{
      id: string;
      name: string;
      description?: string | null;
      stakeholders?: Array<{
        id: string;
        name: string;
        role: string;
      }>;
    }>;
    ceoGoals?: Array<{
      id: string;
      description: string;
    }>;
  };
  onEdit?: () => void;
}

export default function OrganizationProfile({ organization, onEdit }: OrganizationProfileProps) {
  const [isEditingOverview, setIsEditingOverview] = useState(false);
  const [overviewData, setOverviewData] = useState({
    name: organization.name,
    description: organization.description || '',
    founderId: organization.founderId || '',
    employees: organization.employees || '',
    headquarters: organization.headquarters || '',
    launchedDate: organization.launchedDate || '',
    isPrivate: organization.isPrivate ?? true,
    tradedAs: organization.tradedAs || '',
    corporateIntranet: organization.corporateIntranet || '',
    glassdoorLink: organization.glassdoorLink || '',
    linkedinLink: organization.linkedinLink || ''
  });
  const [teamMembers, setTeamMembers] = useState<{id: string, name: string, role?: string}[]>([]);
  const [showCreateMember, setShowCreateMember] = useState(false);
  const [newMemberData, setNewMemberData] = useState({ name: '', email: '', role: '' });
  const [creatingMember, setCreatingMember] = useState(false);
  const [savingOverview, setSavingOverview] = useState(false);

  const executiveTeam = organization.businessUnits?.flatMap(bu => 
    bu.stakeholders?.filter(s => 
      ['CEO', 'COO', 'CTO', 'CIO', 'CFO', 'Executive', 'Director'].includes(s.role)
    ) || []
  ) || [];

  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const response = await fetch('/api/team-members');
        if (response.ok) {
          const members = await response.json();
          setTeamMembers(members);
        }
      } catch (error) {
        console.error('Error fetching team members:', error);
      }
    };
    fetchTeamMembers();
  }, []);

  const handleCreateTeamMember = async () => {
    if (!newMemberData.name.trim()) return;
    
    setCreatingMember(true);
    try {
      let teamId = '';
      
      const teamsResponse = await fetch('/api/teams');
      if (teamsResponse.ok) {
        const teams = await teamsResponse.json();
        if (teams.length > 0) {
          teamId = teams[0].id;
        } else {
          const createTeamResponse = await fetch('/api/teams', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: 'General Team',
              description: 'Default team for organization members'
            })
          });
          if (createTeamResponse.ok) {
            const newTeam = await createTeamResponse.json();
            teamId = newTeam.id;
          }
        }
      }

      if (teamId) {
        const response = await fetch(`/api/teams/${teamId}/members`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newMemberData)
        });

        if (response.ok) {
          const newMember = await response.json();
          setTeamMembers(prev => [...prev, {
            id: newMember.id,
            name: newMember.name,
            role: newMember.role
          }]);
          setOverviewData(prev => ({ ...prev, founderId: newMember.id }));
          setNewMemberData({ name: '', email: '', role: '' });
          setShowCreateMember(false);
        }
      }
    } catch (error) {
      console.error('Error creating team member:', error);
    } finally {
      setCreatingMember(false);
    }
  };

  const handleSaveOverview = async () => {
    setSavingOverview(true);
    try {
      const response = await fetch(`/api/organizations/${organization.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(overviewData)
      });

      if (response.ok) {
        setIsEditingOverview(false);
        window.location.reload(); // Refresh to show updated data
      }
    } catch (error) {
      console.error('Error saving overview:', error);
    } finally {
      setSavingOverview(false);
    }
  };

  const handleCancelEdit = () => {
    setOverviewData({
      name: organization.name,
      description: organization.description || '',
      founderId: organization.founderId || '',
      employees: organization.employees || '',
      headquarters: organization.headquarters || '',
      launchedDate: organization.launchedDate || '',
      isPrivate: organization.isPrivate ?? true,
      tradedAs: organization.tradedAs || '',
      corporateIntranet: organization.corporateIntranet || '',
      glassdoorLink: organization.glassdoorLink || '',
      linkedinLink: organization.linkedinLink || ''
    });
    setIsEditingOverview(false);
    setShowCreateMember(false);
  };

  return (
    <div className="bg-white shadow rounded-lg">
      {/* Organization Overview Section */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Organization Overview</h2>
          <div className="flex space-x-2">
            {!isEditingOverview ? (
              <button
                onClick={() => setIsEditingOverview(true)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit Overview
              </button>
            ) : (
              <>
                <button
                  onClick={handleCancelEdit}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <XMarkIcon className="h-4 w-4 mr-2" />
                  Cancel
                </button>
                <button
                  onClick={handleSaveOverview}
                  disabled={savingOverview}
                  className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <CheckIcon className="h-4 w-4 mr-2" />
                  {savingOverview ? 'Saving...' : 'Save'}
                </button>
              </>
            )}
          </div>
        </div>

        {isEditingOverview ? (
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Organization Name</label>
              <input
                type="text"
                value={overviewData.name}
                onChange={(e) => setOverviewData(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={overviewData.description}
                onChange={(e) => setOverviewData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Founder */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Founder</label>
                <div className="mt-1 flex">
                  <select
                    value={overviewData.founderId}
                    onChange={(e) => setOverviewData(prev => ({ ...prev, founderId: e.target.value }))}
                    className="block w-full rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="">Select Founder</option>
                    {teamMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name} {member.role ? `(${member.role})` : ''}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => setShowCreateMember(true)}
                    className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 bg-gray-50 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-r-md"
                  >
                    <PlusIcon className="h-4 w-4" />
                  </button>
                </div>
                
                {/* Create New Member Form */}
                {showCreateMember && (
                  <div className="mt-2 p-3 border border-gray-200 rounded-md bg-gray-50">
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Name"
                        value={newMemberData.name}
                        onChange={(e) => setNewMemberData(prev => ({ ...prev, name: e.target.value }))}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                      <input
                        type="email"
                        placeholder="Email"
                        value={newMemberData.email}
                        onChange={(e) => setNewMemberData(prev => ({ ...prev, email: e.target.value }))}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Role"
                        value={newMemberData.role}
                        onChange={(e) => setNewMemberData(prev => ({ ...prev, role: e.target.value }))}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={handleCreateTeamMember}
                          disabled={creatingMember || !newMemberData.name.trim()}
                          className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                        >
                          {creatingMember ? 'Creating...' : 'Create Member'}
                        </button>
                        <button
                          onClick={() => {
                            setShowCreateMember(false);
                            setNewMemberData({ name: '', email: '', role: '' });
                          }}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Employees */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Employees</label>
                <input
                  type="text"
                  value={overviewData.employees}
                  onChange={(e) => setOverviewData(prev => ({ ...prev, employees: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="e.g., 50-100"
                />
              </div>

              {/* Headquarters */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Headquarters</label>
                <input
                  type="text"
                  value={overviewData.headquarters}
                  onChange={(e) => setOverviewData(prev => ({ ...prev, headquarters: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="City, State/Country"
                />
              </div>

              {/* Launch Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Launch Date</label>
                <input
                  type="text"
                  value={overviewData.launchedDate}
                  onChange={(e) => setOverviewData(prev => ({ ...prev, launchedDate: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="e.g., January 2020"
                />
              </div>

              {/* Company Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Company Type</label>
                <select
                  value={overviewData.isPrivate ? 'private' : 'public'}
                  onChange={(e) => setOverviewData(prev => ({ ...prev, isPrivate: e.target.value === 'private' }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="private">Private</option>
                  <option value="public">Public</option>
                </select>
              </div>

              {/* Traded As (only for public companies) */}
              {!overviewData.isPrivate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Traded As</label>
                  <input
                    type="text"
                    value={overviewData.tradedAs}
                    onChange={(e) => setOverviewData(prev => ({ ...prev, tradedAs: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="e.g., NASDAQ: AAPL"
                  />
                </div>
              )}
            </div>

            {/* Links */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700">External Links</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Corporate Intranet</label>
                  <input
                    type="url"
                    value={overviewData.corporateIntranet}
                    onChange={(e) => setOverviewData(prev => ({ ...prev, corporateIntranet: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Glassdoor Link</label>
                  <input
                    type="url"
                    value={overviewData.glassdoorLink}
                    onChange={(e) => setOverviewData(prev => ({ ...prev, glassdoorLink: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="https://glassdoor.com/..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">LinkedIn Link</label>
                  <input
                    type="url"
                    value={overviewData.linkedinLink}
                    onChange={(e) => setOverviewData(prev => ({ ...prev, linkedinLink: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="https://linkedin.com/company/..."
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{organization.name}</h2>
            {organization.description && (
              <p className="mt-1 text-sm text-gray-600">{organization.description}</p>
            )}
          </div>
        )}
      </div>

      {/* Organization Details - Read Only View */}
      {!isEditingOverview && (
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Founder */}
            {organization.founder && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Founder</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {organization.founder.name}
                  {organization.founder.role && (
                    <span className="ml-2 text-gray-500">({organization.founder.role})</span>
                  )}
                </dd>
              </div>
            )}

            {/* Employees */}
            {organization.employees && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Employees</dt>
                <dd className="mt-1 text-sm text-gray-900">{organization.employees}</dd>
              </div>
            )}

            {/* Headquarters */}
            {organization.headquarters && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Headquarters</dt>
                <dd className="mt-1 text-sm text-gray-900">{organization.headquarters}</dd>
              </div>
            )}

            {/* Launched Date */}
            {organization.launchedDate && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Launched</dt>
                <dd className="mt-1 text-sm text-gray-900">{organization.launchedDate}</dd>
              </div>
            )}

            {/* Company Type */}
            <div>
              <dt className="text-sm font-medium text-gray-500">Company Type</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {organization.isPrivate ? 'Private' : 'Public'}
                {!organization.isPrivate && organization.tradedAs && (
                  <span className="ml-2 text-gray-600">({organization.tradedAs})</span>
                )}
              </dd>
            </div>
          </div>

          {/* Links Section */}
          {(organization.corporateIntranet || organization.glassdoorLink || organization.linkedinLink) && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-3">Links</h3>
              <div className="flex flex-wrap gap-4">
                {organization.corporateIntranet && (
                  <a
                    href={organization.corporateIntranet}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200"
                  >
                    🏢 Corporate Intranet
                  </a>
                )}
                {organization.glassdoorLink && (
                  <a
                    href={organization.glassdoorLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 hover:bg-green-200"
                  >
                    💼 Glassdoor
                  </a>
                )}
                {organization.linkedinLink && (
                  <a
                    href={organization.linkedinLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200"
                  >
                    🔗 LinkedIn
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      )}

        {/* Executive Team */}
        {executiveTeam.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Executive Team</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {executiveTeam.map((exec) => (
                <div key={exec.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {exec.name.charAt(0)}
                      </span>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{exec.name}</p>
                    <p className="text-xs text-gray-500">{exec.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Business Units */}
        {organization.businessUnits && organization.businessUnits.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Business Units</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {organization.businessUnits.map((bu) => (
                <Link
                  key={bu.id}
                  href={`/business-units/${bu.id}`}
                  className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <h4 className="font-medium text-gray-900">{bu.name}</h4>
                  {bu.description && (
                    <p className="mt-1 text-sm text-gray-600">{bu.description}</p>
                  )}
                  {bu.stakeholders && bu.stakeholders.length > 0 && (
                    <p className="mt-2 text-xs text-gray-500">
                      {bu.stakeholders.length} stakeholder{bu.stakeholders.length !== 1 ? 's' : ''}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* CEO Goals */}
        {organization.ceoGoals && organization.ceoGoals.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-500 mb-3">CEO Goals</h3>
            <div className="space-y-2">
              {organization.ceoGoals.map((goal, index) => (
                <div key={goal.id} className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                  <span className="flex-shrink-0 w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center text-xs font-medium text-yellow-800">
                    {index + 1}
                  </span>
                  <p className="text-sm text-gray-900">{goal.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
