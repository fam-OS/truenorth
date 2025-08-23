import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { updateOpsReviewSchema } from '@/lib/validations/ops-review';
import { handleError } from '@/lib/api-response';

const prisma = new PrismaClient();

interface OpsReviewWithRelations {
  id: string;
  title: string;
  description: string | null;
  quarter: string;
  year: number;
  month: number | null;
  teamId: string;
  ownerId: string | null;
  createdAt: string;
  updatedAt: string;
  team_id: string;
  team_name: string;
  owner_id: string | null;
  owner_name: string | null;
  item_count: number;
}

export async function GET(_req: Request, context: { params: { id: string } }) {
  try {
    // Properly destructure params after awaiting
    const { id } = context.params;
    
    const reviews = await prisma.$queryRaw<Array<OpsReviewWithRelations & { [key: string]: any }>>`
      SELECT 
        r.*,
        t.id as "team_id",
        t.name as "team_name",
        u.id as "owner_id",
        u.name as "owner_name",
        COUNT(i.id)::integer as "item_count"
      FROM "OpsReview" r
      LEFT JOIN "Team" t ON r."teamId" = t.id
      LEFT JOIN "User" u ON r."ownerId" = u.id
      LEFT JOIN "OpsReviewItem" i ON r.id = i."opsReviewId"
      WHERE r.id = ${id}::text
      GROUP BY r.id, t.id, u.id, u.name
    `;
    
    if (!reviews || !reviews[0]) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    
    // Convert BigInt to number for JSON serialization
    const review = reviews[0];
    const serializedReview = {
      ...review,
      item_count: Number(review.item_count)
    };
    
    return NextResponse.json(serializedReview);
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(request: Request, context: { params: { id: string } }) {
  try {
    const { id } = context.params;
    const json = await request.json();
    const data = updateOpsReviewSchema.parse(json);
    const now = new Date().toISOString();

    // First, check if the review exists
    const existingReview = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM "OpsReview" WHERE id = ${id}::text
    `;

    if (!existingReview || existingReview.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Build the SET clause and parameters
    const setClauses: string[] = [];
    const queryParams: any[] = [];
    let paramIndex = 1;
    
    if (data.title !== undefined) {
      setClauses.push(`title = $${paramIndex++}`);
      queryParams.push(data.title);
    }
    if (data.description !== undefined) {
      setClauses.push(`description = $${paramIndex++}`);
      queryParams.push(data.description);
    }
    if (data.quarter !== undefined) {
      setClauses.push(`quarter = $${paramIndex++}::"Quarter"`);
      queryParams.push(data.quarter);
    }
    if (data.month !== undefined) {
      setClauses.push(`month = $${paramIndex++}`);
      queryParams.push(data.month);
    }
    if (data.year !== undefined) {
      setClauses.push(`year = $${paramIndex++}`);
      queryParams.push(data.year);
    }
    if (data.teamId !== undefined) {
      setClauses.push(`"teamId" = $${paramIndex++}`);
      queryParams.push(data.teamId);
    }
    if (data.ownerId !== undefined) {
      setClauses.push(`"ownerId" = $${paramIndex++}`);
      queryParams.push(data.ownerId);
    }
    
    // Add updatedAt
    setClauses.push(`"updatedAt" = $${paramIndex++}::timestamp`);
    queryParams.push(now);
    
    // Add the ID parameter
    queryParams.push(id);

    // Execute the update with parameterized query
    await prisma.$executeRawUnsafe(
      `UPDATE "OpsReview" SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`,
      ...queryParams
    );

    // Fetch the updated record with all relations
    const [updated] = await prisma.$queryRaw<OpsReviewWithRelations[]>`
      SELECT 
        r.*,
        t.id as "team_id",
        t.name as "team_name",
        u.id as "owner_id",
        u.name as "owner_name",
        COUNT(i.id) as "item_count"
      FROM "OpsReview" r
      LEFT JOIN "Team" t ON r."teamId" = t.id
      LEFT JOIN "User" u ON r."ownerId" = u.id
      LEFT JOIN "OpsReviewItem" i ON r.id = i."opsReviewId"
      WHERE r.id = ${id}::text
      GROUP BY r.id, t.id, u.id, u.name
    `;

    return NextResponse.json(updated);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_request: Request, context: { params: { id: string } }) {
  try {
    const { id } = context.params;
    
    // First, check if the review exists
    const existingReview = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM "OpsReview" WHERE id = ${id}::text
    `;
    
    if (!existingReview || existingReview.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Delete the review (CASCADE will handle related items)
    await prisma.$executeRaw`
      DELETE FROM "OpsReview" WHERE id = ${id}::text
    `;
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
