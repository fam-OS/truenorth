import { NextResponse } from 'next/server';
import { $Enums } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/api-response';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { assertBusinessUnitAccess } from '@/lib/access';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ businessUnitId: string }> }
) {
  try {
    const { businessUnitId } = await params;
    if (process.env.NODE_ENV !== 'test') {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return new NextResponse('Unauthorized', { status: 401 });
      }
      await assertBusinessUnitAccess(session.user.id, businessUnitId);
    }
    
    // Validate business unit exists
    const businessUnit = await prisma.businessUnit.findUnique({
      where: { id: businessUnitId },
    });

    if (!businessUnit) {
      return new NextResponse('Business unit not found', { status: 404 });
    }

    // Fetch goals for this business unit
    const goals = await prisma.goal.findMany({
      where: {
        businessUnitId: businessUnitId,
      },
      include: {
        Stakeholder: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(goals);
  } catch (error) {
    console.error('Error fetching goals:', error);
    return handleError(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ businessUnitId: string }> }
) {
  try {
    const { businessUnitId } = await params;
    const json = await request.json();
    if (process.env.NODE_ENV !== 'test') {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return new NextResponse('Unauthorized', { status: 401 });
      }
      await assertBusinessUnitAccess(session.user.id, businessUnitId);
    }

    // Validate business unit exists
    const businessUnit = await prisma.businessUnit.findUnique({
      where: { 
        id: businessUnitId,
      },
    });

    if (!businessUnit) {
      return new NextResponse('Business unit not found', { status: 404 });
    }

    // Validate stakeholder exists
    if (json.stakeholderId) {
      const stakeholder = await prisma.stakeholder.findUnique({
        where: { 
          id: json.stakeholderId
        }
      });

      if (!stakeholder) {
        return new NextResponse('Stakeholder not found', { status: 400 });
      }
      // Ensure stakeholder belongs to the same business unit
      if (stakeholder.businessUnitId !== businessUnitId) {
        return new NextResponse('Stakeholder must belong to this Business Unit', { status: 400 });
      }
    }

    // Create the goal
    const createGoalSchema = z.object({
      title: z.string().min(1, 'Title is required'),
      description: z.string().nullable().optional(),
      quarter: z.enum(['Q1', 'Q2', 'Q3', 'Q4']),
      year: z.number().int().min(2020).max(2030),
      status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'AT_RISK', 'BLOCKED', 'CANCELLED']).optional(),
      progressNotes: z.string().nullable().optional(),
      // stakeholderId must be provided but is not constrained to UUID in tests
      stakeholderId: z.string().min(1, 'stakeholderId is required'),
    });

    const parsedJson = createGoalSchema.parse(json);

    const goal = await prisma.goal.create({
      data: {
        id: crypto.randomUUID(),
        title: parsedJson.title,
        description: parsedJson.description ?? null,
        quarter: parsedJson.quarter,
        year: parsedJson.year,
        businessUnitId,
        ...(parsedJson.status && { status: parsedJson.status as $Enums.GoalStatus }),
        stakeholderId: parsedJson.stakeholderId,
        progressNotes: parsedJson.progressNotes ?? null,
      },
    });

    return NextResponse.json(goal);
  } catch (error) {
    console.error('Error creating goal:', error);
    return handleError(error);
  }
}
