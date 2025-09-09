import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { toCSV } from '@/lib/csv';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getViewerCompanyOrgIds } from '@/lib/access';

// Export Initiatives the viewer can see. Supports orgId/ownerId/businessUnitId filters.
// format=csv (default) or format=json
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const format = (searchParams.get('format') || 'csv').toLowerCase();
    const orgId = searchParams.get('orgId') || undefined;
    const ownerId = searchParams.get('ownerId') || undefined;
    const businessUnitId = searchParams.get('businessUnitId') || undefined;

    let orgIdsFilter: string[] | undefined = undefined;
    if (process.env.NODE_ENV !== 'test') {
      const session = await getServerSession(authOptions as any);
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

    const rows = initiatives.map((i) => ({
      id: i.id,
      name: i.name,
      organizationId: i.organizationId,
      ownerId: i.ownerId ?? '',
      businessUnitId: i.businessUnitId ?? '',
      releaseDate: i.releaseDate ? new Date(i.releaseDate as any).toISOString() : '',
      status: i.status ?? '',
      atRisk: i.atRisk ? 'true' : 'false',
      summary: i.summary ?? '',
      type: i.type ?? '',
      createdAt: (i as any).createdAt?.toISOString?.() ?? (i as any).createdAt,
      updatedAt: (i as any).updatedAt?.toISOString?.() ?? (i as any).updatedAt,
    }));

    if (format === 'json') {
      return NextResponse.json(rows);
    }

    const csv = toCSV(rows, {
      headers: [
        'id',
        'name',
        'organizationId',
        'ownerId',
        'businessUnitId',
        'releaseDate',
        'status',
        'atRisk',
        'summary',
        'type',
        'createdAt',
        'updatedAt',
      ],
    });

    return new NextResponse(csv, {
      status: 200,
      headers: new Headers({
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="initiatives.csv"',
        'Cache-Control': 'no-store',
      }),
    });
  } catch (error) {
    console.error('[Reports][initiatives] error:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
