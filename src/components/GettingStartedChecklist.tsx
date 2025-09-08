'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  href: string;
  completed: boolean;
  icon: string;
}

export default function GettingStartedChecklist() {
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    {
      id: 'organization',
      title: 'Create organization',
      description: 'Set up your company profile and basic information',
      href: '/organizations',
      completed: false,
      icon: '🏢'
    },
    {
      id: 'teams',
      title: 'Team Management',
      description: 'Headcount, roles, and team setup',
      href: '/teams',
      completed: false,
      icon: '👥'
    },
    {
      id: 'business-units',
      title: 'Business Units',
      description: 'Organize your company structure and key people',
      href: '/business-units',
      completed: false,
      icon: '🏗️'
    },
    {
      id: 'initiatives',
      title: 'Initiatives',
      description: 'Create strategic projects and success metrics',
      href: '/initiatives-kpis',
      completed: false,
      icon: '🚀'
    },
    {
      id: 'ops-reviews',
      title: 'Team Ops Reviews',
      description: 'Run regular team operations reviews',
      href: '/ops-reviews',
      completed: false,
      icon: '📝'
    },
    {
      id: 'budget',
      title: 'Financial Management',
      description: 'Track costs, forecasts, and actuals',
      href: '/financial',
      completed: false,
      icon: '💰'
    }
  ]);

  const [completedCount, setCompletedCount] = useState(0);

  const [hasCompanyAccount, setHasCompanyAccount] = useState<boolean | null>(null);

  useEffect(() => {
    // Load saved checkbox states from localStorage
    const savedStates = localStorage.getItem('gettingStartedChecklist');
    if (savedStates) {
      try {
        const parsed = JSON.parse(savedStates);
        setChecklist(prev => prev.map(item => ({
          ...item,
          completed: parsed[item.id] || false
        })));
      } catch (error) {
        console.error('Error parsing saved checklist states:', error);
      }
    }

    // Check completion status based on existing data
    const checkCompletion = async () => {
      try {
        const [companyRes, orgsRes, teamsRes, initiativesRes, opsReviewsRes] = await Promise.all([
          fetch('/api/company-account'),
          fetch('/api/organizations'),
          fetch('/api/teams'),
          fetch('/api/initiatives'),
          fetch('/api/ops-reviews')
        ]);

        const [companyData, organizationsData, teamsData, initiativesData, opsReviewsData] = await Promise.all([
          companyRes.json(),
          orgsRes.json(),
          teamsRes.json(),
          initiativesRes.json(),
          opsReviewsRes.json()
        ]);

        const hasCompany = companyRes.ok && companyData && !companyData.error;
        setHasCompanyAccount(hasCompany);

        const organizations = Array.isArray(organizationsData) ? organizationsData : [];
        const teams = Array.isArray(teamsData) ? teamsData : [];
        const initiatives = Array.isArray(initiativesData) ? initiativesData : [];
        const opsReviews = Array.isArray(opsReviewsData) ? opsReviewsData : [];

        // Auto-complete items based on actual data (but don't override manual selections)
        setChecklist(prev => prev.map(item => {
          const savedStates = localStorage.getItem('gettingStartedChecklist');
          const parsed = savedStates ? JSON.parse(savedStates) : {};
          
          // Keep manual selection if it exists, otherwise auto-detect
          if (parsed[item.id] !== undefined) {
            return { ...item, completed: parsed[item.id] };
          }
          
          // Auto-detect completion based on data
          switch (item.id) {
            case 'organization':
              return { ...item, completed: hasCompany };
            case 'business-units':
              return { ...item, completed: organizations.some((org: any) => org.businessUnits?.length > 0) };
            case 'teams':
              return { ...item, completed: teams.length > 0 };
            case 'initiatives':
              return { ...item, completed: initiatives.length > 0 };
            case 'ops-reviews':
              return { ...item, completed: opsReviews.length > 0 };
            default:
              return { ...item, completed: false };
          }
        }));
      } catch (error) {
        console.error('Error checking completion status:', error);
        setHasCompanyAccount(false);
      }
    };

    checkCompletion();
  }, []);

  useEffect(() => {
    setCompletedCount(checklist.filter(item => item.completed).length);
  }, [checklist]);

  const toggleComplete = (id: string) => {
    setChecklist(prev => {
      const updated = prev.map(item => 
        item.id === id ? { ...item, completed: !item.completed } : item
      );
      
      // Save to localStorage
      const stateMap = updated.reduce((acc, item) => {
        acc[item.id] = item.completed;
        return acc;
      }, {} as Record<string, boolean>);
      
      localStorage.setItem('gettingStartedChecklist', JSON.stringify(stateMap));
      
      return updated;
    });
  };

  const progressPercentage = Math.round((completedCount / checklist.length) * 100);

  const allCompleted = checklist.length > 0 && checklist.every((i) => i.completed);
  if (allCompleted) {
    return (
      <div className="w-full p-3 rounded-md bg-green-50 border border-green-200 text-sm text-green-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎉</span>
          <span>All getting started steps completed. You’re all set!</span>
        </div>
        <Link href="/organizations" className="underline text-xs text-green-700 hover:text-green-800">View organization</Link>
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold text-gray-100">Getting Started</CardTitle>
          <div className="text-sm text-gray-300">
            {completedCount}/{checklist.length} completed
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-green-600 h-2 rounded-full transition-all duration-300" 
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        <p className="text-sm text-gray-300">
          Complete these steps to set up your organization in TrueNorth
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {checklist.map((item) => {
            const isCreateOrg = item.id === 'organization';
            const shouldHighlight = hasCompanyAccount === false && isCreateOrg;
            const shouldDim = hasCompanyAccount === false && !isCreateOrg;
            
            return (
            <div
              key={item.id}
              className={`flex items-center space-x-3 p-3 rounded-lg border transition-all ${
                item.completed 
                  ? 'bg-green-50 border-green-200' 
                  : shouldHighlight
                    ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200'
                    : shouldDim
                      ? 'bg-gray-50 border-gray-200 opacity-50'
                      : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <button
                onClick={() => toggleComplete(item.id)}
                className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  item.completed
                    ? 'bg-green-600 border-green-600 text-white'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                {item.completed && (
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{item.icon}</span>
                  <h3 className={`font-medium ${item.completed ? 'text-green-800' : 'text-gray-900'}`}>
                    {item.title}
                  </h3>
                </div>
                <p className={`text-sm mt-1 ${item.completed ? 'text-green-600' : 'text-gray-600'}`}>
                  {item.description}
                </p>
              </div>
              
              <Link href={item.href}>
                <Button 
                  variant={item.completed ? "outline" : "default"}
                  size="sm"
                  className={item.completed ? 'border-green-300 text-green-700 hover:bg-green-50' : ''}
                  disabled={shouldDim}
                >
                  {item.completed ? 'View' : 'Start'}
                </Button>
              </Link>
            </div>
            );
          })}
        </div>
        
        {completedCount === checklist.length && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🎉</span>
              <div>
                <h3 className="font-medium text-green-800">Congratulations!</h3>
                <p className="text-sm text-green-600">
                  You've completed all getting started steps. Your organization is ready to go!
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
