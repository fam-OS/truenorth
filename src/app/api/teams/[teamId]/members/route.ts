import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/api-response';

const createMemberSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required').optional().or(z.literal('').transform(() => undefined)),
  role: z.string().min(1, 'Role is required').optional().or(z.literal('').transform(() => undefined)),
});

export async function GET(
  _request: Request,
  { params }: { params: { teamId: string } }
) {
  try {
    const { teamId } = await params;
    const members = await prisma.teamMember.findMany({
      where: { teamId },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(members);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: { teamId: string } }
) {
  try {
    const { teamId } = await params;
    const json = await request.json();
    const data = createMemberSchema.parse(json);

    const memberData: any = {
      name: data.name,
      teamId,
    };
    
    if (data.email) memberData.email = data.email;
    if (data.role) memberData.role = data.role;
    
    const member = await prisma.teamMember.create({
      data: memberData,
    });

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.issues }, { status: 400 });
    }
    return handleError(error);
  }
}
