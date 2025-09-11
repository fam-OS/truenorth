import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const list = (process.env.ADMIN_EMAILS || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  if (list.length === 0) return false;
  return list.includes(email.toLowerCase());
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Simple admin gate: allow only configured admin emails
    if (!isAdminEmail(session.user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Recent signups (by createdAt desc)
    const recentUsers = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        createdAt: true,
      },
    });

    // Auth provider mix (OAuth vs Email)
    // Count users who have an associated Account record (OAuth) vs those without (Email/password)
    const oauthCount = await prisma.account.count();
    const totalUsers = await prisma.user.count();
    const emailOnlyCount = Math.max(totalUsers - (await prisma.account.findMany({ distinct: ['userId'] })).length, 0);

    // Average time spent in the app (approximation): average active session TTL in minutes
    // Note: NextAuth only stores expires; without createdAt we approximate by now->expires for active sessions
    const now = new Date();
    const activeSessions = await prisma.session.findMany({ where: { expires: { gt: now } }, select: { expires: true } });
    const avgSessionMinutes = activeSessions.length
      ? Math.round(activeSessions.reduce((sum, s) => sum + (s.expires.getTime() - now.getTime()) / 60000, 0) / activeSessions.length)
      : 0;

    // Feature & Support requests
    const featureRequests = await prisma.featureRequest.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { id: true, title: true, category: true, priority: true, status: true, createdAt: true, userId: true },
    });
    const supportRequests = await prisma.supportRequest.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { id: true, subject: true, category: true, priority: true, status: true, createdAt: true, userId: true },
    });

    // Other useful metrics
    const [organizations, teams, initiatives, stakeholders] = await Promise.all([
      prisma.organization.count(),
      prisma.team.count(),
      prisma.initiative.count(),
      prisma.stakeholder.count(),
    ]);

    return NextResponse.json({
      recentUsers,
      totals: {
        users: totalUsers,
        organizations,
        teams,
        initiatives,
        stakeholders,
      },
      auth: {
        oauthCountDistinctUsers: (await prisma.account.findMany({ distinct: ['userId'] })).length,
        oauthAccountRecords: oauthCount,
        emailOnlyCount,
      },
      avgSessionMinutes,
      featureRequests,
      supportRequests,
    });
  } catch (err) {
    console.error('[Admin Metrics] GET error', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
