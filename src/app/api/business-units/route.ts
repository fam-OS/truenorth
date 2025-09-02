import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/api-response';

export async function GET() {
  try {
    const businessUnits = await prisma.businessUnit.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        Organization: true,
        Stakeholder: true,
        Metric: true,
        Goal: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(businessUnits);
  } catch (error) {
    console.error('Error fetching business units:', error);
    return handleError(error);
  }
}
