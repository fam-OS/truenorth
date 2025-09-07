import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/api-response';
import { upsertHeadcountSchema } from '@/lib/validations/headcount';
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

    // Build where to include rows linked via Team when organizationId is null
    const where: any = { year };
    if (teamId) where.teamId = teamId;
    if (organizationId) {
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

    const items = await prisma.headcountTracker.findMany({
      where,
      orderBy: [{ teamId: 'asc' }, { role: 'asc' }, { level: 'asc' }],
    });

    return NextResponse.json(items);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const data = upsertHeadcountSchema.parse(json);
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
    // Derive organizationId from Team when not provided
    let derivedOrgId: string | undefined = data.organizationId ?? undefined;
    if (!derivedOrgId) {
      const team = await prisma.team.findUnique({ where: { id: data.teamId }, select: { organizationId: true } });
      derivedOrgId = team?.organizationId;
    }

    const created = await prisma.headcountTracker.create({
      data: {
        id: crypto.randomUUID(),
        teamId: data.teamId,
        organizationId: derivedOrgId ?? undefined,
        year: data.year,
        role: data.role,
        level: data.level,
        salary: data.salary as any,
        q1Forecast: data.q1Forecast ?? 0,
        q1Actual: data.q1Actual ?? 0,
        q2Forecast: data.q2Forecast ?? 0,
        q2Actual: data.q2Actual ?? 0,
        q3Forecast: data.q3Forecast ?? 0,
        q3Actual: data.q3Actual ?? 0,
        q4Forecast: data.q4Forecast ?? 0,
        q4Actual: data.q4Actual ?? 0,
        notes: data.notes,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
