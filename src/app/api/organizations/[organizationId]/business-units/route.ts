import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createBusinessUnitSchema } from '@/lib/validations/organization';
import { handleError } from '@/lib/api-response';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    // Destructure params at the beginning of the function
    const { organizationId } = await params;
    console.log('[BU.GET] organizationId param =', organizationId);
    
    const businessUnits = await prisma.businessUnit.findMany({
      where: {
        orgId: organizationId,
      },
      include: {
        stakeholders: true,
        metrics: true,
      },
    });

    console.log('[BU.GET] found businessUnits =', businessUnits.length);

    return NextResponse.json(businessUnits);
  } catch (error) {
    console.error('[BU.GET] error', error);
    return handleError(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    // Destructure params at the beginning of the function
    const { organizationId } = await params;
    console.log('[BU.POST] organizationId param =', organizationId);
    const json = await request.json();
    const data = createBusinessUnitSchema.parse(json);

    const businessUnit = await prisma.businessUnit.create({
      data: {
        name: data.name,
        description: data.description,
        organization: { connect: { id: organizationId } },
      },
      include: {
        stakeholders: true,
        metrics: true,
      },
    });

    console.log('[BU.POST] created businessUnit id =', businessUnit.id);

    return NextResponse.json(businessUnit, { status: 201 });
  } catch (error) {
    console.error('[BU.POST] error', error);
    return handleError(error);
  }
}