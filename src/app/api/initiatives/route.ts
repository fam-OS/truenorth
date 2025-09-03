import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/api-response';
import { createInitiativeSchema } from '@/lib/validations/initiative';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId') || undefined;
    const ownerId = searchParams.get('ownerId') || undefined;
    const businessUnitId = searchParams.get('businessUnitId') || undefined;

    const initiatives = await prisma.initiative.findMany({
      select: {
        id: true,
        name: true,
        organizationId: true,
        ownerId: true,
        businessUnitId: true,
        createdAt: true,
        updatedAt: true,
      },
      where: {
        organizationId: orgId,
        ownerId: ownerId,
        businessUnitId: businessUnitId,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(initiatives);
  } catch (error) {
    console.error('Error fetching initiatives:', error);
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const data = createInitiativeSchema.parse(json);

    // Allow defaulting organization from URL if not passed in body
    const { searchParams } = new URL(request.url);
    const orgIdFromUrl = searchParams.get('orgId') || undefined;

    const { organizationId, ownerId, businessUnitId, ...rest } = data as any;
    const createData: any = { ...rest };
    const finalOrgId = organizationId || orgIdFromUrl;
    if (!finalOrgId) {
      return NextResponse.json({ error: 'organizationId is required' }, { status: 400 });
    }
    // Ensure organization exists to avoid nested connect failures
    const org = await prisma.organization.findUnique({ where: { id: finalOrgId } });
    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 400 });
    }
    createData.Organization = { connect: { id: finalOrgId } };
    if (ownerId !== undefined) {
      createData.TeamMember = ownerId ? { connect: { id: ownerId } } : undefined;
    }
    if (businessUnitId !== undefined) {
      createData.BusinessUnit = businessUnitId ? { connect: { id: businessUnitId } } : undefined;
    }

    const initiative = await prisma.initiative.create({
      data: { id: crypto.randomUUID(), ...createData },
      include: { Organization: true, TeamMember: true },
    });

    return NextResponse.json(initiative, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
