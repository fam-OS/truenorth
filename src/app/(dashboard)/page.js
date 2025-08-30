"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { TaskList } from '@/components/TaskList';
import { useToast } from '@/components/ui/toast';
import { OrganizationForm } from '@/components/OrganizationForm';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Tooltip } from '@/components/ui/tooltip';

export default function DashboardPage() {
  const { currentOrg } = useOrganization();
  const [tasks, setTasks] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Toast
  const { showToast } = useToast();

  // Organizations/Teams UI state (mirrors Organizations page)
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [editingOrg, setEditingOrg] = useState(null);
  const [orgTeams, setOrgTeams] = useState({});
  const [orgBusinessUnits, setOrgBusinessUnits] = useState({});
  const [showCreateTeamForOrg, setShowCreateTeamForOrg] = useState(null);
  const [editTeam, setEditTeam] = useState(null);

  // lifecycle helpers for fetch cancellation
  const isMounted = useRef(false);
  const abortController = useRef(null);
  const vtAbort = useRef(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      // cancel previous
      if (abortController.current) abortController.current.abort();
      abortController.current = new AbortController();

      const [tasksRes, orgsRes] = await Promise.all([
        fetch('/api/tasks', { signal: abortController.current.signal }),
        fetch('/api/organizations', { signal: abortController.current.signal })
      ]);

      if (!tasksRes.ok || !orgsRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const [tasksData, orgsData] = await Promise.all([
        tasksRes.json(),
        orgsRes.json()
      ]);

      if (isMounted.current) {
        setTasks(tasksData.data || []);
        setOrganizations(orgsData.data || []);
      }
    } catch (error) {
      if (error.name !== 'AbortError' && isMounted.current) {
        setError('Failed to load data');
        console.error('Error fetching data:', error);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    fetchData();

    return () => {
      isMounted.current = false;
      if (abortController.current) abortController.current.abort();
      if (vtAbort.current) vtAbort.current.abort();
    };
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Quick Stats */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">
                  <span className="text-white font-semibold">{tasks.length}</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Tasks
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {tasks.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <span className="text-white font-semibold">{organizations.length}</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Organizations
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {organizations.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Recent Tasks
          </h3>
          <TaskList tasks={tasks.slice(0, 5)} />
          {tasks.length > 5 && (
            <div className="mt-4">
              <Link
                href="/tasks"
                className="text-indigo-600 hover:text-indigo-500 font-medium"
              >
                View all tasks →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Organizations Overview */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Organizations
          </h3>
          <div className="space-y-3">
            {organizations.slice(0, 3).map((org) => (
              <div key={org.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">{org.name}</h4>
                  <p className="text-sm text-gray-500">{org.description}</p>
                </div>
                <Link
                  href={`/organizations/${org.id}`}
                  className="text-indigo-600 hover:text-indigo-500 font-medium"
                >
                  View →
                </Link>
              </div>
            ))}
          </div>
          {organizations.length > 3 && (
            <div className="mt-4">
              <Link
                href="/organizations"
                className="text-indigo-600 hover:text-indigo-500 font-medium"
              >
                View all organizations →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
