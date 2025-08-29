import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updateOpsReviewSchema } from '@/lib/validations/ops-review';
import { handleError } from '@/lib/api-response';


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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    
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
    
    // Convert BigInt to number for JSON serialization and ensure consistent field names
    const review = reviews[0];
    const serializedReview: Record<string, any> = {
      ...review,
      item_count: Number(review.item_count),
      teamId: review.team_id,
      teamName: review.team_name,
      ownerId: review.owner_id,
      ownerName: review.owner_name
    };
    
    // Remove the raw fields to avoid confusion
    delete serializedReview.team_id;
    delete serializedReview.team_name;
    delete serializedReview.owner_id;
    delete serializedReview.owner_name;
    
    return new NextResponse(JSON.stringify(serializedReview, replacer), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

// BigInt replacer function for JSON serialization
const replacer = (key: string, value: any) => {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  return value;
};

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Make sure to properly destructure the id from params
  const { id } = await params;
  try {
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
        COUNT(i.id)::integer as "item_count"
      FROM "OpsReview" r
      LEFT JOIN "Team" t ON r."teamId" = t.id
      LEFT JOIN "User" u ON r."ownerId" = u.id
      LEFT JOIN "OpsReviewItem" i ON r.id = i."opsReviewId"
      WHERE r.id = ${id}::text
      GROUP BY r.id, t.id, u.id, u.name
    `;
    
    // Convert BigInt to number for JSON serialization and ensure consistent field names
    const serializedUpdated: Record<string, any> = {
      ...updated,
      item_count: Number(updated.item_count),
      teamId: updated.team_id,
      teamName: updated.team_name,
      ownerId: updated.owner_id,
      ownerName: updated.owner_name
    };
    
    // Remove the raw fields to avoid confusion
    delete serializedUpdated.team_id;
    delete serializedUpdated.team_name;
    delete serializedUpdated.owner_id;
    delete serializedUpdated.owner_name;

    // Return the serialized response
    return new NextResponse(JSON.stringify(serializedUpdated), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // Use Prisma client delete so tests can mock prisma.opsReview.delete
    await prisma.opsReview.delete({ where: { id } });

    return new NextResponse(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    // Map not found to 404, else generic error
    const err = error as any;
    if (err && err.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return handleError(error);
  }
}
