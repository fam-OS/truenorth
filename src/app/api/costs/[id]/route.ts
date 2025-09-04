import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/api-response';
import { upsertCostSchema } from '@/lib/validations/cost';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getViewerCompanyOrgIds } from '@/lib/access';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    let viewerOrgIds: string[] = [];
    if (process.env.NODE_ENV !== 'test') {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      viewerOrgIds = await getViewerCompanyOrgIds(session.user.id);
      const existing = await prisma.cost.findUnique({
        where: { id },
        include: { Team: true } as any,
      });
      if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      const orgId = (existing as any).organizationId ?? (existing as any).Team?.organizationId;
      if (!orgId || !viewerOrgIds.includes(orgId)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }
    const json = await request.json();
    const data = upsertCostSchema.partial({ teamId: true, year: true, type: true }).parse(json);

    const updated = await prisma.cost.update({
      where: { id },
      data: {
        // allow updating any field; optional checks above
        ...(data.teamId ? { teamId: data.teamId } : {}),
        ...(data.organizationId !== undefined ? { organizationId: data.organizationId || undefined } : {}),
        ...(data.year ? { year: data.year } : {}),
        ...(data.type ? { type: data.type } : {}),
        ...(data.q1Forecast !== undefined ? { q1Forecast: data.q1Forecast as any } : {}),
        ...(data.q1Actual !== undefined ? { q1Actual: data.q1Actual as any } : {}),
        ...(data.q2Forecast !== undefined ? { q2Forecast: data.q2Forecast as any } : {}),
        ...(data.q2Actual !== undefined ? { q2Actual: data.q2Actual as any } : {}),
        ...(data.q3Forecast !== undefined ? { q3Forecast: data.q3Forecast as any } : {}),
        ...(data.q3Actual !== undefined ? { q3Actual: data.q3Actual as any } : {}),
        ...(data.q4Forecast !== undefined ? { q4Forecast: data.q4Forecast as any } : {}),
        ...(data.q4Actual !== undefined ? { q4Actual: data.q4Actual as any } : {}),
        ...(data.notes !== undefined ? { notes: data.notes || undefined } : {}),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
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
      const viewerOrgIds = await getViewerCompanyOrgIds(session.user.id);
      const existing = await prisma.cost.findUnique({ where: { id }, include: { Team: true } as any });
      if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      const orgId = (existing as any).organizationId ?? (existing as any).Team?.organizationId;
      if (!orgId || !viewerOrgIds.includes(orgId)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }
    await prisma.cost.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}
