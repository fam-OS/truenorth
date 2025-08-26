import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/api-response';

type GoalUpdateData = {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: string;
  requirements?: string;
  progressNotes?: string;
};

export async function PUT(
  request: Request,
  { params }: { params: { businessUnitId: string; goalId: string } }
) {
  try {
    const { businessUnitId, goalId } = params;
    const json = await request.json();

    // Verify the goal exists and belongs to the business unit
    const existingGoal = await prisma.goal.findUnique({
      where: { id: goalId },
      include: {
        stakeholder: {
          include: {
            businessUnit: true,
          },
        },
      },
    });

    if (!existingGoal) {
      return new NextResponse('Goal not found', { status: 404 });
    }

    if (existingGoal.stakeholder.businessUnitId !== businessUnitId) {
      return new NextResponse('Goal does not belong to this business unit', { status: 403 });
    }

    // Update the goal
    const updatedGoal = await prisma.goal.update({
      where: { id: goalId },
      data: {
        title: json.title,
        description: json.description,
        startDate: new Date(json.startDate),
        endDate: new Date(json.endDate),
        status: json.status,
        requirements: json.requirements || null,
        progressNotes: json.progressNotes || null,
      },
      include: {
        stakeholder: true,
      },
    });

    return NextResponse.json(updatedGoal);
  } catch (error) {
    return handleError(error);
  }
}
