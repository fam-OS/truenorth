import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createGoalSchema } from '@/lib/validations/organization';
import { handleError } from '@/lib/api-response';

export async function GET(
  request: Request,
  { params }: { params: { stakeholderId: string } }
) {
  try {
    const goals = await prisma.goal.findMany({
      where: {
        stakeholderId: params.stakeholderId,
      },
      orderBy: {
        startDate: 'asc',
      },
    });

    return NextResponse.json(goals);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: { stakeholderId: string } }
) {
  try {
    const json = await request.json();
    const data = createGoalSchema.parse({
      ...json,
      stakeholderId: params.stakeholderId,
    });

    const goal = await prisma.goal.create({
      data,
    });

    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}