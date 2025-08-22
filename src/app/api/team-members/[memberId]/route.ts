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

    const updated = await prisma.teamMember.update({
      where: { id: memberId },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        // allow clearing with null and updating with value; skip if omitted
        ...(data.email !== undefined ? { email: data.email } : {}),
        ...(data.role !== undefined ? { role: data.role } : {}),
      },
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
