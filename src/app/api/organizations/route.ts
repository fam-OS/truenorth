import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createOrganizationSchema } from '@/lib/validations/organization';
import { handleError } from '@/lib/api-response';

export async function GET() {
  try {
    const organizations = await prisma.organization.findMany({
      include: {
        businessUnits: {
          include: {
            stakeholders: true,
            metrics: true,
          },
        },
      },
    });

    return NextResponse.json(organizations);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const data = createOrganizationSchema.parse(json);

    const organization = await prisma.organization.create({
      data,
      include: {
        businessUnits: true,
      },
    });

    return NextResponse.json(organization, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}