import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/api-response';

export async function POST(
  request: Request,
  { params }: { params: { businessUnitId: string } }
) {
  try {
    const { businessUnitId } = params;
    const json = await request.json();

    // Validate business unit exists
    const businessUnit = await prisma.businessUnit.findUnique({
      where: { 
        id: businessUnitId,
      },
    });

    if (!businessUnit) {
      return new NextResponse('Business unit not found', { status: 404 });
    }

    // Validate stakeholder exists and belongs to the same business unit
    if (json.stakeholderId) {
      const stakeholder = await prisma.stakeholder.findUnique({
        where: { 
          id: json.stakeholderId,
          businessUnitId
        }
      });

      if (!stakeholder) {
        return new NextResponse('Stakeholder not found', { status: 400 });
      }
    }

    // Create the goal
    if (!json.stakeholderId) {
      return new NextResponse('Stakeholder ID is required', { status: 400 });
    }

    const goal = await prisma.goal.create({
      data: {
        title: json.title,
        description: json.description,
        startDate: new Date(json.startDate),
        endDate: new Date(json.endDate),
        status: 'NOT_STARTED', // Default status
        stakeholderId: json.stakeholderId,
        requirements: json.requirements || null,
        progressNotes: null,
      },
    });

    return NextResponse.json(goal);
  } catch (error) {
    console.error('Error creating goal:', error);
    return handleError(error);
  }
}
