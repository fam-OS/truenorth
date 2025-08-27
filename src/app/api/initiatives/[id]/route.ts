import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/api-response';
import { updateInitiativeSchema } from '@/lib/validations/initiative';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const initiative = await prisma.initiative.findUnique({
      where: { id: params.id },
      include: { organization: true, owner: true, kpis: true },
    });

    if (!initiative) {
      return NextResponse.json({ error: 'Initiative not found' }, { status: 404 });
    }

    return NextResponse.json(initiative);
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const json = await request.json();
    const data = updateInitiativeSchema.parse(json);

    const { organizationId, ownerId, businessUnitId, ...rest } = data as any;
    const updateData: any = { ...rest };
    if (organizationId) {
      updateData.organization = { connect: { id: organizationId } };
    }
    if (ownerId !== undefined) {
      updateData.owner = ownerId ? { connect: { id: ownerId } } : { disconnect: true };
    }
    if (businessUnitId !== undefined) {
      updateData.businessUnit = businessUnitId ? { connect: { id: businessUnitId } } : { disconnect: true };
    }

    const updated = await prisma.initiative.update({
      where: { id: params.id },
      data: updateData,
      include: { organization: true, owner: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json({ error: 'Initiative not found' }, { status: 404 });
    }
    return handleError(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.initiative.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
      return NextResponse.json({ error: 'Initiative not found' }, { status: 404 });
    }
    return handleError(error);
  }
}
