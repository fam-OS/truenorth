'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';

export default function FeatureRequestPage() {
  const { data: session } = useSession();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('medium');
  const [useCase, setUseCase] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const categories = [
    { value: 'dashboard', label: 'Dashboard & Analytics' },
    { value: 'teams', label: 'Team Management' },
    { value: 'initiatives', label: 'Initiatives & KPIs' },
    { value: 'financial', label: 'Financial Tracking' },
    { value: 'business-units', label: 'Business Units' },
    { value: 'ops-reviews', label: 'Ops Reviews' },
    { value: 'reporting', label: 'Reporting & Exports' },
    { value: 'integrations', label: 'Integrations' },
    { value: 'mobile', label: 'Mobile Experience' },
    { value: 'other', label: 'Other' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/feature-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          category,
          priority,
          useCase,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to submit feature request');
        return;
      }

      setSuccess(true);
      // Reset form
      setTitle('');
      setDescription('');
      setCategory('');
      setPriority('medium');
      setUseCase('');
      
      // Hide success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000);
    } catch {
      setError('An error occurred while submitting your request');
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-lg">Please sign in to submit feature requests.</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Feature Request</h1>
        <p className="text-gray-600 mt-2">
          Help us improve TrueNorth by suggesting new features or enhancements
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {success && (
        <div className="mb-6 rounded-md bg-green-50 p-4">
          <div className="text-sm text-green-700">
            Thank you! Your feature request has been submitted successfully. We&apos;ll review it and consider it for future updates.
          </div>
        </div>
      )}

      <div className="bg-white shadow rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Feature Title *
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Brief, descriptive title for your feature request"
              required
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">
              Category *
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
              Priority Level
            </label>
            <select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="low">Low - Nice to have</option>
              <option value="medium">Medium - Would be helpful</option>
              <option value="high">High - Important for my workflow</option>
              <option value="critical">Critical - Blocking my work</option>
            </select>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Detailed Description *
            </label>
            <textarea
              id="description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Describe the feature you&apos;d like to see. What should it do? How should it work?"
              required
            />
          </div>

          <div>
            <label htmlFor="useCase" className="block text-sm font-medium text-gray-700">
              Use Case & Benefits
            </label>
            <textarea
              id="useCase"
              rows={3}
              value={useCase}
              onChange={(e) => setUseCase(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="How would this feature help you? What problem would it solve? Who else might benefit?"
            />
          </div>

          <div className="bg-blue-50 p-4 rounded-md">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Tips for great feature requests:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Be specific about what you want the feature to do</li>
              <li>• Explain the problem you&apos;re trying to solve</li>
              <li>• Consider how it might work with existing features</li>
              <li>• Include any relevant examples or mockups if you have them</li>
            </ul>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md text-sm font-medium disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Feature Request'}
            </button>
          </div>
        </form>
      </div>

      <div className="mt-8 bg-gray-50 p-6 rounded-lg">
        <h2 className="text-lg font-medium text-gray-900 mb-4">What happens next?</h2>
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex items-start">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
              <span className="text-blue-600 font-medium text-xs">1</span>
            </div>
            <div>
              <strong>Review:</strong> Our team will review your feature request within 1-2 business days
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
              <span className="text-blue-600 font-medium text-xs">2</span>
            </div>
            <div>
              <strong>Evaluation:</strong> We&apos;ll assess feasibility, impact, and alignment with our roadmap
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
              <span className="text-blue-600 font-medium text-xs">3</span>
            </div>
            <div>
              <strong>Updates:</strong> We&apos;ll update you on the status and timeline if we decide to implement it
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
