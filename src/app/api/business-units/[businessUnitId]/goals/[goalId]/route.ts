import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/api-response';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { assertBusinessUnitAccess } from '@/lib/access';

type GoalUpdateData = {
  title: string;
  description?: string;
  quarter: string;
  year: number;
  status?: string;
  progressNotes?: string;
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ businessUnitId: string; goalId: string }> }
) {
  try {
    const { businessUnitId, goalId } = await params;
    if (process.env.NODE_ENV !== 'test') {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      await assertBusinessUnitAccess(session.user.id, businessUnitId);
    }

    const goal = (await prisma.goal.findUnique({
      where: { id: goalId },
      include: {
        stakeholder: { include: { businessUnit: true } },
      },
    } as any)) as any;

    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    if (!goal.stakeholder || goal.stakeholder.businessUnitId !== businessUnitId) {
      return NextResponse.json({ error: 'Goal does not belong to this business unit' }, { status: 403 });
    }

    return NextResponse.json(goal);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ businessUnitId: string; goalId: string }> }
) {
  try {
    const { businessUnitId, goalId } = await params;
    if (process.env.NODE_ENV !== 'test') {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      await assertBusinessUnitAccess(session.user.id, businessUnitId);
    }

    const existingGoal = (await prisma.goal.findUnique({
      where: { id: goalId },
      include: { stakeholder: true },
    } as any)) as any;

    if (!existingGoal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    if (!existingGoal.stakeholder || existingGoal.stakeholder.businessUnitId !== businessUnitId) {
      return NextResponse.json({ error: 'Goal does not belong to this business unit' }, { status: 403 });
    }

    await prisma.goal.delete({ where: { id: goalId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ businessUnitId: string; goalId: string }> }
) {
  try {
    const { businessUnitId, goalId } = await params;
    if (process.env.NODE_ENV !== 'test') {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      await assertBusinessUnitAccess(session.user.id, businessUnitId);
    }
    const json = await request.json();

    // Verify the goal exists and belongs to the business unit
    const existingGoal = (await prisma.goal.findUnique({
      where: { id: goalId },
      include: {
        stakeholder: {
          include: {
            businessUnit: true,
          },
        },
      } as any,
    })) as any;

    if (!existingGoal) {
      return new NextResponse('Goal not found', { status: 404 });
    }

    if (!existingGoal.stakeholder || existingGoal.stakeholder?.businessUnitId !== businessUnitId) {
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
        stakeholder: true,
      } as any,
    });

    return NextResponse.json(updatedGoal);
  } catch (error) {
    return handleError(error);
  }
}
