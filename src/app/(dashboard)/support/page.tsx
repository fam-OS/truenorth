'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';

export default function SupportPage() {
  const { data: session } = useSession();
  
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('medium');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const categories = [
    { value: 'bug', label: 'Bug Report' },
    { value: 'account', label: 'Account Issues' },
    { value: 'data', label: 'Data Problems' },
    { value: 'performance', label: 'Performance Issues' },
    { value: 'login', label: 'Login/Authentication' },
    { value: 'billing', label: 'Billing Questions' },
    { value: 'feature', label: 'Feature Questions' },
    { value: 'integration', label: 'Integration Support' },
    { value: 'training', label: 'Training/How-to' },
    { value: 'other', label: 'Other' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/support-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          category,
          priority,
          description,
          steps,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to submit support request');
        return;
      }

      setSuccess(true);
      // Reset form
      setSubject('');
      setCategory('');
      setPriority('medium');
      setDescription('');
      setSteps('');
      
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
        <div className="text-lg">Please sign in to submit support requests.</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Support</h1>
        <p className="text-gray-600 mt-2">
          Need help? Submit a support request and our team will get back to you as soon as possible.
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
            Thank you! Your support request has been submitted successfully. We&apos;ll respond within 24 hours.
          </div>
        </div>
      )}

      <div className="bg-white shadow rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
              Subject *
            </label>
            <input
              type="text"
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Brief description of your issue or question"
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
              <option value="low">Low - General question</option>
              <option value="medium">Medium - Issue affecting work</option>
              <option value="high">High - Significant problem</option>
              <option value="urgent">Urgent - System down/critical issue</option>
            </select>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description *
            </label>
            <textarea
              id="description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Describe your issue or question in detail. What were you trying to do? What happened instead?"
              required
            />
          </div>

          <div>
            <label htmlFor="steps" className="block text-sm font-medium text-gray-700">
              Steps to Reproduce (for bugs)
            </label>
            <textarea
              id="steps"
              rows={3}
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="If reporting a bug, please list the steps to reproduce the issue:
1. Go to...
2. Click on...
3. See error..."
            />
          </div>

          <div className="bg-blue-50 p-4 rounded-md">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Tips for faster support:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Be specific about what you were doing when the issue occurred</li>
              <li>• Include any error messages you saw</li>
              <li>• Mention which browser and device you&apos;re using</li>
              <li>• For account issues, include your email address</li>
            </ul>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md text-sm font-medium disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Support Request'}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}
