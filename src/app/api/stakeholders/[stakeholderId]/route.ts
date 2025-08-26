import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/api-response';
import { z } from 'zod';

const updateStakeholderSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  role: z.string().min(1, 'Role is required').optional(),
  email: z.string().email('Valid email is required').optional().or(z.literal('').transform(() => undefined)),
  reportsToId: z.string().cuid().nullable().optional(),
});

export async function GET(_request: Request, { params }: { params: { stakeholderId: string } }) {
  try {
    const { stakeholderId } = await params;
    const stakeholder = await prisma.stakeholder.findUnique({ where: { id: stakeholderId } });
    if (!stakeholder) return NextResponse.json({ error: 'Stakeholder not found' }, { status: 404 });
    return NextResponse.json(stakeholder);
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(request: Request, { params }: { params: { stakeholderId: string } }) {
  try {
    const { stakeholderId } = await params;
    const body = await request.json();
    const data = updateStakeholderSchema.parse(body);

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.reportsToId !== undefined) updateData.reportsToId = data.reportsToId;

    const updated = await prisma.stakeholder.update({ where: { id: stakeholderId }, data: updateData });
    return NextResponse.json(updated);
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Stakeholder not found' }, { status: 404 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.issues }, { status: 400 });
    }
    return handleError(error);
  }
}
