import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';

// Lightweight card primitives to match sibling pages
const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-lg border bg-white p-6 shadow-sm ${className}`}>{children}</div>
);
const CardHeader = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`mb-4 ${className}`}>{children}</div>
);
const CardTitle = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <h3 className={`text-xl font-semibold ${className}`}>{children}</h3>
);
const CardContent = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={className}>{children}</div>
);

export default async function OpsReviewItemDetailPage({
  params,
}: {
  params: Promise<{ id: string; itemId: string }>;
}) {
  const { id, itemId } = await params;

  // Fetch the item with related entities
  const item = await prisma.opsReviewItem.findUnique({
    where: { id: itemId },
    include: {
      opsReview: { select: { id: true, title: true, quarter: true, year: true } },
      team: { select: { id: true, name: true } },
      owner: { select: { id: true, name: true, email: true } },
    },
  });

  if (!item || item.opsReviewId !== id) {
    return notFound();
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Link
          href={`/ops-reviews/${id}`}
          className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
        >
          ← Back to Review
        </Link>
      </div>

      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold">{item.title}</h1>
          <p className="text-gray-500">
            {item.opsReview?.title} • {item.opsReview?.quarter} {item.opsReview?.year}
          </p>
        </div>
        <div className="space-x-2">
          <Link
            href={`/ops-reviews/${id}/items/${item.id}/edit`}
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
          >
            Edit Item
          </Link>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Item Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {item.description && (
              <div>
                <p className="text-sm text-gray-500">Description</p>
                <p className="whitespace-pre-line">{item.description}</p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Team</p>
                <p>{item.team?.name ?? 'No Team'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Owner</p>
                <p>{item.owner?.name ?? 'Unassigned'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Quarter</p>
                <p>{item.quarter} {item.year}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Target Metric</p>
                <p>{item.targetMetric ?? '—'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Actual Metric</p>
                <p>{item.actualMetric ?? '—'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
