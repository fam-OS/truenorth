import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/api-response';
import { updateKpiSchema } from '@/lib/validations/kpi';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getViewerCompanyOrgIds } from '@/lib/access';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const kpi = await prisma.kpi.findUnique({
      where: { id: id },
      include: { Team: true, Initiative: true, Organization: true, BusinessUnit: true } as any,
    });

    if (!kpi) {
      return NextResponse.json({ error: 'KPI not found' }, { status: 404 });
    }

    if (process.env.NODE_ENV !== 'test') {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const orgIds = await getViewerCompanyOrgIds(session.user.id);
      const orgId = (kpi as any).organizationId ?? (kpi as any).Team?.organizationId ?? (kpi as any).BusinessUnit?.organizationId ?? (kpi as any).Initiative?.organizationId;
      if (!orgId || !orgIds.includes(orgId)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    return NextResponse.json(kpi);
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (process.env.NODE_ENV !== 'test') {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const orgIds = await getViewerCompanyOrgIds(session.user.id);
      const existing = await prisma.kpi.findUnique({
        where: { id },
        include: { Team: true, Initiative: true, Organization: true, BusinessUnit: true } as any,
      });
      if (!existing) return NextResponse.json({ error: 'KPI not found' }, { status: 404 });
      const orgId = (existing as any).organizationId ?? (existing as any).Team?.organizationId ?? (existing as any).BusinessUnit?.organizationId ?? (existing as any).Initiative?.organizationId;
      if (!orgId || !orgIds.includes(orgId)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }
    const json = await request.json();
    const parsed = updateKpiSchema.parse(json);

    // If metrics are being updated, recompute derived fields
    const { targetMetric, actualMetric, organizationId, teamId, initiativeId, businessUnitId, ...rest } = parsed as any;
    const computed: { metTarget?: boolean; metTargetPercent?: number } = {};
    const hasActual = typeof actualMetric === 'number';
    const hasTarget = typeof targetMetric === 'number';

    // Load existing metrics if only one is provided so we can recompute
    let newActual = actualMetric as number | undefined;
    let newTarget = targetMetric as number | undefined;
    if (hasActual || hasTarget) {
      const existing = await prisma.kpi.findUnique({
        where: { id: id },
        select: { actualMetric: true, targetMetric: true },
      });
      if (!hasActual) newActual = existing?.actualMetric ?? undefined;
      if (!hasTarget) newTarget = existing?.targetMetric ?? undefined;
      if (typeof newActual === 'number' && typeof newTarget === 'number') {
        computed.metTarget = newActual >= newTarget;
        computed.metTargetPercent = newTarget !== 0 ? (newActual / newTarget) * 100 : undefined;
      }
    }

    const updated = await prisma.kpi.update({
      where: { id: id },
      data: {
        ...rest,
        ...(hasTarget ? { targetMetric } : {}),
        ...(hasActual ? { actualMetric } : {}),
        ...computed,
        ...(organizationId ? { Organization: { connect: { id: organizationId } } } : {}),
        ...(teamId ? { Team: { connect: { id: teamId } } } : {}),
        ...(initiativeId ? { Initiative: { connect: { id: initiativeId } } } : {}),
        ...(businessUnitId ? { BusinessUnit: { connect: { id: businessUnitId } } } : {}),
      },
      include: { Team: true, Initiative: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json({ error: 'KPI not found' }, { status: 404 });
    }
    return handleError(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (process.env.NODE_ENV !== 'test') {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const orgIds = await getViewerCompanyOrgIds(session.user.id);
      const existing = await prisma.kpi.findUnique({ where: { id }, include: { Team: true, Initiative: true, Organization: true, BusinessUnit: true } as any });
      if (!existing) return NextResponse.json({ error: 'KPI not found' }, { status: 404 });
      const orgId = (existing as any).organizationId ?? (existing as any).Team?.organizationId ?? (existing as any).BusinessUnit?.organizationId ?? (existing as any).Initiative?.organizationId;
      if (!orgId || !orgIds.includes(orgId)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }
    await prisma.kpi.delete({ where: { id: id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
      return NextResponse.json({ error: 'KPI not found' }, { status: 404 });
    }
    return handleError(error);
  }
}
