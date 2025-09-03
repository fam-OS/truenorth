import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { createGoalSchema } from '@/lib/validations/organization';
import { handleError } from '@/lib/api-response';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ stakeholderId: string }> }
) {
  try {
    // Destructure params at the beginning of the function
    const { stakeholderId } = await params;
    const goals = await prisma.goal.findMany({
      where: {
        stakeholderId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(goals);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ stakeholderId: string }> }
) {
  try {
    // Destructure params at the beginning of the function
    const { stakeholderId } = await params;
    const json = await request.json();
    const data = createGoalSchema.parse({
      ...json,
      stakeholderId,
    });

    // Fetch stakeholder to resolve required businessUnitId
    const stakeholder = await prisma.stakeholder.findUnique({
      where: { id: stakeholderId },
      select: { businessUnitId: true },
    });

    if (!stakeholder) {
      return NextResponse.json({ error: 'Stakeholder not found' }, { status: 404 });
    }

    if (!stakeholder.businessUnitId) {
      return NextResponse.json({ error: 'Stakeholder must belong to a Business Unit' }, { status: 400 });
    }

    const goal = await prisma.goal.create({
      data: {
        id: randomUUID(),
        title: data.title,
        description: data.description ?? null,
        quarter: data.quarter as any,
        year: data.year,
        stakeholderId,
        businessUnitId: stakeholder.businessUnitId,
        progressNotes: data.progressNotes ?? null,
        status: data.status,
      },
    });

    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}