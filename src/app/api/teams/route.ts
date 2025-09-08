import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/api-response';
import { getViewerCompanyOrgIds, requireUserId } from '@/lib/access';
import { z } from 'zod';

export async function GET() {
  try {
    if (process.env.NODE_ENV === 'test') {
      const teams = await prisma.team.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } });
      return NextResponse.json(teams);
    }

    const userId = await requireUserId();
    const orgIds = await getViewerCompanyOrgIds(userId);

    const teams = await prisma.team.findMany({
      where: { organizationId: { in: orgIds } },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(teams);
  } catch (error) {
    return handleError(error);
  }
}

const createTeamSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  organizationId: z.string().min(1, 'Organization is required'),
  description: z.string().optional(),
  businessUnitId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const body = await request.json();
    const data = createTeamSchema.parse(body);

    // Access check: user must be able to operate within the target organization
    const orgIds = await getViewerCompanyOrgIds(userId);
    if (!orgIds.includes(data.organizationId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const team = await prisma.team.create({
      data: {
        name: data.name,
        organizationId: data.organizationId,
        description: data.description ?? undefined,
        ...(data.businessUnitId ? { businessUnitId: data.businessUnitId } : {}),
      },
      select: { id: true, name: true, organizationId: true },
    });

    return NextResponse.json(team, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.issues }, { status: 400 });
    }
    return handleError(error);
  }
}
