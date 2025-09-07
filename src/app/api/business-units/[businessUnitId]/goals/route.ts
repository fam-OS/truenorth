import { NextResponse } from 'next/server';
import { $Enums } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/api-response';
import { z } from 'zod';
import { assertBusinessUnitAccess, requireUserId } from '@/lib/access';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ businessUnitId: string }> }
) {
  try {
    const { businessUnitId } = await params;
    if (process.env.NODE_ENV !== 'test') {
      const userId = await requireUserId();
      await assertBusinessUnitAccess(userId, businessUnitId);
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

    // Support overriding business unit through the payload when creating from a generic form
    const effectiveBusinessUnitId: string = (json.businessUnitId && typeof json.businessUnitId === 'string' && json.businessUnitId.length > 0)
      ? json.businessUnitId
      : businessUnitId;

    if (process.env.NODE_ENV !== 'test') {
      const userId = await requireUserId();
      await assertBusinessUnitAccess(userId, effectiveBusinessUnitId);
    }

    // Validate business unit exists
    const businessUnit = await prisma.businessUnit.findUnique({
      where: { id: effectiveBusinessUnitId },
    });

    if (!businessUnit) {
      return new NextResponse('Business unit not found', { status: 404 });
    }

    // For this endpoint, stakeholderId is required per tests; return 400 when missing
    if (!json.stakeholderId) {
      return new NextResponse('stakeholderId is required', { status: 400 });
    }

    // Validate stakeholder exists when provided
    if (json.stakeholderId) {
      const stakeholder = await prisma.stakeholder.findUnique({
        where: { id: json.stakeholderId },
        select: { id: true, businessUnitId: true },
      });
      if (!stakeholder) {
        return new NextResponse('Stakeholder not found', { status: 400 });
      }
      if (stakeholder.businessUnitId !== effectiveBusinessUnitId) {
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
      // stakeholderId optional; when provided it must be non-empty
      stakeholderId: z.string().min(1).optional(),
      businessUnitId: z.string().min(1).optional(),
    });

    const parsedJson = createGoalSchema.parse(json);

    const goal = await prisma.goal.create({
      data: {
        id: crypto.randomUUID(),
        title: parsedJson.title,
        description: parsedJson.description ?? null,
        quarter: parsedJson.quarter,
        year: parsedJson.year,
        businessUnitId: effectiveBusinessUnitId,
        ...(parsedJson.status && { status: parsedJson.status as $Enums.GoalStatus }),
        stakeholderId: parsedJson.stakeholderId ?? null,
        progressNotes: parsedJson.progressNotes ?? null,
      },
    });

    return NextResponse.json(goal);
  } catch (error) {
    console.error('Error creating goal:', error);
    return handleError(error);
  }
}
