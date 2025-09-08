'use server';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/api-response';
import { getViewerCompanyOrgIds } from '@/lib/access';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

async function assertKpiAccess(kpiId: string) {
  if (process.env.NODE_ENV === 'test') return;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const orgIds = await getViewerCompanyOrgIds(session.user.id);
  const kpi = await prisma.kpi.findUnique({ where: { id: kpiId }, include: { Organization: true, Team: true, BusinessUnit: true, Initiative: true } as any });
  if (!kpi) throw NextResponse.json({ error: 'KPI not found' }, { status: 404 });
  const orgId = (kpi as any).organizationId ?? (kpi as any).Team?.organizationId ?? (kpi as any).BusinessUnit?.organizationId ?? (kpi as any).Initiative?.organizationId;
  if (!orgId || !orgIds.includes(orgId)) throw NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

async function recomputeKpi(id: string) {
  const sum = await (prisma as any).kpiStatus.aggregate({ where: { kpiId: id }, _sum: { amount: true } });
  const actual = sum._sum?.amount ?? 0;
  const kpi = await prisma.kpi.findUnique({ where: { id }, select: { targetMetric: true } });
  const t = kpi?.targetMetric ?? undefined;
  const mt = typeof t === 'number' ? actual >= t : undefined;
  const mtp = typeof t === 'number' && t !== 0 ? (actual / t) * 100 : undefined;
  await prisma.kpi.update({ where: { id }, data: { actualMetric: actual, metTarget: mt, metTargetPercent: mtp } });
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await assertKpiAccess(id);
    const rows = await (prisma as any).kpiStatus.findMany({ where: { kpiId: id }, orderBy: [{ year: 'desc' }, { quarter: 'asc' }] });
    return NextResponse.json(rows);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await assertKpiAccess(id);
    const json = await req.json();
    const { year, quarter, amount } = json as { year: number; quarter: 'Q1'|'Q2'|'Q3'|'Q4'; amount: number };
    if (!year || !quarter || typeof amount !== 'number') {
      return NextResponse.json({ error: 'year, quarter, and amount are required' }, { status: 400 });
    }
    const created = await (prisma as any).kpiStatus.create({ data: { kpiId: id, year, quarter, amount } });
    await recomputeKpi(id);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
