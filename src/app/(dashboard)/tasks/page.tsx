'use client';

import { useState, useEffect } from 'react';
import { Task } from '@prisma/client';
import { TaskList } from '@/components/TaskList';
import { TaskForm } from '@/components/TaskForm';
import { TaskDetail } from '@/components/TaskDetail';
import { CreateTaskInput, UpdateTaskInput } from '@/lib/validations/task';

type TaskWithNotes = Task & {
  notes: { id: string; content: string; createdAt: Date }[];
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskWithNotes[]>([]);
  const [selectedTask, setSelectedTask] = useState<TaskWithNotes | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  async function fetchTasks() {
    try {
      setIsLoading(true);
      const response = await fetch('/api/tasks');
      if (!response.ok) throw new Error('Failed to fetch tasks');
      const data = await response.json();
      setTasks(data);
    } catch (err) {
      setError('Failed to load tasks');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateTask(data: CreateTaskInput) {
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to create task');
      
      await fetchTasks();
      setIsCreating(false);
    } catch (err) {
      throw new Error('Failed to create task');
    }
  }

  async function handleUpdateTask(data: UpdateTaskInput) {
    if (!selectedTask) return;

    try {
      const response = await fetch(`/api/tasks/${selectedTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to update task');
      
      await fetchTasks();
      setIsEditing(false);
    } catch (err) {
      throw new Error('Failed to update task');
    }
  }

  async function handleAddNote(data: { content: string }) {
    if (!selectedTask) return;

    try {
      const response = await fetch(`/api/tasks/${selectedTask.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to add note');
      
      await fetchTasks();
      const updatedTask = tasks.find(t => t.id === selectedTask.id);
      if (updatedTask) setSelectedTask(updatedTask);
    } catch (err) {
      throw new Error('Failed to add note');
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Tasks</h1>
        <button
          onClick={() => setIsCreating(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          New Task
        </button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 mb-6">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {isCreating ? (
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium leading-6 text-gray-900 mb-4">
              Create New Task
            </h2>
            <TaskForm
              onSubmit={handleCreateTask}
              onCancel={() => setIsCreating(false)}
            />
          </div>
        </div>
      ) : isEditing && selectedTask ? (
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium leading-6 text-gray-900 mb-4">
              Edit Task
            </h2>
            <TaskForm
              task={selectedTask}
              onSubmit={handleUpdateTask}
              onCancel={() => setIsEditing(false)}
            />
          </div>
        </div>
      ) : selectedTask ? (
        <TaskDetail
          task={selectedTask}
          onAddNote={handleAddNote}
          onStatusChange={(status) => handleUpdateTask({ status })}
          onEdit={() => setIsEditing(true)}
          onClose={() => setSelectedTask(null)}
        />
      ) : (
        <TaskList
          tasks={tasks}
          onTaskClick={setSelectedTask}
        />
      )}
    </div>
  );
}