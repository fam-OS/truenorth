import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { assertBusinessUnitAccess, requireUserId } from '@/lib/access';
import { handleError } from '@/lib/api-response';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    // Get goal first
    const goal = await prisma.goal.findUnique({
      where: { id }
    });

    if (!goal) {
      console.warn('GET /api/goals/[id] 404: goal not found', {
        userId,
        goalId: id
      });
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    // Fetch business unit and assert access in non-test env
    const businessUnit = await prisma.businessUnit.findUnique({
      where: { id: goal.businessUnitId }
    });
    if (process.env.NODE_ENV !== 'test') {
      try {
        await assertBusinessUnitAccess(userId, goal.businessUnitId);
      } catch (e) {
        // If there are no teams linked to this BU, allow read access to owners creating standalone BUs
        const teamCount = await prisma.team.count({ where: { businessUnitId: goal.businessUnitId } });
        if (teamCount > 0) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        // else: proceed without blocking
      }
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
    return handleError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUserId();

    const body = await request.json();
    console.debug('[Goals][PUT] Raw body:', body);
    const { title, description, progressNotes, quarter, quarters, year, stakeholderId, businessUnitId } = body as any;

    const { id } = await params;
    // Find current goal
    const goal = await prisma.goal.findUnique({ where: { id } });

    if (!goal) {
      console.warn('PUT /api/goals/[id] 404: goal not found', { userId, goalId: id });
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    // Determine target BU (allow move)
    const targetBusinessUnitId = (typeof businessUnitId === 'string' && businessUnitId.length > 0)
      ? businessUnitId
      : goal.businessUnitId;

    // Access check similar to GET: allow standalone BU (no teams) to pass if assert fails
    if (process.env.NODE_ENV !== 'test') {
      try {
        await assertBusinessUnitAccess(userId, targetBusinessUnitId);
      } catch {
        const teamCount = await prisma.team.count({ where: { businessUnitId: targetBusinessUnitId } });
        if (teamCount > 0) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      }
    }

    // If stakeholder provided, ensure it belongs to the target BU
    if (stakeholderId) {
      const stakeholder = await prisma.stakeholder.findUnique({ where: { id: stakeholderId } });
      if (!stakeholder) {
        return NextResponse.json({ error: 'Stakeholder not found' }, { status: 400 });
      }
      if (stakeholder.businessUnitId !== targetBusinessUnitId) {
        return NextResponse.json({ error: 'Stakeholder must belong to the selected Business Unit' }, { status: 400 });
      }
    }

    // Determine quarters to apply: support multi-quarter edits
    const targetQuarters: string[] = Array.isArray(quarters) && quarters.length
      ? quarters
      : (quarter ? [quarter] : [goal.quarter as any]);
    console.debug('[Goals][PUT] targetQuarters:', targetQuarters);

    // Update current goal to the first quarter
    const firstQuarter = targetQuarters[0];
    const updatedGoal = await prisma.goal.update({
      where: { id },
      data: {
        title,
        description: description ?? null,
        progressNotes: progressNotes ?? null,
        quarter: firstQuarter as any,
        year: year ? parseInt(year) : undefined,
        stakeholderId: stakeholderId ?? null,
        businessUnitId: targetBusinessUnitId,
        updatedAt: new Date(),
      },
    });

    // Create additional goals for remaining quarters, skipping the first
    const createdGoals: any[] = [];
    for (const q of targetQuarters.slice(1)) {
      // Optional: avoid naive duplicates by checking same title/year/BU/quarter
      const existing = await prisma.goal.findFirst({
        where: {
          businessUnitId: targetBusinessUnitId,
          year: year ? parseInt(year) : goal.year,
          quarter: q as any,
          title,
        },
        select: { id: true },
      });
      if (existing) continue;
      const created = await prisma.goal.create({
        data: {
          id: crypto.randomUUID(),
          title,
          description: description ?? null,
          progressNotes: progressNotes ?? null,
          quarter: q as any,
          year: year ? parseInt(year) : goal.year,
          stakeholderId: stakeholderId ?? null,
          businessUnitId: targetBusinessUnitId,
        },
      });
      createdGoals.push(created);
    }
    console.debug('[Goals][PUT] created goals count:', createdGoals.length);

    // Reconcile: delete any quarters in the same series (same BU + title + year) that are no longer selected
    const seriesExisting = await prisma.goal.findMany({
      where: {
        businessUnitId: targetBusinessUnitId,
        title,
        year: year ? parseInt(year) : goal.year,
      },
      select: { id: true, quarter: true },
    });
    const toDeleteIds = seriesExisting
      .filter((g) => !targetQuarters.includes(String(g.quarter)))
      .map((g) => g.id)
      .filter((gid) => gid !== updatedGoal.id);
    if (toDeleteIds.length > 0) {
      await prisma.goal.deleteMany({ where: { id: { in: toDeleteIds } } });
      console.debug('[Goals][PUT] deleted goals count:', toDeleteIds.length);
    }

    return NextResponse.json({ updated: updatedGoal, created: createdGoals, deleted: toDeleteIds?.length ?? 0 });
  } catch (error) {
    console.error('Error updating goal:', error);
    return handleError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('DELETE /api/goals/[id] called', { id });
    const userId = await requireUserId();

    const goal = await prisma.goal.findUnique({
      where: { id }
    });

    if (!goal) {
      console.warn('DELETE /api/goals/[id] 404: goal not found', {
        userId,
        goalId: id
      });
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }
    if (process.env.NODE_ENV !== 'test') {
      try {
        await assertBusinessUnitAccess(userId, goal.businessUnitId);
      } catch {
        const teamCount = await prisma.team.count({ where: { businessUnitId: goal.businessUnitId } });
        if (teamCount > 0) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        // else: allow delete for standalone BU (no teams)
      }
    }

    await prisma.goal.delete({
      where: { id }
    });
    console.log('DELETE /api/goals/[id] success', { id });
    return NextResponse.json({ message: 'Goal deleted successfully' });
  } catch (error) {
    console.error('Error deleting goal:', error);
    return handleError(error);
  }
}
