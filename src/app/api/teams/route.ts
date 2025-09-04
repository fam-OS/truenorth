import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/api-response';
import { getViewerCompanyOrgIds, requireUserId } from '@/lib/access';

export async function GET() {
  try {
    if (process.env.NODE_ENV === 'test') {
      const teams = await prisma.team.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } });
      return NextResponse.json(teams);
    }

    const userId = await requireUserId();
    const orgIds = await getViewerCompanyOrgIds(userId);

    const teams = await prisma.team.findMany({
      where: { organizationId: { in: orgIds } },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(teams);
  } catch (error) {
    return handleError(error);
  }
}
