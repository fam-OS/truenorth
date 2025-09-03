import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/api-response';
import { randomUUID } from 'crypto';

// Accept either an existing member to attach, or data to create a new member
const attachExistingSchema = z.object({
  existingMemberId: z.string().min(1),
});

const createMemberSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z
    .string()
    .email('Valid email is required')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  role: z
    .string()
    .min(1, 'Role is required')
    .optional()
    .or(z.literal('').transform(() => undefined)),
});

const memberUpsertSchema = z.union([attachExistingSchema, createMemberSchema]);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;
    const members = await prisma.teamMember.findMany({
      where: { teamId, isActive: true },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(members);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;
    const json = await request.json();
    const data = memberUpsertSchema.parse(json);

    // Attach an existing active member to this team
    if ('existingMemberId' in data) {
      const updated = await prisma.teamMember.update({
        where: { id: data.existingMemberId },
        data: { teamId, isActive: true },
      });
      return NextResponse.json(updated, { status: 200 });
    }

    // Otherwise, create a new member on this team
    const member = await prisma.teamMember.create({
      data: {
        id: randomUUID(),
        name: data.name,
        email: data.email,
        role: data.role,
        teamId,
        isActive: true,
      },
    });

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.issues }, { status: 400 });
    }
    return handleError(error);
  }
}
