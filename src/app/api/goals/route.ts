import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUserId } from '@/lib/access';

export async function GET(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') ?? '';
    const recentDays = parseInt(searchParams.get('recentDays') || '30', 10);
    const limit = parseInt(searchParams.get('limit') || '5', 10);

    const since = new Date(Date.now() - recentDays * 24 * 60 * 60 * 1000);

    // First try: recently created or updated within window
    const recent = await prisma.goal.findMany({
      where: {
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
            OR: [
              { title: { contains: q, mode: 'insensitive' } },
              { description: { contains: q, mode: 'insensitive' } },
            ],
          }
        : undefined,
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
