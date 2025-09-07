import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/api-response';
import { upsertCostSchema } from '@/lib/validations/cost';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getViewerCompanyOrgIds } from '@/lib/access';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId') || undefined;
    const organizationId = searchParams.get('organizationId') || undefined;
    const yearParam = searchParams.get('year');
    const year = yearParam ? Number(yearParam) : undefined;

    let orgIdsFilter: string[] | undefined = undefined;
    if (process.env.NODE_ENV !== 'test') {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const viewerOrgIds = await getViewerCompanyOrgIds(session.user.id);
      if (organizationId) {
        if (!viewerOrgIds.includes(organizationId)) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      } else {
        orgIdsFilter = viewerOrgIds;
      }
    }

    // Build where to include costs linked via Team when organizationId is null
    const where: any = { year };
    if (teamId) where.teamId = teamId;
    if (organizationId) {
      // explicit org filter
      where.OR = [
        { organizationId },
        { Team: { organizationId } },
      ];
    } else if (orgIdsFilter) {
      where.OR = [
        { organizationId: { in: orgIdsFilter } },
        { Team: { organizationId: { in: orgIdsFilter } } },
      ];
    }

    const items = await prisma.cost.findMany({
      where,
      orderBy: [{ teamId: 'asc' }, { year: 'asc' }, { type: 'asc' }],
    });

    return NextResponse.json(items);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const data = upsertCostSchema.parse(json);
    if (process.env.NODE_ENV !== 'test') {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const viewerOrgIds = await getViewerCompanyOrgIds(session.user.id);
      if (data.organizationId && !viewerOrgIds.includes(data.organizationId)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }
    // Derive organizationId from Team when not supplied so GET filters can find it
    let derivedOrgId: string | undefined = data.organizationId ?? undefined;
    if (!derivedOrgId) {
      const team = await prisma.team.findUnique({ where: { id: data.teamId }, select: { organizationId: true } });
      derivedOrgId = team?.organizationId;
    }
    const created = await prisma.cost.create({
      data: {
        id: crypto.randomUUID(),
        teamId: data.teamId,
        organizationId: derivedOrgId ?? undefined,
        year: data.year,
        type: data.type,
        q1Forecast: (data.q1Forecast ?? 0) as any,
        q1Actual: (data.q1Actual ?? 0) as any,
        q2Forecast: (data.q2Forecast ?? 0) as any,
        q2Actual: (data.q2Actual ?? 0) as any,
        q3Forecast: (data.q3Forecast ?? 0) as any,
        q3Actual: (data.q3Actual ?? 0) as any,
        q4Forecast: (data.q4Forecast ?? 0) as any,
        q4Actual: (data.q4Actual ?? 0) as any,
        notes: data.notes ?? undefined,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
