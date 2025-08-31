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
      id: 'business-units',
      title: 'Add stakeholders and goals for business units',
      description: 'Organize your company structure and key people',
      href: '/business-units',
      completed: false,
      icon: '🏗️'
    },
    {
      id: 'initiatives',
      title: 'Add initiatives and KPIs for initiatives',
      description: 'Create strategic projects and success metrics',
      href: '/initiatives',
      completed: false,
      icon: '🚀'
    },
    {
      id: 'teams',
      title: 'Define your team and team members',
      description: 'Add team structure and personnel',
      href: '/teams',
      completed: false,
      icon: '👥'
    },
    {
      id: 'hiring',
      title: 'Add hiring forecast and salary information',
      description: 'Plan future hiring and compensation',
      href: '/teams',
      completed: false,
      icon: '💼'
    },
    {
      id: 'budget',
      title: 'Forecast your org\'s budget',
      description: 'Create financial projections and budgets',
      href: '/financial',
      completed: false,
      icon: '💰'
    }
  ]);

  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    // Check completion status based on existing data
    const checkCompletion = async () => {
      try {
        const [orgsRes, teamsRes, initiativesRes] = await Promise.all([
          fetch('/api/organizations'),
          fetch('/api/teams'),
          fetch('/api/initiatives')
        ]);

        const [organizationsData, teamsData, initiativesData] = await Promise.all([
          orgsRes.json(),
          teamsRes.json(),
          initiativesRes.json()
        ]);

        const organizations = Array.isArray(organizationsData) ? organizationsData : [];
        const teams = Array.isArray(teamsData) ? teamsData : [];
        const initiatives = Array.isArray(initiativesData) ? initiativesData : [];

        setChecklist(prev => prev.map(item => {
          // Initialize all items as deselected (completed = false)
          return { ...item, completed: false };
        }));
      } catch (error) {
        console.error('Error checking completion status:', error);
      }
    };

    checkCompletion();
  }, []);

  useEffect(() => {
    setCompletedCount(checklist.filter(item => item.completed).length);
  }, [checklist]);

  const toggleComplete = (id: string) => {
    setChecklist(prev => 
      prev.map(item => 
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const progressPercentage = Math.round((completedCount / checklist.length) * 100);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold">Getting Started</CardTitle>
          <div className="text-sm text-gray-500">
            {completedCount}/{checklist.length} completed
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-green-600 h-2 rounded-full transition-all duration-300" 
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        <p className="text-sm text-gray-600">
          Complete these steps to set up your organization in TrueNorth
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {checklist.map((item) => (
            <div
              key={item.id}
              className={`flex items-center space-x-3 p-3 rounded-lg border transition-all ${
                item.completed 
                  ? 'bg-green-50 border-green-200' 
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
                >
                  {item.completed ? 'View' : 'Start'}
                </Button>
              </Link>
            </div>
          ))}
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
