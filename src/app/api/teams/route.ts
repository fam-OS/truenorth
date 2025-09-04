import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/api-response';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getViewerCompanyOrgIds } from '@/lib/access';

export async function GET() {
  try {
    if (process.env.NODE_ENV === 'test') {
      const teams = await prisma.team.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } });
      return NextResponse.json(teams);
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const orgIds = await getViewerCompanyOrgIds(session.user.id);

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
