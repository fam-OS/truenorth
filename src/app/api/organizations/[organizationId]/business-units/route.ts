import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createBusinessUnitSchema } from '@/lib/validations/organization';
import { handleError } from '@/lib/api-response';

export async function GET(
  request: Request,
  { params }: { params: { organizationId: string } }
) {
  try {
    const businessUnits = await prisma.businessUnit.findMany({
      where: {
        organization: { id: params.organizationId },
      },
      include: {
        stakeholders: true,
        metrics: true,
      },
    });

    return NextResponse.json(businessUnits);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: { organizationId: string } }
) {
  try {
    const json = await request.json();
    const data = createBusinessUnitSchema.parse(json);

    const businessUnit = await prisma.businessUnit.create({
      data: {
        name: data.name,
        description: data.description,
        organization: { connect: { id: params.organizationId } },
      },
      include: {
        stakeholders: true,
        metrics: true,
      },
    });

    return NextResponse.json(businessUnit, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}