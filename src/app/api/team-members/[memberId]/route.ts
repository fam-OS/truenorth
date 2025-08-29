import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/api-response';

const updateMemberSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  email: z
    .string()
    .email('Valid email is required')
    .optional()
    .or(z.literal('').transform(() => null))
    .or(z.null()),
  role: z
    .string()
    .min(1, 'Role is required')
    .optional()
    .or(z.literal('').transform(() => null))
    .or(z.null()),
  reportsToId: z
    .string()
    .min(1)
    .optional()
    .or(z.literal('').transform(() => null))
    .or(z.null()),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const { memberId } = await params;
    const member = await prisma.teamMember.findUnique({ where: { id: memberId } });
    if (!member) return NextResponse.json({ error: 'Team member not found' }, { status: 404 });
    return NextResponse.json(member);
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const { memberId } = await params;
    const json = await request.json();
    const data = updateMemberSchema.parse(json);

    // Build the update data object with proper typing
    const updateData: { name?: string; email?: string | null; role?: string | null; reportsToId?: string | null } = {};
    
    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email === null ? null : data.email;
    if (data.role !== undefined) updateData.role = data.role === null ? null : data.role;
    if (data.reportsToId !== undefined) updateData.reportsToId = data.reportsToId === null ? null : data.reportsToId;
    
    const updated = await prisma.teamMember.update({
      where: { id: memberId },
      data: updateData
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.issues }, { status: 400 });
    }
    return handleError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const { memberId } = await params;
    await prisma.teamMember.delete({ where: { id: memberId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
