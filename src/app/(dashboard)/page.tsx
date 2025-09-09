'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import GettingStartedChecklist from '@/components/GettingStartedChecklist';
import { KpiProgress } from '@/components/KpiProgress';

interface DashboardStats {
  organizations: number;
  businessUnits: number;
  initiatives: number;
  teams: number;
  kpis: number;
  opsReviews: number;
}

interface RecentActivity {
  id: string;
  type: string;
  title: string;
  description: string;
  date: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    organizations: 0,
    businessUnits: 0,
    initiatives: 0,
    teams: 0,
    kpis: 0,
    opsReviews: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showChecklist, setShowChecklist] = useState<boolean>(true);

  // Helper function to format numbers with commas
  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  // Helper function to format status with visual indicators
  const formatStatus = (status: string) => {
    // Handle null, undefined, or non-string status
    if (!status || typeof status !== 'string') {
      return {
        label: 'Unknown',
        color: 'bg-gray-100 text-gray-800',
        progress: 0,
        icon: '📄'
      };
    }

    const statusConfig = {
      'IN_PROGRESS': { 
        label: 'In Progress', 
        color: 'bg-blue-100 text-blue-800', 
        progress: 60,
        icon: '🔄'
      },
      'COMPLETED': { 
        label: 'Completed', 
        color: 'bg-green-100 text-green-800', 
        progress: 100,
        icon: '✅'
      },
      'PLANNING': { 
        label: 'Planning', 
        color: 'bg-yellow-100 text-yellow-800', 
        progress: 20,
        icon: '📋'
      },
      'ON_HOLD': { 
        label: 'On Hold', 
        color: 'bg-gray-100 text-gray-800', 
        progress: 0,
        icon: '⏸️'
      },
      'CANCELLED': { 
        label: 'Cancelled', 
        color: 'bg-red-100 text-red-800', 
        progress: 0,
        icon: '❌'
      }
    };
    
    return statusConfig[status as keyof typeof statusConfig] || {
      label: status.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
      color: 'bg-gray-100 text-gray-800',
      progress: 0,
      icon: '📄'
    };
  };

  useEffect(() => {
    // Initialize show/hide state for the onboarding checklist from localStorage
    try {
      const stored = typeof window !== 'undefined' ? window.localStorage.getItem('tn_show_checklist') : null;
      if (stored !== null) setShowChecklist(stored === 'true');
    } catch {}

    const fetchDashboardData = async () => {
      try {
        // Fetch organizations and count related data
        const orgsResponse = await fetch('/api/organizations');
        const organizationsData = await orgsResponse.json();
        const organizations = Array.isArray(organizationsData) ? organizationsData : [];
        
        const initiativesResponse = await fetch('/api/initiatives');
        const initiativesData = await initiativesResponse.json();
        const initiatives = Array.isArray(initiativesData) ? initiativesData : [];
        
        const teamsResponse = await fetch('/api/teams');
        const teamsData = await teamsResponse.json();
        const teams = Array.isArray(teamsData) ? teamsData : [];
        
        const kpisResponse = await fetch('/api/kpis');
        const kpisData = await kpisResponse.json();
        const kpis = Array.isArray(kpisData) ? kpisData : [];
        
        const opsReviewsResponse = await fetch('/api/ops-reviews');
        const opsReviewsData = await opsReviewsResponse.json();
        const opsReviews = Array.isArray(opsReviewsData) ? opsReviewsData : [];

        // Count business units from organizations
        const totalBusinessUnits = organizations.reduce((count: number, org: any) => 
          count + (org.businessUnits?.length || 0), 0
        );

        setStats({
          organizations: organizations.length,
          businessUnits: totalBusinessUnits,
          initiatives: initiatives.length,
          teams: teams.length,
          kpis: kpis.length,
          opsReviews: opsReviews.length,
        });

        // Create initiative tracking list (only initiatives, no KPIs)
        const activities: RecentActivity[] = [
          ...initiatives.slice(0, 5).map((initiative: any) => ({
            id: initiative.id,
            type: 'Initiative',
            title: initiative.name,
            description: initiative.status,
            date: new Date(initiative.createdAt).toLocaleDateString(),
          })),
        ];

        setRecentActivity(activities.slice(0, 5));
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const toggleChecklist = () => {
    setShowChecklist((prev) => {
      const next = !prev;
      try {
        if (typeof window !== 'undefined') window.localStorage.setItem('tn_show_checklist', String(next));
      } catch {}
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Overview of your organization's performance</p>
          </div>
          <button
            type="button"
            onClick={toggleChecklist}
            className="text-sm text-blue-600 hover:underline"
          >
            {showChecklist ? 'Hide checklist' : 'Show checklist'}
          </button>
        </div>
      </div>

      {/* Getting Started Checklist */}
      {showChecklist && <GettingStartedChecklist />}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/organizations" className="block hover:no-underline">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-900">Organizations</CardTitle>
              <svg className="h-4 w-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.organizations}</div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/business-units" className="block hover:no-underline">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-900">Business Units</CardTitle>
              <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.businessUnits}</div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/initiatives-kpis" className="block hover:no-underline">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-900">Active Initiatives</CardTitle>
              <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.initiatives}</div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/teams/list" className="block hover:no-underline">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-900">Teams</CardTitle>
              <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.teams}</div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/initiatives-kpis" className="block hover:no-underline">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-900">KPIs</CardTitle>
              <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.kpis}</div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/ops-reviews" className="block hover:no-underline">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-900">Ops Reviews</CardTitle>
              <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.opsReviews}</div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Initiative Tracking */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900">Initiative Tracking</CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map((activity) => {
                const statusInfo = formatStatus(activity.description);
                return (
                  <Link 
                    key={activity.id} 
                    href={`/initiatives/${activity.id}`}
                    className="block hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <div className="flex items-center space-x-4 p-3 bg-white rounded-lg hover:bg-gray-50">
                      <div className="flex-shrink-0">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {activity.type}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {activity.title}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                            <span className="mr-1">{statusInfo.icon}</span>
                            {statusInfo.label}
                          </span>
                          <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-24">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                              style={{ width: `${statusInfo.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-500">{statusInfo.progress}%</span>
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-sm text-gray-500">
                        {activity.date}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500">No recent activity</p>
          )}
        </CardContent>
      </Card>

      {/* KPI Progress */}
      <KpiProgress />
    </div>
  );
}
