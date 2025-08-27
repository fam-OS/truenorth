import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/api-response';
import { createInitiativeSchema } from '@/lib/validations/initiative';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId') || undefined;
    const ownerId = searchParams.get('ownerId') || undefined;
    const businessUnitId = searchParams.get('businessUnitId') || undefined;

    const initiatives = await prisma.initiative.findMany({
      where: {
        organizationId: orgId,
        ownerId: ownerId,
        businessUnitId: businessUnitId,
      },
      include: {
        organization: true,
        owner: true,
        kpis: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(initiatives);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const data = createInitiativeSchema.parse(json);

    const { organizationId, ownerId, businessUnitId, ...rest } = data as any;
    const createData: any = { ...rest };
    if (organizationId) {
      createData.organization = { connect: { id: organizationId } };
    }
    if (ownerId !== undefined) {
      createData.owner = ownerId ? { connect: { id: ownerId } } : undefined;
    }
    if (businessUnitId !== undefined) {
      createData.businessUnit = businessUnitId ? { connect: { id: businessUnitId } } : undefined;
    }

    const initiative = await prisma.initiative.create({
      data: createData,
      include: { organization: true, owner: true },
    });

    return NextResponse.json(initiative, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
