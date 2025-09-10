import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { assertTeamAccess, requireUserId } from '@/lib/access';
import { handleError } from '@/lib/api-response';

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional().or(z.literal('').transform(() => null)).or(z.null()),
  role: z.string().optional().or(z.literal('').transform(() => null)).or(z.null()),
  teamId: z.string().nullable().optional(),
  reportsToId: z.string().nullable().optional(),
  oneOnOneNotes: z.string().optional().or(z.literal('').transform(() => null)).or(z.null()),
  lastOneOnOneAt: z.string().optional().or(z.literal('').transform(() => null)).or(z.null()),
  goalsNotes: z.string().optional().or(z.literal('').transform(() => null)).or(z.null()),
  personalNotes: z.string().optional().or(z.literal('').transform(() => null)).or(z.null()),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (process.env.NODE_ENV !== 'test') {
      await requireUserId();
    }
    const { id } = await params;
    const member = await prisma.teamMember.findUnique({
      where: { id },
    });
    if (!member) return NextResponse.json({ error: 'Team member not found' }, { status: 404 });
    return NextResponse.json(member);
  } catch (e) {
    return handleError(e);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = process.env.NODE_ENV !== 'test' ? await requireUserId() : 'test-user';
    const { id } = await params;
    const body = await req.json();
    const parsed = updateSchema.parse(body);
    // Extra safety: coerce any lingering empty strings to null
    if (parsed.email === '') (parsed as any).email = null;
    if (parsed.role === '') (parsed as any).role = null;

    // Access check if assigning to a team
    if (typeof parsed.teamId === 'string' && parsed.teamId && process.env.NODE_ENV !== 'test') {
      await assertTeamAccess(userId, parsed.teamId);
    }

    // If reportsToId equals self, null it
    if (parsed.reportsToId === id) parsed.reportsToId = null;

    const teamOp = ((): any => {
      if (parsed.teamId === null) return { Team: { disconnect: true } };
      if (typeof parsed.teamId === 'string' && parsed.teamId.length > 0) return { Team: { connect: { id: parsed.teamId } } };
      return {};
    })();

    const managerOp = ((): any => {
      if (parsed.reportsToId === null) return { TeamMember: { disconnect: true } };
      if (typeof parsed.reportsToId === 'string' && parsed.reportsToId.length > 0) return { TeamMember: { connect: { id: parsed.reportsToId } } };
      return {};
    })();

    const updated = await prisma.teamMember.update({
      where: { id },
      data: ({
        ...(parsed.name !== undefined ? { name: parsed.name } : {}),
        ...(parsed.email !== undefined ? { email: parsed.email } : {}),
        ...(parsed.role !== undefined ? { role: parsed.role } : {}),
        ...(parsed.oneOnOneNotes !== undefined ? { oneOnOneNotes: parsed.oneOnOneNotes } : {}),
        ...(parsed.lastOneOnOneAt !== undefined ? { lastOneOnOneAt: parsed.lastOneOnOneAt ? new Date(parsed.lastOneOnOneAt) : null } : {}),
        ...(parsed.goalsNotes !== undefined ? { goalsNotes: parsed.goalsNotes } : {}),
        ...(parsed.personalNotes !== undefined ? { personalNotes: parsed.personalNotes } : {}),
        ...teamOp,
        ...managerOp,
      } as any),
    });

    return NextResponse.json(updated);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: e.issues }, { status: 400 });
    }
    return handleError(e);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (process.env.NODE_ENV !== 'test') {
      await requireUserId();
    }
    const { id } = await params;
    await prisma.teamMember.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
