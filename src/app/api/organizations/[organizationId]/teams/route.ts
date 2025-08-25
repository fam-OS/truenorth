import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/api-response';

const createTeamSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().nullable(),
});

export async function GET(
  _request: Request,
  { params }: { params: { organizationId: string } }
) {
  try {
    const { organizationId } = await params;
    const teams = await prisma.team.findMany({
      where: { organizationId },
      orderBy: { name: 'asc' },
      include: { members: true },
    });
    return NextResponse.json(teams);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: { organizationId: string } }
) {
  try {
    const { organizationId } = await params;
    const json = await request.json();
    const data = createTeamSchema.parse(json);

    const team = await prisma.team.create({
      data: {
        name: data.name,
        description: data.description ?? undefined,
        organizationId,
      },
    });

    return NextResponse.json(team, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.issues }, { status: 400 });
    }
    return handleError(error);
  }
}
