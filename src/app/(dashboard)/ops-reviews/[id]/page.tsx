import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Button } from '@/components/ui/button';
import DeleteOpsReviewButton from '@/components/ops-reviews/DeleteOpsReviewButton';
import Link from 'next/link';

// Simple card components since we're having issues with the UI library
const Card = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className={`rounded-lg border bg-white p-6 shadow-sm ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className={`mb-4 ${className}`}>
    {children}
  </div>
);

const CardTitle = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <h3 className={`text-xl font-semibold ${className}`}>
    {children}
  </h3>
);

const CardContent = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className={className}>
    {children}
  </div>
);

interface OpsReviewItem {
  id: string;
  title: string;
  description: string | null;
  status: string;
  ownerId: string | null;
  teamId: string | null;
  opsReviewId: string;
  createdAt: Date;
  updatedAt: Date;
  owner_name: string | null;
  team_name: string | null;
  targetMetric?: number | null;
  actualMetric?: number | null;
}

interface OpsReview {
  id: string;
  title: string;
  description: string | null;
  status: string;
  quarter: string;
  year: number;
  teamId: string | null;
  ownerId: string | null;
  createdAt: Date;
  updatedAt: Date;
  team_name: string | null;
  owner_name: string | null;
  item_count: number;
}

export default async function OpsReviewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  try {
    // Fetch the Ops Review with its items and related data
    const reviewResult = await prisma.$queryRaw<OpsReview[]>`
      SELECT 
        r.*,
        t.name as team_name,
        u.name as owner_name,
        COUNT(i.id)::integer as item_count
      FROM "OpsReview" r
      LEFT JOIN "Team" t ON r."teamId" = t.id
      LEFT JOIN "User" u ON r."ownerId" = u.id
      LEFT JOIN "OpsReviewItem" i ON r.id = i."opsReviewId"
      WHERE r.id = ${id}::text
      GROUP BY r.id, t.id, u.id, u.name
    `;

    const review = Array.isArray(reviewResult) ? reviewResult[0] : null;
    if (!review) {
      return notFound();
    }

    // Fetch the items for this review
    const itemsResult = await prisma.$queryRaw<OpsReviewItem[]>`
      SELECT 
        oi.*,
        tm.name as owner_name,
        t.name as team_name
      FROM "OpsReviewItem" oi
      LEFT JOIN "TeamMember" tm ON oi."ownerId" = tm.id
      LEFT JOIN "Team" t ON oi."teamId" = t.id
      WHERE oi."opsReviewId" = ${id}::text
      ORDER BY oi."createdAt" DESC
    `;
    
    const items = Array.isArray(itemsResult) ? itemsResult : [];

    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <Link href="/ops-reviews" className="text-sm text-blue-700 hover:underline inline-block mb-2">← Back to Ops Reviews</Link>
            <h1 className="text-3xl font-bold">{review.title}</h1>
            <p className="text-muted-foreground">{review.team_name} • {review.quarter} {review.year}</p>
          </div>
          <div className="space-x-2">
            <Button asChild variant="outline">
              <Link href={`/ops-reviews/${id}/edit`}>Edit Review</Link>
            </Button>
            <Button asChild>
              <Link href={`/ops-reviews/${id}/items/new`}>Add Item</Link>
            </Button>
            {/* Delete Review */}
            <DeleteOpsReviewButton id={id} />
          </div>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Review Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Team</p>
                  <p>{review.team_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Period</p>
                  <p>{review.quarter} {review.year}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Items</p>
                  <p>{review.item_count}</p>
                </div>
              </div>
              {review.description && (
                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="whitespace-pre-line">{review.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Review Items</CardTitle>
                <Button asChild size="sm">
                  <Link href={`/ops-reviews/${id}/items/new`}>Add Item</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {items.length > 0 ? (
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">
                            <Link href={`/ops-reviews/${id}/items/${item.id}`} className="hover:underline">
                              {item.title}
                            </Link>
                          </h3>
                          {item.description && (
                            <p className="text-sm text-gray-500 line-clamp-2">
                              {item.description}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <div className="text-xs text-gray-600">
                            <span>Target: {item.targetMetric ?? '—'}</span>
                            <span className="mx-1">•</span>
                            <span>Actual: {item.actualMetric ?? '—'}</span>
                          </div>
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/ops-reviews/${id}/items/${item.id}/edit`}>
                              Edit
                            </Link>
                          </Button>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <span>Team: {item.team_name || 'No Team'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No items added yet.</p>
                  <Button asChild variant="link" className="mt-2">
                    <Link href={`/ops-reviews/${id}/items/new`}>Add your first item</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error fetching Ops Review:', error);
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Error Loading Review</h1>
          <p className="text-gray-500">
            There was an error loading the review. Please try again later.
          </p>
          {process.env.NODE_ENV === 'development' && (
            <pre className="mt-4 p-4 bg-gray-100 rounded text-left text-sm overflow-auto">
              {error instanceof Error ? error.message : String(error)}
            </pre>
          )}
        </div>
      </div>
    );
  }
}
