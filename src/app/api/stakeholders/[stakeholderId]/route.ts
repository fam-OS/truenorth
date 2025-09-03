import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/api-response';
import { z } from 'zod';

const updateStakeholderSchema = z.object({
  teamMemberId: z.string().optional(),
  businessUnitId: z.string().nullable().optional(),
  reportsToId: z.string().cuid().nullable().optional(),
});

export async function GET(_request: Request, { params }: { params: Promise<{ stakeholderId: string }> }) {
  try {
    const { stakeholderId } = await params;
    const stakeholder = await prisma.stakeholder.findUnique({ where: { id: stakeholderId }, include: { TeamMember: true } });
    if (!stakeholder) return NextResponse.json({ error: 'Stakeholder not found' }, { status: 404 });
    return NextResponse.json(stakeholder);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ stakeholderId: string }> }) {
  try {
    const { stakeholderId } = await params;

    // Ensure stakeholder exists
    const existing = await prisma.stakeholder.findUnique({ where: { id: stakeholderId } });
    if (!existing) {
      return NextResponse.json({ error: 'Stakeholder not found' }, { status: 404 });
    }

    // Detach relations that would block deletion
    await prisma.$transaction([
      // Cast as any to satisfy TS when generated types don't expose Nullable field ops for updateMany
      prisma.goal.updateMany({ where: { stakeholderId }, data: { stakeholderId: null } as any }),
      prisma.meeting.deleteMany({ where: { stakeholderId } }),
    ]);

    await prisma.stakeholder.delete({ where: { id: stakeholderId } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ stakeholderId: string }> }) {
  try {
    const { stakeholderId } = await params;
    const body = await request.json();
    const data = updateStakeholderSchema.parse(body);

    const updateData: any = {};
    if (data.teamMemberId !== undefined) updateData.teamMemberId = data.teamMemberId;
    if (data.businessUnitId !== undefined) updateData.businessUnitId = data.businessUnitId;
    if (data.reportsToId !== undefined) updateData.reportsToId = data.reportsToId;

    const updated = await prisma.stakeholder.update({ where: { id: stakeholderId }, data: updateData, include: { TeamMember: true } });
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
