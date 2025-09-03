import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/api-response';
import { z } from 'zod';

// New contract: Stakeholder is a link to a TeamMember plus optional business unit.
const createStakeholderSchema = z.object({
  teamMemberId: z.string().min(1, 'teamMemberId is required'),
  businessUnitId: z.string().optional().nullable(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const data = createStakeholderSchema.parse(json);

    // Validate TeamMember exists
    const tm = await prisma.teamMember.findUnique({ where: { id: data.teamMemberId } });
    if (!tm) return NextResponse.json({ error: 'TeamMember not found' }, { status: 404 });

    const stakeholder = await prisma.stakeholder.create({
      data: {
        id: `stakeholder-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        teamMemberId: data.teamMemberId,
        businessUnitId: data.businessUnitId ?? undefined,
        // Deprecated fields are left untouched and will be dropped in later migration
        name: tm.name,
        email: tm.email ?? '',
        role: tm.role ?? '',
      },
      include: { TeamMember: true },
    });

    return NextResponse.json(stakeholder, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

export const GET = async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const unassigned = searchParams.get('unassigned');
    const includeAssigned = searchParams.get('includeAssigned');
    const businessUnitId = searchParams.get('businessUnitId');

    // If includeAssigned=true and a businessUnitId is provided, return all stakeholders
    // EXCEPT those already assigned to the current business unit. This allows moving stakeholders
    // from other units or linking unassigned ones.
    if (includeAssigned === 'true' && businessUnitId) {
      const stakeholders = await prisma.stakeholder.findMany({
        where: {
          OR: [
            { businessUnitId: null },
            { NOT: { businessUnitId } },
          ],
        },
        include: { TeamMember: true },
        orderBy: { name: 'asc' },
      });
      return NextResponse.json(stakeholders);
    }

    // Legacy behavior: only unassigned when explicitly requested
    if (unassigned === 'true') {
      const stakeholders = await prisma.stakeholder.findMany({
        where: { businessUnitId: null },
        include: { TeamMember: true },
        orderBy: { name: 'asc' },
      });
      return NextResponse.json(stakeholders);
    }

    // Default: return all
    const stakeholders = await prisma.stakeholder.findMany({ include: { TeamMember: true }, orderBy: { name: 'asc' } });
    return NextResponse.json(stakeholders);
  } catch (error) {
    return handleError(error);
  }
};
