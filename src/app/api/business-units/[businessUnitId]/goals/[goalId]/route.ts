import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/api-response';

type GoalUpdateData = {
  title: string;
  description?: string;
  quarter: string;
  year: number;
  status?: string;
  progressNotes?: string;
};

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ businessUnitId: string; goalId: string }> }
) {
  try {
    const { businessUnitId, goalId } = await params;
    const json = await request.json();

    // Verify the goal exists and belongs to the business unit
    const existingGoal = await prisma.goal.findUnique({
      where: { id: goalId },
      include: {
        Stakeholder: {
          include: {
            BusinessUnit: true,
          },
        },
      },
    });

    if (!existingGoal) {
      return new NextResponse('Goal not found', { status: 404 });
    }

    if (!existingGoal.Stakeholder || existingGoal.Stakeholder?.businessUnitId !== businessUnitId) {
      return new NextResponse('Goal does not belong to this business unit', { status: 403 });
    }

    // Update the goal
    const updatedGoal = await prisma.goal.update({
      where: { id: goalId },
      data: {
        title: json.title,
        description: json.description || null,
        quarter: json.quarter,
        year: json.year,
        ...(json.status && { status: json.status }),
        progressNotes: json.progressNotes || null,
      },
      include: {
        Stakeholder: true,
      },
    });

    return NextResponse.json(updatedGoal);
  } catch (error) {
    return handleError(error);
  }
}
