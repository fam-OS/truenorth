import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { toCSV } from '@/lib/csv';
import { getViewerCompanyOrgIds, requireUserId } from '@/lib/access';

// Export Business Units the viewer can see, mirroring /api/business-units scoping
// Supports CSV (default) and JSON with ?format=json
export async function GET(request: Request) {
  try {
    const userId = await requireUserId();
    const orgIds = await getViewerCompanyOrgIds(userId);

    const url = new URL(request.url);
    const format = (url.searchParams.get('format') || 'csv').toLowerCase();

    const businessUnitsRaw = await prisma.businessUnit.findMany({
      where: {
        OR: [
          { Team: { some: { organizationId: { in: orgIds } } } },
          { Stakeholder: { some: { TeamMember: { Team: { organizationId: { in: orgIds } } } } } },
          { Kpi: { some: { Organization: { id: { in: orgIds } } } } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        Stakeholder: true,
        Goal: true,
        Metric: true,
        Team: { include: { Organization: true } },
      },
    });

    const rows = businessUnitsRaw.map((bu: any) => {
      const org = bu.Team?.[0]?.Organization || null;
      return {
        id: bu.id,
        name: bu.name,
        description: bu.description ?? '',
        organizationId: org?.id ?? '',
        organizationName: org?.name ?? '',
        stakeholdersCount: (bu.Stakeholder ?? []).length,
        goalsCount: (bu.Goal ?? []).length,
        metricsCount: (bu.Metric ?? []).length,
        createdAt: bu.createdAt?.toISOString?.() ?? bu.createdAt,
        updatedAt: bu.updatedAt?.toISOString?.() ?? bu.updatedAt,
      };
    });

    if (format === 'json') {
      return NextResponse.json(rows);
    }

    const csv = toCSV(rows, {
      headers: [
        'id',
        'name',
        'description',
        'organizationId',
        'organizationName',
        'stakeholdersCount',
        'goalsCount',
        'metricsCount',
        'createdAt',
        'updatedAt',
      ],
    });

    return new NextResponse(csv, {
      status: 200,
      headers: new Headers({
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="business-units.csv"',
        'Cache-Control': 'no-store',
      }),
    });
  } catch (error) {
    console.error('[Reports][business-units] error:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
