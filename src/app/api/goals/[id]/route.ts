import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get goal first
    const goal = await prisma.goal.findUnique({
      where: { id: params.id }
    });

    if (!goal) {
      console.warn('GET /api/goals/[id] 404: goal not found', {
        userId: session.user.id,
        goalId: params.id
      });
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    // Get business unit and verify ownership
    const businessUnit = await prisma.businessUnit.findUnique({
      where: { id: goal.businessUnitId }
    });

    if (!businessUnit?.organizationId) {
      console.warn('GET /api/goals/[id] 404: business unit missing or has no organizationId', {
        userId: session.user.id,
        goalId: params.id,
        businessUnitId: goal.businessUnitId
      });
      return NextResponse.json({ error: 'Business unit not found' }, { status: 404 });
    }

    // Get organization and verify ownership
    const organization = await prisma.organization.findUnique({
      where: { id: businessUnit.organizationId }
    });

    if (!organization) {
      console.warn('GET /api/goals/[id] 404: organization not found', {
        userId: session.user.id,
        goalId: params.id,
        businessUnitId: goal.businessUnitId,
        organizationId: businessUnit.organizationId
      });
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Check if user owns this company account
    const companyAccount = await prisma.companyAccount.findFirst({
      where: {
        userId: session.user.id,
        id: organization.companyAccountId
      }
    });

    if (!companyAccount) {
      console.warn('GET /api/goals/[id] 404: companyAccount check failed (user does not own organization)', {
        userId: session.user.id,
        goalId: params.id,
        businessUnitId: goal.businessUnitId,
        organizationId: organization.id,
        companyAccountId: organization.companyAccountId
      });
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
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
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, status, requirements, progressNotes, quarter, year, stakeholderId } = body;

    // Find goal with includes
    const goal = await prisma.goal.findUnique({
      where: { id: params.id },
    });

    if (!goal) {
      console.warn('PUT /api/goals/[id] 404: goal not found', {
        userId: session.user.id,
        goalId: params.id
      });
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    const updatedGoal = await prisma.goal.update({
      where: { id: params.id },
      data: {
        title,
        description,
        status,
        requirements,
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
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const goal = await prisma.goal.findUnique({
      where: { id: params.id }
    });

    if (!goal) {
      console.warn('DELETE /api/goals/[id] 404: goal not found', {
        userId: session.user.id,
        goalId: params.id
      });
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    // Verify ownership
    const businessUnit = await prisma.businessUnit.findUnique({
      where: { id: goal.businessUnitId }
    });

    if (!businessUnit?.organizationId) {
      console.warn('DELETE /api/goals/[id] 404: business unit missing or has no organizationId', {
        userId: session.user.id,
        goalId: params.id,
        businessUnitId: goal.businessUnitId
      });
      return NextResponse.json({ error: 'Business unit not found' }, { status: 404 });
    }

    const organization = await prisma.organization.findUnique({
      where: { id: businessUnit.organizationId }
    });

    const companyAccount = await prisma.companyAccount.findFirst({
      where: {
        userId: session.user.id,
        id: organization?.companyAccountId
      }
    });

    if (!companyAccount) {
      console.warn('DELETE /api/goals/[id] 404: companyAccount check failed (user does not own organization)', {
        userId: session.user.id,
        goalId: params.id,
        businessUnitId: goal.businessUnitId,
        organizationId: organization?.id,
        companyAccountId: organization?.companyAccountId
      });
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    await prisma.goal.delete({
      where: { id: params.id }
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
