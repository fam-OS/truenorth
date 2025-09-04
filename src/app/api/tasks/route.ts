import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { createTaskSchema } from '@/lib/validations/task';
import { handleError } from '@/lib/api-response';

export async function GET() {
  try {
    const tasks = await prisma.task.findMany({
      include: { notes: true } as any,
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
        id: randomUUID(),
        title: data.title,
        description: data.description || null,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        status: data.status,
      },
      include: { notes: true } as any,
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Task creation error:', error);
    return handleError(error);
  }
}