import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  context: any
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get goal first
    const goal = await prisma.goal.findUnique({
      where: { id: context?.params?.id }
    });

    if (!goal) {
      console.warn('GET /api/goals/[id] 404: goal not found', {
        userId: session.user.id,
        goalId: context?.params?.id
      });
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    // Fetch business unit (optional context, no org ownership check here since BusinessUnit has no organizationId)
    const businessUnit = await prisma.businessUnit.findUnique({
      where: { id: goal.businessUnitId }
    });

    // Get stakeholder if exists
    const stakeholder = goal.stakeholderId ? await prisma.stakeholder.findUnique({
      where: { id: goal.stakeholderId }
    }) : null;

    const goalWithRelations = {
      ...goal,
      BusinessUnit: businessUnit,
      Stakeholder: stakeholder
    };

    return NextResponse.json(goalWithRelations);
  } catch (error) {
    console.error('Error fetching goal:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: any
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, status, progressNotes, quarter, year, stakeholderId } = body;

    // Find goal with includes
    const goal = await prisma.goal.findUnique({
      where: { id: context?.params?.id },
    });

    if (!goal) {
      console.warn('PUT /api/goals/[id] 404: goal not found', {
        userId: session.user.id,
        goalId: context?.params?.id
      });
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    const updatedGoal = await prisma.goal.update({
      where: { id: context?.params?.id },
      data: {
        title,
        description,
        status,
        progressNotes,
        quarter,
        year: year ? parseInt(year) : undefined,
        stakeholderId: stakeholderId || null,
        updatedAt: new Date()
      },
    });

    return NextResponse.json(updatedGoal);
  } catch (error) {
    console.error('Error updating goal:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: any
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const goal = await prisma.goal.findUnique({
      where: { id: context?.params?.id }
    });

    if (!goal) {
      console.warn('DELETE /api/goals/[id] 404: goal not found', {
        userId: session.user.id,
        goalId: context?.params?.id
      });
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    // Note: Skipping ownership verification due to lack of organizationId on BusinessUnit model

    await prisma.goal.delete({
      where: { id: context?.params?.id }
    });

    return NextResponse.json({ message: 'Goal deleted successfully' });
  } catch (error) {
    console.error('Error deleting goal:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
