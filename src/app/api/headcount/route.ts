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

    const items = await prisma.headcountTracker.findMany({
      where: {
        teamId: teamId,
        organizationId: orgIdsFilter ? { in: orgIdsFilter } : (organizationId as any),
        year: year,
      },
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
    const created = await prisma.headcountTracker.create({
      data: {
        id: crypto.randomUUID(),
        teamId: data.teamId,
        organizationId: data.organizationId,
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
