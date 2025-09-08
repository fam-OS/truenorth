'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Pencil, Save, X, Plus, ExternalLink } from 'lucide-react'

interface TeamMember {
  id: string
  name: string
  email?: string
  role?: string
}

interface CompanyAccount {
  id: string
  name: string
  description?: string
  founderId?: string
  employees?: string
  headquarters?: string
  launchedDate?: string
  isPrivate: boolean
  tradedAs?: string
  corporateIntranet?: string
  glassdoorLink?: string
  linkedinLink?: string
  founder?: TeamMember
  organizations: any[]
}

interface AccountProfileProps {
  companyAccount: CompanyAccount | null
  onUpdate?: () => void
}

export default function AccountProfile({ companyAccount, onUpdate }: AccountProfileProps) {
  const [isEditingOverview, setIsEditingOverview] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [newMemberName, setNewMemberName] = useState('')
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [showNewMemberForm, setShowNewMemberForm] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(true)

  const [overviewData, setOverviewData] = useState({
    name: companyAccount?.name || '',
    description: companyAccount?.description || '',
    founderId: companyAccount?.founderId || '',
    employees: companyAccount?.employees || '',
    headquarters: companyAccount?.headquarters || '',
    launchedDate: companyAccount?.launchedDate || '',
    isPrivate: companyAccount?.isPrivate ?? true,
    tradedAs: companyAccount?.tradedAs || '',
    corporateIntranet: companyAccount?.corporateIntranet || '',
    glassdoorLink: companyAccount?.glassdoorLink || '',
    linkedinLink: companyAccount?.linkedinLink || '',
  })

  useEffect(() => {
    if (companyAccount) {
      setOverviewData({
        name: companyAccount.name || '',
        description: companyAccount.description || '',
        founderId: companyAccount.founderId || '',
        employees: companyAccount.employees || '',
        headquarters: companyAccount.headquarters || '',
        launchedDate: companyAccount.launchedDate || '',
        isPrivate: companyAccount.isPrivate ?? true,
        tradedAs: companyAccount.tradedAs || '',
        corporateIntranet: companyAccount.corporateIntranet || '',
        glassdoorLink: companyAccount.glassdoorLink || '',
        linkedinLink: companyAccount.linkedinLink || '',
      })
    }
  }, [companyAccount])

  useEffect(() => {
    fetchTeamMembers()
  }, [])

  const fetchTeamMembers = async () => {
    try {
      const response = await fetch('/api/team-members')
      if (response.ok) {
        const data = await response.json()
        setTeamMembers(data)
      }
    } catch (error) {
      console.error('Error fetching team members:', error)
    }
  }

  const handleSaveOverview = async () => {
    if (!companyAccount) return
    
    setIsLoading(true)
    try {
      const response = await fetch(`/api/company-account/${companyAccount.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(overviewData),
      })

      if (response.ok) {
        setIsEditingOverview(false)
        setIsCollapsed(true)
        onUpdate?.()
        window.location.reload()
      } else {
        const errorData = await response.json()
        console.error('Failed to update company account:', errorData)
        console.error('Response status:', response.status)
      }
    } catch (error) {
      console.error('Error updating company account:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateCompany = async () => {
    setIsLoading(true)
    try {
      console.log('Creating company account with data:', overviewData)
      
      const response = await fetch('/api/company-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(overviewData),
      })

      console.log('Response status:', response.status)
      console.log('Response headers:', response.headers)

      if (response.ok) {
        const responseData = await response.json()
        console.log('Company account created successfully:', responseData)
        setIsEditingOverview(false)
        onUpdate?.()
        window.location.reload()
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Failed to create company account:', errorData)
        console.error('Response status:', response.status)
        console.error('Response statusText:', response.statusText)
        
        if (response.status === 401) {
          alert('Please sign in to create a company account. Redirecting to sign in page...')
          window.location.href = '/auth/signin'
        } else {
          alert(`Error: ${errorData.error || `HTTP ${response.status}: ${response.statusText}`}`)
        }
      }
    } catch (error) {
      console.error('Error creating company account:', error)
      alert('Network error occurred while creating company account')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelEdit = () => {
    if (companyAccount) {
      setOverviewData({
        name: companyAccount.name || '',
        description: companyAccount.description || '',
        founderId: companyAccount.founderId || '',
        employees: companyAccount.employees || '',
        headquarters: companyAccount.headquarters || '',
        launchedDate: companyAccount.launchedDate || '',
        isPrivate: companyAccount.isPrivate ?? true,
        tradedAs: companyAccount.tradedAs || '',
        corporateIntranet: companyAccount.corporateIntranet || '',
        glassdoorLink: companyAccount.glassdoorLink || '',
        linkedinLink: companyAccount.linkedinLink || '',
      })
    }
    setIsEditingOverview(false)
    setShowNewMemberForm(false)
    setNewMemberName('')
    setNewMemberEmail('')
  }

  const handleCreateTeamMember = async () => {
    if (!newMemberName.trim()) return

    try {
      // First, ensure there's a team for this organization
      const teamResponse = await fetch('/api/teams')
      let teams = []
      if (teamResponse.ok) {
        teams = await teamResponse.json()
      }

      let teamId = null
      if (teams.length === 0 && companyAccount?.organizations && companyAccount.organizations.length > 0) {
        // Create a default team for the first organization
        const createTeamResponse = await fetch('/api/teams', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: 'Executive Team',
            organizationId: companyAccount.organizations[0].id,
          }),
        })

        if (createTeamResponse.ok) {
          const newTeam = await createTeamResponse.json()
          teamId = newTeam.id
        }
      } else if (teams.length > 0) {
        teamId = teams[0].id
      }

      if (!teamId) {
        console.error('No team available to add member to')
        return
      }

      // Create the team member
      const memberResponse = await fetch('/api/team-members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newMemberName,
          email: newMemberEmail || undefined,
          teamId: teamId,
          role: 'Founder',
        }),
      })

      if (memberResponse.ok) {
        const newMember = await memberResponse.json()
        setTeamMembers([...teamMembers, newMember])
        
        // Update the company account with the new founder
        const updatedOverviewData = { ...overviewData, founderId: newMember.id }
        setOverviewData(updatedOverviewData)
        
        // Automatically save the company account with the new founder
        if (companyAccount?.id) {
          try {
            const updateResponse = await fetch(`/api/company-account/${companyAccount.id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(updatedOverviewData),
            })
            
            if (updateResponse.ok) {
              console.log('Company account updated with new founder')
              // Refresh the page to show the updated founder
              window.location.reload()
            } else {
              console.error('Failed to update company account with founder')
            }
          } catch (error) {
            console.error('Error updating company account:', error)
          }
        }
        
        setShowNewMemberForm(false)
        setNewMemberName('')
        setNewMemberEmail('')
      }
    } catch (error) {
      console.error('Error creating team member:', error)
    }
  }

  if (!companyAccount) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-100">Company Overview</CardTitle>
        </CardHeader>
        <CardContent>
          {!isEditingOverview ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No company account found. Please create one to get started.</p>
              <Button
                onClick={() => setIsEditingOverview(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Company
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Company Name */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Company Name *
                </label>
                <Input
                  value={overviewData.name}
                  onChange={(e) => setOverviewData({ ...overviewData, name: e.target.value })}
                  placeholder="Enter company name"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Description
                </label>
                <Textarea
                  value={overviewData.description}
                  onChange={(e) => setOverviewData({ ...overviewData, description: e.target.value })}
                  placeholder="Enter company description"
                  rows={3}
                />
              </div>

              {/* Company Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Employees */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Employees
                  </label>
                  <Input
                    value={overviewData.employees}
                    onChange={(e) => setOverviewData({ ...overviewData, employees: e.target.value })}
                    placeholder="e.g., 50-100"
                  />
                </div>

                {/* Headquarters */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Headquarters
                  </label>
                  <Input
                    value={overviewData.headquarters}
                    onChange={(e) => setOverviewData({ ...overviewData, headquarters: e.target.value })}
                    placeholder="e.g., San Francisco, CA"
                  />
                </div>

                {/* Company founded */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Company founded
                  </label>
                  <Input
                    value={overviewData.launchedDate}
                    onChange={(e) => setOverviewData({ ...overviewData, launchedDate: e.target.value })}
                    placeholder="e.g., January 2020"
                  />
                </div>

                {/* Company Type */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Company Type
                  </label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={overviewData.isPrivate ? "default" : "outline"}
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Private button clicked, current isPrivate:', overviewData.isPrivate);
                        setOverviewData({ ...overviewData, isPrivate: true });
                      }}
                    >
                      Private
                    </Button>
                    <Button
                      type="button"
                      variant={!overviewData.isPrivate ? "default" : "outline"}
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Public button clicked, current isPrivate:', overviewData.isPrivate);
                        setOverviewData({ ...overviewData, isPrivate: false });
                      }}
                    >
                      Public
                    </Button>
                  </div>
                  {!overviewData.isPrivate && (
                    <Input
                      className="mt-2"
                      value={overviewData.tradedAs}
                      onChange={(e) => setOverviewData({ ...overviewData, tradedAs: e.target.value })}
                      placeholder="e.g., NASDAQ: AAPL"
                    />
                  )}
                </div>
              </div>

              {/* External Links */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-3 block">
                  External Links
                </label>
                <div className="space-y-3">
                  {/* Corporate Intranet */}
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Corporate Intranet</label>
                    <Input
                      value={overviewData.corporateIntranet}
                      onChange={(e) => setOverviewData({ ...overviewData, corporateIntranet: e.target.value })}
                      placeholder="https://intranet.company.com"
                    />
                  </div>

                  {/* Glassdoor */}
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Glassdoor</label>
                    <Input
                      value={overviewData.glassdoorLink}
                      onChange={(e) => setOverviewData({ ...overviewData, glassdoorLink: e.target.value })}
                      placeholder="https://glassdoor.com/company/..."
                    />
                  </div>

                  {/* LinkedIn */}
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">LinkedIn</label>
                    <Input
                      value={overviewData.linkedinLink}
                      onChange={(e) => setOverviewData({ ...overviewData, linkedinLink: e.target.value })}
                      placeholder="https://linkedin.com/company/..."
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={isLoading}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateCompany}
                  disabled={isLoading || !overviewData.name.trim()}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? 'Creating...' : 'Create Company'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-gray-100">Company Overview</CardTitle>
        {isCollapsed ? (
          <Button variant="outline" size="sm" className="text-gray-100 hover:text-gray-100" onClick={() => setIsCollapsed(false)}>
            Show
          </Button>
        ) : !isEditingOverview ? (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-gray-100 hover:text-gray-100"
              onClick={() => setIsEditingOverview(true)}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-gray-100 hover:text-gray-100"
              onClick={() => setIsCollapsed(true)}
            >
              Hide
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-gray-100 hover:text-gray-100"
              onClick={handleCancelEdit}
              disabled={isLoading}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button variant="outline" size="sm" className="text-gray-100 hover:text-gray-100" onClick={handleSaveOverview} disabled={isLoading}>
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        )}
      </CardHeader>
      {!isCollapsed && (
      <CardContent className="space-y-6">
        {/* Company Name */}
        <div>
          <label className="text-sm font-medium text-gray-300 mb-1 block">
            Company Name
          </label>
          {isEditingOverview ? (
            <Input
              value={overviewData.name}
              onChange={(e) => setOverviewData({ ...overviewData, name: e.target.value })}
              placeholder="Enter company name"
            />
          ) : (
            <h2 className="text-2xl font-bold text-gray-100">{companyAccount.name}</h2>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="text-sm font-medium text-gray-300 mb-1 block">
            Description
          </label>
          {isEditingOverview ? (
            <Textarea
              value={overviewData.description}
              onChange={(e) => setOverviewData({ ...overviewData, description: e.target.value })}
              placeholder="Enter company description"
              rows={3}
            />
          ) : (
            <p className="text-gray-100">{companyAccount.description || 'No description provided'}</p>
          )}
        </div>

        {/* Founder */}
        <div>
          <label className="text-sm font-medium text-gray-300 mb-1 block">
            Founder
          </label>
          {isEditingOverview ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <select
                  value={overviewData.founderId}
                  onChange={(e) => setOverviewData({ ...overviewData, founderId: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select founder</option>
                  {teamMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name} {member.email && `(${member.email})`}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNewMemberForm(true)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {showNewMemberForm && (
                <div className="space-y-2 p-3 border rounded-md bg-gray-50">
                  <Input
                    placeholder="Founder name"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                  />
                  <Input
                    placeholder="Email (optional)"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleCreateTeamMember}>
                      Add
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowNewMemberForm(false)
                        setNewMemberName('')
                        setNewMemberEmail('')
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-100">
              {companyAccount.founder ? (
                <Link
                  href={`/team-members/${companyAccount.founder.id}`}
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  {companyAccount.founder.name}
                </Link>
              ) : (
                'No founder specified'
              )}
            </p>
          )}
        </div>

        {/* Company Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Employees */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-1 block">
              Employees
            </label>
            {isEditingOverview ? (
              <Input
                value={overviewData.employees}
                onChange={(e) => setOverviewData({ ...overviewData, employees: e.target.value })}
                placeholder="e.g., 50-100"
              />
            ) : (
              <p className="text-gray-100">{companyAccount.employees || 'Not specified'}</p>
            )}
          </div>

          {/* Headquarters */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-1 block">
              Headquarters
            </label>
            {isEditingOverview ? (
              <Input
                value={overviewData.headquarters}
                onChange={(e) => setOverviewData({ ...overviewData, headquarters: e.target.value })}
                placeholder="e.g., San Francisco, CA"
              />
            ) : (
              <p className="text-gray-100">{companyAccount.headquarters || 'Not specified'}</p>
            )}
          </div>

          {/* Company founded */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-1 block">
              Company founded
            </label>
            {isEditingOverview ? (
              <Input
                value={overviewData.launchedDate}
                onChange={(e) => setOverviewData({ ...overviewData, launchedDate: e.target.value })}
                placeholder="e.g., January 2020"
              />
            ) : (
              <p className="text-gray-100">{companyAccount.launchedDate || 'Not specified'}</p>
            )}
          </div>

          {/* Company Type */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-1 block">
              Company Type
            </label>
            {isEditingOverview ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={overviewData.isPrivate ? "default" : "outline"}
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Private button clicked (edit mode), current isPrivate:', overviewData.isPrivate);
                      setOverviewData({ ...overviewData, isPrivate: true });
                    }}
                  >
                    Private
                  </Button>
                  <Button
                    type="button"
                    variant={!overviewData.isPrivate ? "default" : "outline"}
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Public button clicked (edit mode), current isPrivate:', overviewData.isPrivate);
                      setOverviewData({ ...overviewData, isPrivate: false });
                    }}
                  >
                    Public
                  </Button>
                </div>
                {!overviewData.isPrivate && (
                  <Input
                    value={overviewData.tradedAs}
                    onChange={(e) => setOverviewData({ ...overviewData, tradedAs: e.target.value })}
                    placeholder="e.g., NASDAQ: AAPL"
                  />
                )}
              </div>
            ) : (
              <div>
                <Badge variant={companyAccount.isPrivate ? "secondary" : "default"}>
                  {companyAccount.isPrivate ? 'Private' : 'Public'}
                </Badge>
                {!companyAccount.isPrivate && companyAccount.tradedAs && (
                  <p className="text-sm text-gray-100 mt-1">{companyAccount.tradedAs}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* External Links */}
        <div>
          <label className="text-sm font-medium text-gray-300 mb-3 block">
            External Links
          </label>
          <div className="space-y-3">
            {/* Corporate Intranet */}
            <div>
              <label className="text-xs text-gray-300 mb-1 block">Corporate Intranet</label>
              {isEditingOverview ? (
                <Input
                  value={overviewData.corporateIntranet}
                  onChange={(e) => setOverviewData({ ...overviewData, corporateIntranet: e.target.value })}
                  placeholder="https://intranet.company.com"
                />
              ) : companyAccount.corporateIntranet ? (
                <a
                  href={companyAccount.corporateIntranet}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  Corporate Intranet <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <p className="text-gray-300 text-sm">Not provided</p>
              )}
            </div>

            {/* Glassdoor */}
            <div>
              <label className="text-xs text-gray-300 mb-1 block">Glassdoor</label>
              {isEditingOverview ? (
                <Input
                  value={overviewData.glassdoorLink}
                  onChange={(e) => setOverviewData({ ...overviewData, glassdoorLink: e.target.value })}
                  placeholder="https://glassdoor.com/company/..."
                />
              ) : companyAccount.glassdoorLink ? (
                <a
                  href={companyAccount.glassdoorLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  Glassdoor Profile <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <p className="text-gray-500 text-sm">Not provided</p>
              )}
            </div>

            {/* LinkedIn */}
            <div>
              <label className="text-xs text-gray-300 mb-1 block">LinkedIn</label>
              {isEditingOverview ? (
                <Input
                  value={overviewData.linkedinLink}
                  onChange={(e) => setOverviewData({ ...overviewData, linkedinLink: e.target.value })}
                  placeholder="https://linkedin.com/company/..."
                />
              ) : companyAccount.linkedinLink ? (
                <a
                  href={companyAccount.linkedinLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  LinkedIn Profile <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <p className="text-gray-300 text-sm">Not provided</p>
              )}
            </div>
          </div>
        </div>

        {isEditingOverview && (
          <div className="pt-2 flex justify-end">
            <Button variant="outline" size="sm" className="text-gray-100 hover:text-gray-100" onClick={handleSaveOverview} disabled={isLoading}>
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        )}
      </CardContent>
      )}
    </Card>
  )
}
