import { NextResponse } from 'next/server';
// status removed from Goal model
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
      return NextResponse.json({ error: 'Business unit not found' }, { status: 404 });
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
    console.debug('[Goals][POST] Raw body:', json);

    // Support overriding business unit through the payload when creating from a generic form
    const effectiveBusinessUnitId: string = (json.businessUnitId && typeof json.businessUnitId === 'string' && json.businessUnitId.length > 0)
      ? json.businessUnitId
      : businessUnitId;
    console.debug('[Goals][POST] effectiveBusinessUnitId:', effectiveBusinessUnitId);

    if (process.env.NODE_ENV !== 'test') {
      const userId = await requireUserId();
      await assertBusinessUnitAccess(userId, effectiveBusinessUnitId);
    }

    // Validate business unit exists
    const businessUnit = await prisma.businessUnit.findUnique({
      where: { id: effectiveBusinessUnitId },
    });

    if (!businessUnit) {
      return NextResponse.json({ error: 'Business unit not found' }, { status: 404 });
    }

    // Validate stakeholder exists when provided
    if (json.stakeholderId) {
      const stakeholder = await prisma.stakeholder.findUnique({
        where: { id: json.stakeholderId },
        select: { id: true, businessUnitId: true },
      });
      if (!stakeholder) {
        return NextResponse.json({ error: 'Stakeholder not found' }, { status: 400 });
      }
      if (stakeholder.businessUnitId !== effectiveBusinessUnitId) {
        return NextResponse.json({ error: 'Stakeholder must belong to this Business Unit' }, { status: 400 });
      }
    }

    // Create the goal
    const createGoalSchema = z.object({
      title: z.string().min(1, 'Title is required'),
      description: z.string().nullable().optional(),
      // Support either a single quarter or multiple quarters
      quarter: z.enum(['Q1', 'Q2', 'Q3', 'Q4']).optional(),
      quarters: z.array(z.enum(['Q1', 'Q2', 'Q3', 'Q4'])).optional(),
      year: z.number().int().min(2020).max(2030),
      // status removed from Goal model
      progressNotes: z.string().nullable().optional(),
      // stakeholderId optional; when provided it must be non-empty
      stakeholderId: z.string().min(1).optional(),
      businessUnitId: z.string().min(1).optional(),
    }).refine((val) => !!(val.quarter || (val.quarters && val.quarters.length > 0)), {
      message: 'At least one quarter is required',
      path: ['quarters'],
    });

    const parsedJson = createGoalSchema.parse(json);

    const targetQuarters = parsedJson.quarters && parsedJson.quarters.length > 0
      ? parsedJson.quarters
      : (parsedJson.quarter ? [parsedJson.quarter] : []);
    console.debug('[Goals][POST] targetQuarters:', targetQuarters);

    // Create one goal per quarter
    const createdGoals = [] as any[];
    for (const q of targetQuarters) {
      const goal = await prisma.goal.create({
        data: {
          id: crypto.randomUUID(),
          title: parsedJson.title,
          description: parsedJson.description ?? null,
          quarter: q as any,
          year: parsedJson.year,
          businessUnitId: effectiveBusinessUnitId,
          // status removed from Goal model
          stakeholderId: parsedJson.stakeholderId ?? null,
          progressNotes: parsedJson.progressNotes ?? null,
        },
      });
      createdGoals.push(goal);
    }

    console.debug('[Goals][POST] created goals count:', createdGoals.length);
    return NextResponse.json(createdGoals.length === 1 ? createdGoals[0] : createdGoals);
  } catch (error) {
    console.error('Error creating goal:', error);
    return handleError(error);
  }
}
