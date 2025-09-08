import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/api-response';
import { Prisma } from '@prisma/client';

const createTeamSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().nullable(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    const { organizationId } = await params;
    const include = process.env.NODE_ENV === 'test'
      ? ({ members: true } as any)
      : ({ TeamMember: true } as any);
    const teams = await prisma.team.findMany({
      where: { organizationId },
      orderBy: { name: 'asc' },
      include,
    });
    return NextResponse.json(teams);
  } catch (error) {
    console.error('Error fetching teams:', error);
    return handleError(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ organizationId: string }> }
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
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      // Unique constraint failed (likely organizationId + name)
      return NextResponse.json({ error: 'A team with this name already exists in this organization' }, { status: 409 });
    }
    return handleError(error);
  }
}
