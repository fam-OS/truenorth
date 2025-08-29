import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(
  request: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organizationId } = params;

    const goals = await prisma.ceoGoal.findMany({
      where: { organizationId },
      orderBy: { order: 'asc' }
    });

    return NextResponse.json(goals);
  } catch (error) {
    console.error('Error fetching CEO goals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch CEO goals' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organizationId } = params;
    const { goals } = await request.json();

    // Delete existing goals for this organization
    await prisma.ceoGoal.deleteMany({
      where: { organizationId }
    });

    // Create new goals
    const createdGoals = await Promise.all(
      goals.map((goal: { description: string }, index: number) => 
        prisma.ceoGoal.create({
          data: {
            description: goal.description,
            order: index,
            organizationId
          }
        })
      )
    );

    return NextResponse.json(createdGoals);
  } catch (error) {
    console.error('Error saving CEO goals:', error);
    return NextResponse.json(
      { error: 'Failed to save CEO goals' },
      { status: 500 }
    );
  }
}
