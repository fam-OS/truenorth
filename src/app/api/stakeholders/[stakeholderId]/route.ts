import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/api-response';
import { z } from 'zod';

const updateStakeholderSchema = z.object({
  teamMemberId: z.string().optional(),
  businessUnitId: z.string().nullable().optional(),
  reportsToId: z.string().nullable().optional(),
  // Allow updating display/shadow fields and underlying TeamMember
  name: z.string().min(1).optional(),
  role: z.string().min(1).optional(),
  email: z.preprocess((v) => (v === '' ? null : v), z.string().email().nullable().optional()),
  relationshipNotes: z.string().max(10000).optional(),
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
    console.log('PUT /api/stakeholders/[stakeholderId] incoming body', { stakeholderId, body });
    const data = updateStakeholderSchema.parse(body);
    console.log('PUT /api/stakeholders/[stakeholderId] parsed data', { stakeholderId, data });

    // Load existing to know associated TeamMember
    const existing = await prisma.stakeholder.findUnique({ where: { id: stakeholderId } });
    if (!existing) {
      return NextResponse.json({ error: 'Stakeholder not found' }, { status: 404 });
    }

    const stakeholderUpdate: any = {};
    if (data.teamMemberId !== undefined) stakeholderUpdate.teamMemberId = data.teamMemberId;
    if (data.businessUnitId !== undefined) stakeholderUpdate.businessUnitId = data.businessUnitId;
    if (data.reportsToId !== undefined) stakeholderUpdate.reportsToId = data.reportsToId;
    if (data.name !== undefined) stakeholderUpdate.name = data.name;
    if (data.role !== undefined) stakeholderUpdate.role = data.role as any;
    if (data.email !== undefined) stakeholderUpdate.email = data.email ?? '';
    if (data.relationshipNotes !== undefined) stakeholderUpdate.relationshipNotes = data.relationshipNotes;

    // Determine which TeamMember to update
    const teamMemberId = data.teamMemberId ?? existing.teamMemberId;

    await prisma.$transaction(async (tx) => {
      // Update Stakeholder shadow + relations
      await tx.stakeholder.update({ where: { id: stakeholderId }, data: stakeholderUpdate });
      // Update TeamMember core profile if name/role/email provided
      if (teamMemberId && (data.name !== undefined || data.role !== undefined || data.email !== undefined)) {
        const tmUpdate: any = {};
        if (data.name !== undefined) tmUpdate.name = data.name;
        if (data.role !== undefined) tmUpdate.role = data.role as any;
        if (data.email !== undefined) tmUpdate.email = data.email ?? null;
        if (Object.keys(tmUpdate).length > 0) {
          await tx.teamMember.update({ where: { id: teamMemberId }, data: tmUpdate });
        }
      }
    });

    const updated = await prisma.stakeholder.findUnique({ where: { id: stakeholderId }, include: { TeamMember: true } });
    return NextResponse.json(updated);
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Stakeholder not found' }, { status: 404 });
    }
    if (error instanceof z.ZodError) {
      console.error('PUT /api/stakeholders/[stakeholderId] Zod validation error', error.issues);
      return NextResponse.json({ error: 'Invalid request data', details: error.issues }, { status: 400 });
    }
    return handleError(error);
  }
}
