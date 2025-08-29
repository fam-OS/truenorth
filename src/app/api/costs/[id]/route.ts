import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/api-response';
import { upsertCostSchema } from '@/lib/validations/cost';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
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
    await prisma.cost.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}
