import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createOpsReviewSchema } from '@/lib/validations/ops-review';
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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId') || undefined;
    const quarter = searchParams.get('quarter') || undefined;
    const year = searchParams.get('year') ? Number(searchParams.get('year')) : undefined;

    // Use raw SQL to fetch reviews with item counts
    const reviews = await prisma.$queryRaw<OpsReviewWithRelations[]>`
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
      WHERE 
        (${teamId}::text IS NULL OR r."teamId" = ${teamId}::text) AND
        (${quarter}::text IS NULL OR r.quarter = ${quarter}::"Quarter") AND
        (${year}::int IS NULL OR r.year = ${year}::int)
      GROUP BY r.id, t.id, u.id, u.name
      ORDER BY r.year DESC, r.quarter ASC
    `;

    return NextResponse.json(reviews);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const data = createOpsReviewSchema.parse(json);
    const now = new Date().toISOString();

    // Use raw SQL to create a new Ops Review
    const result = await prisma.$queryRaw<Array<{
      id: string;
      title: string;
      description: string | null;
      quarter: string;
      year: number;
      team_id: string;
      team_name: string;
      owner_id: string | null;
      owner_name: string | null;
      item_count: number;
      createdat: string;
      updatedat: string;
    }>>`
      WITH inserted_review AS (
        INSERT INTO "OpsReview" (
          id, 
          title, 
          description, 
          quarter, 
          year, 
          "teamId", 
          "ownerId", 
          "createdAt", 
          "updatedAt"
        ) 
        VALUES (
          gen_random_uuid()::text, 
          ${data.title}, 
          ${data.description ?? null}, 
          ${data.quarter}::"Quarter", 
          ${data.year}::integer, 
          ${data.teamId}::text, 
          ${data.ownerId ?? null}::text, 
          ${now}::timestamp, 
          ${now}::timestamp
        )
        RETURNING *
      )
      SELECT 
        ir.*,
        t.id as "team_id",
        t.name as "team_name",
        u.id as "owner_id",
        u.name as "owner_name",
        0 as "item_count"
      FROM inserted_review ir
      LEFT JOIN "Team" t ON ir."teamId" = t.id
      LEFT JOIN "User" u ON ir."ownerId" = u.id
    `;

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
