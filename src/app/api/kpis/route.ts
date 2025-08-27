import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/api-response';
import { createKpiSchema } from '@/lib/validations/kpi';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId') || undefined;
    const teamId = searchParams.get('teamId') || undefined;
    const initiativeId = searchParams.get('initiativeId') || undefined;
    const quarter = searchParams.get('quarter') || undefined;
    const year = searchParams.get('year') ? parseInt(searchParams.get('year') as string, 10) : undefined;

    const kpis = await prisma.kpi.findMany({
      where: {
        organizationId: orgId,
        teamId: teamId,
        initiativeId: initiativeId,
        quarter: quarter as any,
        year: year,
      },
      include: { team: true, initiative: true },
      orderBy: [{ year: 'desc' }, { quarter: 'asc' }],
    });

    return NextResponse.json(kpis);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const data = createKpiSchema.parse(json);

    const kpi = await prisma.kpi.create({
      data,
      include: { team: true, initiative: true },
    });

    return NextResponse.json(kpi, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
