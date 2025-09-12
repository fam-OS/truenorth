import GettingStartedChecklist from '@/components/GettingStartedChecklist';
import HomeWidgets from '@/components/home/HomeWidgets';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Home — Dashboard',
};

export default async function HomeDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Home</h1>
        <p className="text-sm text-gray-600 mt-1">Your getting started checklist and shortcuts</p>
      </div>

      <GettingStartedChecklist />

      {/* Widgets Grid */}
      <HomeWidgets />
    </div>
  );
}
