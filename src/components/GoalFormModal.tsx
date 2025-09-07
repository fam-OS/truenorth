'use client';

import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useEffect, useState } from 'react';
import { Goal } from '@prisma/client';

type GoalFormData = {
  title: string;
  description?: string;
  quarter: string;
  year: number;
  status?: string;
  progressNotes?: string;
  stakeholderId?: string;
  businessUnitId?: string;
};

interface GoalFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: Goal | null;
  onSubmit: (data: GoalFormData) => Promise<void>;
  isSubmitting: boolean;
}

export function GoalFormModal({
  isOpen,
  onClose,
  goal,
  onSubmit,
  isSubmitting,
}: GoalFormModalProps) {
  const [businessUnits, setBusinessUnits] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/business-units', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data)) {
          setBusinessUnits(data.map((u: any) => ({ id: u.id, name: u.name })));
        }
      } catch {
        // ignore
      }
    };
    void load();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get('title') as string,
      description: formData.get('description') as string || undefined,
      quarter: formData.get('quarter') as string,
      year: parseInt(formData.get('year') as string),
      status: formData.get('status') as string || undefined,
      progressNotes: formData.get('progressNotes') as string || undefined,
      stakeholderId: formData.get('stakeholderId') as string || undefined,
      businessUnitId: (formData.get('businessUnitId') as string) || undefined,
    };
    await onSubmit(data);
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900 mb-6"
                >
                  {goal ? 'Edit Goal' : 'Create New Goal'}
                </Dialog.Title>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                      Title *
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      required
                      defaultValue={goal?.title || ''}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      rows={3}
                      defaultValue={goal?.description || ''}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="quarter" className="block text-sm font-medium text-gray-700">
                        Quarter *
                      </label>
                      <select
                        id="quarter"
                        name="quarter"
                        required
                        defaultValue={goal?.quarter || 'Q1'}
                        className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                      >
                        <option value="Q1">Q1</option>
                        <option value="Q2">Q2</option>
                        <option value="Q3">Q3</option>
                        <option value="Q4">Q4</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="year" className="block text-sm font-medium text-gray-700">
                        Year *
                      </label>
                      <input
                        type="number"
                        id="year"
                        name="year"
                        required
                        min="2020"
                        max="2030"
                        defaultValue={goal?.year || new Date().getFullYear()}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                      Status
                    </label>
                    <select
                      id="status"
                      name="status"
                      defaultValue={goal?.status || ''}
                      className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                    >
                      <option value="">Select Status (Optional)</option>
                      <option value="NOT_STARTED">Not Started</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="AT_RISK">At Risk</option>
                      <option value="BLOCKED">Blocked</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>


                  <div>
                    <label htmlFor="progressNotes" className="block text-sm font-medium text-gray-700">
                      Progress Notes
                    </label>
                    <textarea
                      id="progressNotes"
                      name="progressNotes"
                      rows={3}
                      defaultValue={goal?.progressNotes || ''}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                      {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
