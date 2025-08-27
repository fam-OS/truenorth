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
    const data = updateKpiSchema.parse(json);

    const updated = await prisma.kpi.update({
      where: { id: params.id },
      data,
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
