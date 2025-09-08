import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/api-response';
import { createInitiativeSchema } from '@/lib/validations/initiative';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getViewerCompanyOrgIds } from '@/lib/access';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId') || undefined;
    const ownerId = searchParams.get('ownerId') || undefined;
    const businessUnitId = searchParams.get('businessUnitId') || undefined;

    let orgIdsFilter: string[] | undefined = undefined;
    if (process.env.NODE_ENV !== 'test') {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const orgIds = await getViewerCompanyOrgIds(session.user.id);
      // If orgId filter is provided, ensure it belongs to the viewer
      if (orgId && !orgIds.includes(orgId)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      if (!orgId) {
        orgIdsFilter = orgIds;
      }
    }

    const initiatives = await prisma.initiative.findMany({
      select: {
        id: true,
        name: true,
        organizationId: true,
        ownerId: true,
        businessUnitId: true,
        releaseDate: true,
        summary: true,
        type: true,
        status: true,
        atRisk: true,
        createdAt: true,
        updatedAt: true,
      },
      where: {
        organizationId: orgIdsFilter ? { in: orgIdsFilter } : (orgId as any),
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
    console.debug('[Initiatives][POST] Raw body:', json);
    const data = createInitiativeSchema.parse(json);
    console.debug('[Initiatives][POST] Parsed data:', data);

    // Allow defaulting organization from URL if not passed in body
    const { searchParams } = new URL(request.url);
    const orgIdFromUrl = searchParams.get('orgId') || undefined;
    console.debug('[Initiatives][POST] orgIdFromUrl:', orgIdFromUrl);

    const { organizationId, ownerId, businessUnitId, ...rest } = data as any;
    const createData: any = { ...rest };
    const finalOrgId = organizationId || orgIdFromUrl;
    if (!finalOrgId) {
      return NextResponse.json({ error: 'organizationId is required' }, { status: 400 });
    }
    if (process.env.NODE_ENV !== 'test') {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const orgIds = await getViewerCompanyOrgIds(session.user.id);
      if (!orgIds.includes(finalOrgId)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
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

    console.debug('[Initiatives][POST] Final createData:', createData);

    let initiative;
    try {
      initiative = await prisma.initiative.create({
        data: { id: crypto.randomUUID(), ...createData },
        include: { Organization: true, TeamMember: true },
      });
    } catch (err: any) {
      console.error('[Initiatives][POST] Prisma create error:', {
        message: err?.message,
        code: err?.code,
        meta: err?.meta,
        stack: err?.stack,
      });
      throw err; // handled by outer catch + handleError
    }

    return NextResponse.json(initiative, { status: 201 });
  } catch (error: any) {
    console.error('[Initiatives][POST] Unhandled error:', {
      message: error?.message,
      code: (error as any)?.code,
      meta: (error as any)?.meta,
      stack: error?.stack,
    });
    return handleError(error);
  }
}
