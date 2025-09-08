'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';

export default function FeatureRequestPage() {
  const { data: session } = useSession();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [useCase, setUseCase] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const categories = [
    { value: 'dashboard', label: 'Dashboard' },
    { value: 'organizations', label: 'Organizations' },
    { value: 'team-management', label: 'Team Management' },
    { value: 'business-units', label: 'Business Units' },
    { value: 'initiatives-kpis', label: 'Initiatives & KPIs' },
    { value: 'team-ops-reviews', label: 'Team Ops Reviews' },
    { value: 'financial-management', label: 'Financial management' },
    { value: 'mobile-experience', label: 'Mobile experience' },
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
