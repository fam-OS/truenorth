import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/api-response';
import { z } from 'zod';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ businessUnitId: string }> }
) {
  try {
    const { businessUnitId } = await params;
    
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
        stakeholder: {
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

    // Validate business unit exists
    const businessUnit = await prisma.businessUnit.findUnique({
      where: { 
        id: businessUnitId,
      },
    });

    if (!businessUnit) {
      return new NextResponse('Business unit not found', { status: 404 });
    }

    // Validate stakeholder exists and belongs to the same business unit
    if (json.stakeholderId) {
      const stakeholder = await prisma.stakeholder.findUnique({
        where: { 
          id: json.stakeholderId,
          businessUnitId
        }
      });

      if (!stakeholder) {
        return new NextResponse('Stakeholder not found', { status: 400 });
      }
    }

    // Create the goal
    const createGoalSchema = z.object({
      title: z.string().min(1, 'Title is required'),
      description: z.string().optional(),
      quarter: z.enum(['Q1', 'Q2', 'Q3', 'Q4']),
      year: z.number().int().min(2020).max(2030),
      status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'CANCELLED', 'DEFERRED']).optional(),
      progressNotes: z.string().optional(),
      stakeholderId: z.string().uuid().optional(),
    });

    const parsedJson = createGoalSchema.parse(json);

    const goal = await prisma.goal.create({
      data: {
        title: parsedJson.title,
        ...(parsedJson.description && { description: parsedJson.description }),
        quarter: parsedJson.quarter,
        year: parsedJson.year,
        businessUnitId,
        ...(parsedJson.status && { status: parsedJson.status }),
        ...(parsedJson.stakeholderId && { stakeholderId: parsedJson.stakeholderId }),
        ...(parsedJson.progressNotes && { progressNotes: parsedJson.progressNotes }),
      },
      include: {
        stakeholder: true,
      },
    });

    return NextResponse.json(goal);
  } catch (error) {
    console.error('Error creating goal:', error);
    return handleError(error);
  }
}
