import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { assertBusinessUnitAccess } from '@/lib/access';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    // Get goal first
    const goal = await prisma.goal.findUnique({
      where: { id }
    });

    if (!goal) {
      console.warn('GET /api/goals/[id] 404: goal not found', {
        userId: session.user.id,
        goalId: id
      });
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    // Fetch business unit and assert access in non-test env
    const businessUnit = await prisma.businessUnit.findUnique({
      where: { id: goal.businessUnitId }
    });
    if (process.env.NODE_ENV !== 'test') {
      await assertBusinessUnitAccess(session.user.id, goal.businessUnitId);
    }

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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, status, progressNotes, quarter, year, stakeholderId } = body;

    const { id } = await params;
    // Find goal with includes
    const goal = await prisma.goal.findUnique({
      where: { id },
    });

    if (!goal) {
      console.warn('PUT /api/goals/[id] 404: goal not found', {
        userId: session.user.id,
        goalId: id
      });
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    if (process.env.NODE_ENV !== 'test' && goal) {
      await assertBusinessUnitAccess(session.user.id, goal.businessUnitId);
    }
    const updatedGoal = await prisma.goal.update({
      where: { id },
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('DELETE /api/goals/[id] called', { id });
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.warn('DELETE /api/goals/[id] unauthorized', { id });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const goal = await prisma.goal.findUnique({
      where: { id }
    });

    if (!goal) {
      console.warn('DELETE /api/goals/[id] 404: goal not found', {
        userId: session.user.id,
        goalId: id
      });
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }
    if (process.env.NODE_ENV !== 'test') {
      await assertBusinessUnitAccess(session.user.id, goal.businessUnitId);
    }

    await prisma.goal.delete({
      where: { id }
    });
    console.log('DELETE /api/goals/[id] success', { id });
    return NextResponse.json({ message: 'Goal deleted successfully' });
  } catch (error) {
    console.error('Error deleting goal:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
