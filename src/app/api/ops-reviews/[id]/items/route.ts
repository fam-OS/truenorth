import { NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import { z } from 'zod';
import { createOpsReviewItemSchema } from '@/lib/validations/ops-review-item';

// Initialize Prisma Client with proper typing
const prisma = new PrismaClient();

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
  { params }: { params: { id: string } }
) {
  // Properly await params in Next.js 13+
  const { id } = await params;
  
  try {
    console.log(`[GET /api/ops-reviews/${id}/items] Starting request`);
    
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
    
    // Use raw SQL query to fetch items with related data
    const items = await prisma.$queryRaw`
      SELECT 
        oi.*,
        tm.name as owner_name,
        t.name as team_name,
        r.title as ops_review_title
      FROM "OpsReviewItem" oi
      LEFT JOIN "TeamMember" tm ON oi."ownerId" = tm.id
      LEFT JOIN "Team" t ON oi."teamId" = t.id
      LEFT JOIN "OpsReview" r ON oi."opsReviewId" = r.id
      WHERE oi."opsReviewId" = ${id}::text
      ORDER BY oi."createdAt" DESC
    `;
    
    console.log(`[GET /api/ops-reviews/${id}/items] Found ${Array.isArray(items) ? items.length : 0} items`);
    
    // Transform the data to match the expected response format
    const transformedItems = (Array.isArray(items) ? items : []).map((item: any) => ({
      ...item,
      // Ensure date fields are strings for JSON serialization
      createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: item.updatedAt ? new Date(item.updatedAt).toISOString() : new Date().toISOString()
    })) as OpsReviewItemResponse[];
    
    return NextResponse.json(transformedItems);
    
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
  { params }: { params: { id: string } }
) {
  // Properly await params in Next.js 13+
  const { id } = await params;
  
  try {
    const json = await request.json();
    const data = createOpsReviewItemSchema.parse({ ...json, opsReviewId: id });

    // First, verify the ops review exists
    const reviewExists = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM "OpsReview" WHERE id = ${data.opsReviewId}::text
    `;
    
    if (!reviewExists || reviewExists.length === 0) {
      return NextResponse.json(
        { error: 'Ops Review not found' },
        { status: 404 }
      );
    }

    // Create the OpsReviewItem using Prisma's create method
    const created = await prisma.opsReviewItem.create({
      data: {
        title: data.title,
        description: data.description || null,
        targetMetric: data.targetMetric,
        actualMetric: data.actualMetric,
        quarter: data.quarter as any, // Using 'as any' to handle the custom enum type
        year: data.year,
        opsReview: { connect: { id: data.opsReviewId } },
        team: { connect: { id: data.teamId } },
        ...(data.ownerId && { owner: { connect: { id: data.ownerId } } }),
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
          },
        },
        opsReview: {
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
