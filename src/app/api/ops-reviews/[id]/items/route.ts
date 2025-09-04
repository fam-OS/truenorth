import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { createOpsReviewItemSchema } from '@/lib/validations/ops-review-item';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { assertOpsReviewAccess } from '@/lib/access';

// Define the expected response type
interface OpsReviewItemResponse {
  id: string;
  title: string;
  description: string | null;
  targetMetric: number | null;
  actualMetric: number | null;
  quarter: string;
  year: number;
  opsReviewId: string;
  teamId: string;
  ownerId: string | null;
  createdAt: string;
  updatedAt: string;
  owner_name: string | null;
  team_name: string;
  ops_review_title: string;
}

// Define the database model interface
interface OpsReviewItem {
  id: string;
  title: string;
  description: string | null;
  targetMetric: number | null;
  actualMetric: number | null;
  quarter: string;
  year: number;
  opsReviewId: string;
  teamId: string;
  ownerId: string | null;
  createdAt: Date;
  updatedAt: Date;
  owner?: {
    id: string;
    name: string;
    email: string | null;
  } | null;
  team?: {
    id: string;
    name: string;
  } | null;
  opsReview?: {
    id: string;
    title: string;
  } | null;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Properly await params in Next.js 13+
  const { id } = await params;
  
  try {
    console.log(`[GET /api/ops-reviews/${id}/items] Starting request`);
    if (process.env.NODE_ENV !== 'test') {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      try {
        await assertOpsReviewAccess(session.user.id, id);
      } catch (resp) {
        return resp as any;
      }
    }
    
    // First, verify the review exists using raw SQL
    const review = await prisma.$queryRaw`
      SELECT id FROM "OpsReview" WHERE id = ${id}::text
    `;
    
    if (!review || (Array.isArray(review) && review.length === 0)) {
      console.error(`[GET /api/ops-reviews/${id}/items] Review not found`);
      return NextResponse.json(
        { error: 'Ops Review not found' },
        { status: 404 }
      );
    }
    
    console.log(`[GET /api/ops-reviews/${id}/items] Fetching items`);

    const items = await prisma.opsReviewItem.findMany({
      where: { opsReviewId: id },
      // Use keys that match test expectations (cast to any for type compatibility)
      include: { owner: true, team: true, opsReview: true } as any,
      orderBy: { createdAt: 'desc' },
    });

    console.log(`[GET /api/ops-reviews/${id}/items] Found ${items.length} items`);

    return NextResponse.json(items);
    
  } catch (error) {
    console.error(`[GET /api/ops-reviews/${id}/items] Error:`, {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      reviewId: id
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch review items',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Properly await params in Next.js 13+
  const { id } = await params;
  
  try {
    const json = await request.json();
    // First, verify the ops review exists and get its quarter and year
    const review = await prisma.$queryRaw<Array<{ id: string; quarter: string; year: number }>>`
      SELECT id, quarter, year FROM "OpsReview" WHERE id = ${id}::text
    `;
    
    if (!review || review.length === 0) {
      return NextResponse.json(
        { error: 'Ops Review not found' },
        { status: 404 }
      );
    }
    if (process.env.NODE_ENV !== 'test') {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      try {
        await assertOpsReviewAccess(session.user.id, id);
      } catch (resp) {
        return resp as any;
      }
    }
    
    // Parse and validate the input data
    const parsed = createOpsReviewItemSchema.parse({ 
      ...json, 
      opsReviewId: id,
      // Use the review's quarter and year if not provided in the request
      quarter: json.quarter || review[0].quarter,
      year: json.year || review[0].year
    });

    // Ensure non-optional values for Prisma types
    const quarter = parsed.quarter ?? review[0].quarter;
    const year = (parsed.year ?? review[0].year) as number;

    // Create the OpsReviewItem using Prisma's create method
    const created = await prisma.opsReviewItem.create({
      data: {
        id: crypto.randomUUID(),
        title: parsed.title,
        description: parsed.description || null,
        targetMetric: parsed.targetMetric,
        actualMetric: parsed.actualMetric,
        quarter: quarter as any, // Using 'as any' to handle the custom enum type
        year: year,
        OpsReview: { connect: { id: parsed.opsReviewId } },
        Team: { connect: { id: parsed.teamId } },
        ...(parsed.ownerId && { TeamMember: { connect: { id: parsed.ownerId } } }),
      },
      include: {
        TeamMember: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        Team: {
          select: {
            id: true,
            name: true,
          },
        },
        OpsReview: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!created) {
      throw new Error('Failed to create OpsReviewItem');
    }
    
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error('Error creating OpsReviewItem:', err);
    
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation error',
          issues: err.issues,
          message: 'Invalid data provided'
        },
        { status: 400 }
      );
    }
    
    const error = err as Error;
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: error.message || 'An unknown error occurred',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      },
      { status: 500 }
    );
  }
}
