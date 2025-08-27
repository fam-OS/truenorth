import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/api-response';
import { updateKpiSchema } from '@/lib/validations/kpi';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const kpi = await prisma.kpi.findUnique({
      where: { id: params.id },
      include: { team: true, initiative: true },
    });

    if (!kpi) {
      return NextResponse.json({ error: 'KPI not found' }, { status: 404 });
    }

    return NextResponse.json(kpi);
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const json = await request.json();
    const parsed = updateKpiSchema.parse(json);

    // If metrics are being updated, recompute derived fields
    const { targetMetric, actualMetric, organizationId, teamId, initiativeId, businessUnitId, ...rest } = parsed as any;
    let computed: { metTarget?: boolean; metTargetPercent?: number } = {};
    const hasActual = typeof actualMetric === 'number';
    const hasTarget = typeof targetMetric === 'number';

    // Load existing metrics if only one is provided so we can recompute
    let newActual = actualMetric as number | undefined;
    let newTarget = targetMetric as number | undefined;
    if (hasActual || hasTarget) {
      const existing = await prisma.kpi.findUnique({
        where: { id: params.id },
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
      where: { id: params.id },
      data: {
        ...rest,
        ...(hasTarget ? { targetMetric } : {}),
        ...(hasActual ? { actualMetric } : {}),
        ...computed,
        ...(organizationId ? { organization: { connect: { id: organizationId } } } : {}),
        ...(teamId ? { team: { connect: { id: teamId } } } : {}),
        ...(initiativeId ? { initiative: { connect: { id: initiativeId } } } : {}),
        ...(businessUnitId ? { businessUnit: { connect: { id: businessUnitId } } } : {}),
      },
      include: { team: true, initiative: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json({ error: 'KPI not found' }, { status: 404 });
    }
    return handleError(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.kpi.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
      return NextResponse.json({ error: 'KPI not found' }, { status: 404 });
    }
    return handleError(error);
  }
}
