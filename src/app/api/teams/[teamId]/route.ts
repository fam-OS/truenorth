import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/api-response';

const updateTeamSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().nullable(),
  organizationId: z.string().min(1, 'Organization is required'),
});

export async function GET(
  _request: Request,
  { params }: { params: { teamId: string } }
) {
  try {
    const { teamId } = await params;
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { organization: true, members: true },
    });
    if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    return NextResponse.json(team);
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { teamId: string } }
) {
  try {
    const { teamId } = await params;
    const json = await request.json();
    const data = updateTeamSchema.parse(json);
    const updated = await prisma.team.update({
      where: { id: teamId },
      data: { 
        name: data.name, 
        description: data.description ?? undefined,
        organizationId: data.organizationId,
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
  { params }: { params: { teamId: string } }
) {
  try {
    const { teamId } = await params;
    await prisma.team.delete({ where: { id: teamId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
