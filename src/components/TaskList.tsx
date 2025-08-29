'use client';

import { format } from 'date-fns';
import { Task } from '@prisma/client';
import { ClockIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

type TaskWithNotes = Task & {
  notes: { id: string; content: string }[];
};

const statusColors = {
  TODO: 'bg-gray-100 text-gray-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  BLOCKED: 'bg-red-100 text-red-800',
};

export function TaskList({
  tasks,
  onTaskClick,
}: {
  tasks: TaskWithNotes[];
  onTaskClick: (task: TaskWithNotes) => void;
}) {
  return (
    <div className="flow-root">
      <ul role="list" className="-my-5 divide-y divide-gray-200">
        {tasks.map((task) => (
          <li
            key={task.id}
            className="py-4 cursor-pointer hover:bg-gray-50"
            onClick={() => onTaskClick(task)}
          >
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                {task.status === 'COMPLETED' ? (
                  <CheckCircleIcon className="h-6 w-6 text-green-500" />
                ) : task.status === 'BLOCKED' ? (
                  <XCircleIcon className="h-6 w-6 text-red-500" />
                ) : (
                  <ClockIcon className="h-6 w-6 text-gray-400" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">
                  {task.title}
                </p>
                {task.description && (
                  <p className="truncate text-sm text-gray-500">
                    {task.description}
                  </p>
                )}
                <div className="mt-1 flex items-center space-x-2">
                  <span
                    className={clsx(
                      'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                      statusColors[task.status]
                    )}
                  >
                    {task.status}
                  </span>
                  {task.dueDate && (
                    <span className="text-xs text-gray-500">
                      Due {format(new Date(task.dueDate), 'MMM d, yyyy')}
                    </span>
                  )}
                  {task.notes.length > 0 && (
                    <span className="text-xs text-gray-500">
                      {task.notes.length} note{task.notes.length === 1 ? '' : 's'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}