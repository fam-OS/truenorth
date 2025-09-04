import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/api-response';
import { createKpiSchema } from '@/lib/validations/kpi';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getViewerCompanyOrgIds } from '@/lib/access';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId') || undefined;
    const teamId = searchParams.get('teamId') || undefined;
    const initiativeId = searchParams.get('initiativeId') || undefined;
    const businessUnitId = searchParams.get('businessUnitId') || undefined;
    const quarter = searchParams.get('quarter') || undefined;
    const year = searchParams.get('year') ? parseInt(searchParams.get('year') as string, 10) : undefined;

    let orgIdsFilter: string[] | undefined = undefined;
    if (process.env.NODE_ENV !== 'test') {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const viewerOrgIds = await getViewerCompanyOrgIds(session.user.id);
      if (orgId) {
        if (!viewerOrgIds.includes(orgId)) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      } else {
        orgIdsFilter = viewerOrgIds;
      }
    }

    const kpis = await prisma.kpi.findMany({
      select: {
        id: true,
        name: true,
        targetMetric: true,
        actualMetric: true,
        metTarget: true,
        metTargetPercent: true,
        quarter: true,
        year: true,
        organizationId: true,
        teamId: true,
        initiativeId: true,
        businessUnitId: true,
        createdAt: true,
        updatedAt: true,
        Team: { select: { id: true, name: true } },
      },
      where: {
        organizationId: orgIdsFilter ? { in: orgIdsFilter } : (orgId as any),
        teamId: teamId,
        initiativeId: initiativeId,
        businessUnitId: businessUnitId,
        quarter: quarter as any,
        year: year,
      },
      orderBy: [{ year: 'desc' }, { quarter: 'asc' }],
    });

    return NextResponse.json(kpis);
  } catch (error) {
    console.error('Error fetching KPIs:', error);
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const data = createKpiSchema.parse(json);

    // derive computed fields from provided metrics
    const { targetMetric, actualMetric, organizationId, teamId, initiativeId, businessUnitId, ...rest } = data as any;
    // Default organization from URL if not provided in body
    const { searchParams } = new URL(request.url);
    const orgIdFromUrl = searchParams.get('orgId') || undefined;
    const finalOrgId = organizationId || orgIdFromUrl;
    if (!finalOrgId) {
      return NextResponse.json({ error: 'organizationId is required' }, { status: 400 });
    }
    if (process.env.NODE_ENV !== 'test') {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const viewerOrgIds = await getViewerCompanyOrgIds(session.user.id);
      if (!viewerOrgIds.includes(finalOrgId)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }
    const org = await prisma.organization.findUnique({ where: { id: finalOrgId } });
    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 400 });
    }
    let metTarget: boolean | undefined = undefined;
    let metTargetPercent: number | undefined = undefined;
    if (typeof actualMetric === 'number' && typeof targetMetric === 'number') {
      metTarget = actualMetric >= targetMetric;
      if (targetMetric !== 0) {
        metTargetPercent = (actualMetric / targetMetric) * 100;
      } else {
        metTargetPercent = undefined; // avoid divide by zero
      }
    }

    const kpi = await prisma.kpi.create({
      data: {
        id: crypto.randomUUID(),
        ...rest,
        targetMetric,
        actualMetric,
        metTarget,
        metTargetPercent,
        ...(finalOrgId ? { Organization: { connect: { id: finalOrgId } } } : {}),
        ...(teamId ? { Team: { connect: { id: teamId } } } : {}),
        ...(initiativeId ? { Initiative: { connect: { id: initiativeId } } } : {}),
        ...(businessUnitId ? { BusinessUnit: { connect: { id: businessUnitId } } } : {}),
      },
      include: { Team: true, Initiative: true },
    });

    return NextResponse.json(kpi, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
