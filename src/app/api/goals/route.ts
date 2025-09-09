import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUserId, getViewerCompanyOrgIds } from '@/lib/access';

export async function GET(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') ?? '';
    const recentDays = parseInt(searchParams.get('recentDays') || '30', 10);
    const limit = parseInt(searchParams.get('limit') || '5', 10);

    const since = new Date(Date.now() - recentDays * 24 * 60 * 60 * 1000);

    // Determine which Business Units the viewer can access based on their organizations
    const orgIds = await getViewerCompanyOrgIds(userId);
    if (!orgIds || orgIds.length === 0) {
      return NextResponse.json([]);
    }

    const [teams, inits] = await Promise.all([
      prisma.team.findMany({
        where: { organizationId: { in: orgIds }, businessUnitId: { not: null } },
        select: { businessUnitId: true },
      }),
      prisma.initiative.findMany({
        where: { organizationId: { in: orgIds }, businessUnitId: { not: null } },
        select: { businessUnitId: true },
      }),
    ]);
    const buSet = new Set<string>();
    for (const t of teams) if ((t as any).businessUnitId) buSet.add((t as any).businessUnitId);
    for (const i of inits) if ((i as any).businessUnitId) buSet.add((i as any).businessUnitId);
    const accessibleBUIds = Array.from(buSet);
    if (accessibleBUIds.length === 0) {
      return NextResponse.json([]);
    }

    // First try: recently created or updated within window
    const recent = await prisma.goal.findMany({
      where: {
        businessUnitId: { in: accessibleBUIds },
        OR: [
          { createdAt: { gte: since } },
          { updatedAt: { gte: since } },
        ],
        ...(q
          ? {
              OR: [
                { title: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      select: {
        id: true,
        title: true,
        quarter: true,
        year: true,
        updatedAt: true,
      },
    });

    if (recent.length > 0) {
      return NextResponse.json(recent);
    }

    // Fallback: latest N regardless of date
    const fallback = await prisma.goal.findMany({
      where: q
        ? {
            businessUnitId: { in: accessibleBUIds },
            OR: [
              { title: { contains: q, mode: 'insensitive' } },
              { description: { contains: q, mode: 'insensitive' } },
            ],
          }
        : { businessUnitId: { in: accessibleBUIds } },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      select: {
        id: true,
        title: true,
        quarter: true,
        year: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(fallback);
  } catch (error) {
    console.error('GET /api/goals error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
