'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Task } from '@prisma/client';
import { CreateNoteInput } from '@/lib/validations/task';

type TaskWithNotes = Task & {
  notes: { id: string; content: string; createdAt: Date }[];
};

type StatusChangeHandler = (status: Task['status']) => Promise<void>;

interface TaskDetailProps {
  task: TaskWithNotes;
  onAddNote: (note: CreateNoteInput) => Promise<void>;
  onStatusChange: StatusChangeHandler;
  onEdit: () => void;
  onClose: () => void;
}

export function TaskDetail({
  task,
  onAddNote,
  onStatusChange,
  onEdit,
  onClose,
}: TaskDetailProps) {
  const [newNote, setNewNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!newNote.trim()) return;

    setError('');
    setIsSubmitting(true);

    try {
      await onAddNote({ content: newNote.trim() });
      setNewNote('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add note');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              {task.title}
            </h3>
            {task.description && (
              <p className="mt-1 text-sm text-gray-500">{task.description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mt-4 flex items-center space-x-4">
          <select
            value={task.status}
            onChange={(e) => onStatusChange(e.target.value as Task['status'])}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="BLOCKED">Blocked</option>
          </select>

          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500"
          >
            Edit Task
          </button>

          {task.dueDate && (
            <span className="text-sm text-gray-500">
              Due {format(new Date(task.dueDate), 'MMM d, yyyy')}
            </span>
          )}
        </div>

        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-900">Notes</h4>
          <form onSubmit={handleAddNote} className="mt-2">
            <textarea
              rows={2}
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Add a note..."
            />
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            <div className="mt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting || !newNote.trim()}
                className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {isSubmitting ? 'Adding...' : 'Add Note'}
              </button>
            </div>
          </form>

          <ul className="mt-4 space-y-4">
            {task.notes.map((note) => (
              <li key={note.id} className="bg-gray-50 px-4 py-3 rounded-md">
                <p className="text-sm text-gray-900">{note.content}</p>
                <p className="mt-1 text-xs text-gray-500">
                  {format(new Date(note.createdAt), 'MMM d, yyyy h:mm a')}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}