import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createTaskSchema } from '@/lib/validations/task';
import { handleError } from '@/lib/api-response';

export async function GET() {
  try {
    const tasks = await prisma.task.findMany({
      include: {
        notes: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const data = createTaskSchema.parse(json);

    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description || null,
        dueDate: data.dueDate,
        status: data.status,
      },
      include: {
        notes: true,
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Task creation error:', error);
    return handleError(error);
  }
}