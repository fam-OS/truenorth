import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createStakeholderSchema } from '@/lib/validations/organization';
import { handleError } from '@/lib/api-response';

export async function GET(
  request: Request,
  { params }: { params: { businessUnitId: string } }
) {
  try {
    const stakeholders = await prisma.stakeholder.findMany({
      where: {
        businessUnitId: params.businessUnitId,
      },
      include: {
        goals: true,
        meetings: true,
      },
    });

    return NextResponse.json(stakeholders);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: { businessUnitId: string } }
) {
  try {
    const json = await request.json();
    const data = createStakeholderSchema.parse({
      ...json,
      businessUnitId: params.businessUnitId,
    });

    const stakeholder = await prisma.stakeholder.create({
      data,
      include: {
        goals: true,
        meetings: true,
      },
    });

    return NextResponse.json(stakeholder, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}