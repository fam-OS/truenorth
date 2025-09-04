import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/api-response';
import { z } from 'zod';

const createStakeholderSchema = z.object({
  teamMemberId: z.string().min(1, 'teamMemberId is required'),
});

const linkExistingSchema = z.object({
  stakeholderId: z.string().min(1, 'Stakeholder ID is required'),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ businessUnitId: string }> }
) {
  try {
    const { businessUnitId } = await params;
    console.log('POST /api/business-units/[businessUnitId]/stakeholders called', { businessUnitId });
    const json = await request.json();
    console.log('Request body:', json);

    // Discriminate between linking existing vs creating new
    const parsedLink = linkExistingSchema.safeParse(json);
    if (parsedLink.success) {
      const { stakeholderId } = parsedLink.data;
      console.log('Link existing stakeholder flow', { stakeholderId, businessUnitId });
      // Ensure stakeholder exists
      const existing = await prisma.stakeholder.findUnique({ where: { id: stakeholderId } });
      if (!existing) {
        console.warn('Stakeholder not found for link', { stakeholderId });
        return NextResponse.json({ error: 'Stakeholder not found' }, { status: 404 });
      }
      const stakeholder = await prisma.stakeholder.update({
        where: { id: stakeholderId },
        data: {
          businessUnitId: businessUnitId,
        },
      });
      console.log('Linked stakeholder to business unit', { stakeholderId, businessUnitId });
      return NextResponse.json(stakeholder, { status: 200 });
    }

    const data = createStakeholderSchema.parse(json);

    // Validate TeamMember exists
    const tm = await prisma.teamMember.findUnique({ where: { id: data.teamMemberId } });
    if (!tm) return NextResponse.json({ error: 'TeamMember not found' }, { status: 404 });

    // Generate unique ID for stakeholder
    const stakeholderId = `stakeholder-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    // Note: Prisma client types may be outdated until `prisma generate` runs.
    // Use scalar FK and cast to any to avoid TS errors temporarily.
    const createData: any = {
      id: stakeholderId,
      businessUnitId: businessUnitId,
      teamMemberId: data.teamMemberId,
      // keep legacy columns populated for now
      name: tm.name,
      email: tm.email ?? '',
      role: tm.role ?? '',
    };
    const stakeholder = await prisma.stakeholder.create({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      data: createData,
    });
    console.log('Created stakeholder', { stakeholderId: stakeholder.id, businessUnitId });
    return NextResponse.json(stakeholder, { status: 201 });
  } catch (error) {
    console.error('Error in stakeholders POST:', error);
    return handleError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ businessUnitId: string }> }
) {
  try {
    const { businessUnitId } = await params;
    console.log('DELETE /api/business-units/[businessUnitId]/stakeholders called', { businessUnitId });
    // Support both JSON body and query string for stakeholderId for flexibility
    const url = new URL(request.url);
    const qsStakeholderId = url.searchParams.get('stakeholderId') ?? undefined;
    const body = await request.json().catch(() => ({}));
    console.log('Request body:', body, 'Query:', { stakeholderId: qsStakeholderId });
    const schema = z.object({ stakeholderId: z.string().min(1).optional() });
    const parsed = schema.safeParse(body);
    const stakeholderId = (parsed.success ? parsed.data.stakeholderId : undefined) ?? qsStakeholderId;
    if (!stakeholderId) {
      return NextResponse.json({ error: 'stakeholderId is required' }, { status: 400 });
    }

    const stakeholder = await prisma.stakeholder.findUnique({ where: { id: stakeholderId } });
    if (!stakeholder) {
      return NextResponse.json({ error: 'Stakeholder not found' }, { status: 404 });
    }
    if (stakeholder.businessUnitId !== businessUnitId) {
      return NextResponse.json({ error: 'Stakeholder does not belong to this business unit' }, { status: 400 });
    }

    await prisma.stakeholder.update({
      where: { id: stakeholderId },
      data: { businessUnitId: null },
    });

    console.log('Unlinked stakeholder from business unit', { stakeholderId, businessUnitId });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.issues }, { status: 400 });
    }
    console.error('Error in stakeholders DELETE:', error);
    return handleError(error);
  }
}
