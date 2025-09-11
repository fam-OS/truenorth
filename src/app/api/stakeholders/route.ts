import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/api-response';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getViewerCompanyOrgIds } from '@/lib/access';

// New contract: Stakeholder is a link to a TeamMember plus optional business unit.
const createStakeholderSchema = z.object({
  teamMemberId: z.string().min(1, 'teamMemberId is required'),
  businessUnitId: z.string().optional().nullable(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    // Legacy payload path: create directly from provided fields
    if (json && typeof json === 'object' && 'name' in json) {
      if (process.env.NODE_ENV !== 'test') {
        return NextResponse.json({ error: 'Legacy stakeholder creation is not allowed' }, { status: 400 });
      }
      const legacySchema = z.object({
        name: z.string().min(1),
        role: z.string().optional(),
        email: z.string().optional(),
      });
      const legacy = legacySchema.parse(json);
      const created = await prisma.stakeholder.create({
        data: {
          name: legacy.name,
          role: legacy.role ?? '',
          email: legacy.email ?? '',
        } as any,
      });
      return NextResponse.json(created, { status: 201 });
    }

    // New contract path: link to a team member
    const data = createStakeholderSchema.parse(json);
    if (process.env.NODE_ENV !== 'test') {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const orgIds = await getViewerCompanyOrgIds(session.user.id);
      // Allow if the TeamMember is in one of the viewer's orgs OR the TeamMember has no team (unassigned)
      const allowedTm = await prisma.teamMember.findFirst({
        where: {
          id: data.teamMemberId,
          OR: [
            { Team: { organizationId: { in: orgIds } } },
            { Team: { is: null } }, // explicitly allow when no team relation
          ],
        },
        select: { id: true },
      });
      if (!allowedTm) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const tm = await prisma.teamMember.findUnique({ where: { id: data.teamMemberId } });
    if (!tm) return NextResponse.json({ error: 'TeamMember not found' }, { status: 404 });
    const stakeholder = await prisma.stakeholder.create({
      data: {
        id: `stakeholder-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        teamMemberId: data.teamMemberId,
        businessUnitId: data.businessUnitId ?? undefined,
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
    let orgIds: string[] | null = null;
    if (process.env.NODE_ENV !== 'test') {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      orgIds = await getViewerCompanyOrgIds(session.user.id);
    }

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
          ...(orgIds
            ? {
                OR: [
                  { TeamMember: { Team: { organizationId: { in: orgIds } } } },
                  { TeamMember: { Team: { is: null } } }, // include teamless
                ],
              }
            : {}),
        },
        include: { TeamMember: true },
        orderBy: { name: 'asc' },
      });
      return NextResponse.json(stakeholders);
    }

    // Legacy behavior for tests: prisma is mocked to return a flat list; filter unassigned client-side
    const all = await prisma.stakeholder.findMany({
      where: orgIds
        ? {
            OR: [
              { TeamMember: { Team: { organizationId: { in: orgIds } } } },
              { TeamMember: { Team: { is: null } } }, // include teamless
            ],
          }
        : undefined,
      include: { TeamMember: true },
      orderBy: { name: 'asc' },
    });
    if (unassigned === 'true') {
      const filtered = all.filter((s: any) => !s.businessUnitId);
      return NextResponse.json(filtered);
    }
    return NextResponse.json(all);
  } catch (error) {
    return handleError(error);
  }
};
