import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  return session;
}

export async function requireUserId(): Promise<string> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  return session.user.id;
}

export async function getViewerCompanyOrgIds(userId: string): Promise<string[]> {
  const companyAccount = await prisma.companyAccount.findFirst({
    where: { userId },
    select: { id: true },
  });
  if (!companyAccount) return [];

  const orgs = await prisma.organization.findMany({
    where: { companyAccountId: companyAccount.id },
    select: { id: true },
  });
  return orgs.map(o => o.id);
}

export async function assertBusinessUnitAccess(userId: string, businessUnitId: string): Promise<void> {
  const orgIds = await getViewerCompanyOrgIds(userId);
  if (orgIds.length === 0) throw new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });

  const teamUsingBU = await prisma.team.findFirst({
    where: {
      businessUnitId: businessUnitId,
      organizationId: { in: orgIds },
    },
    select: { id: true },
  });
  if (!teamUsingBU) {
    throw new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }
}

export async function assertTeamAccess(userId: string, teamId: string): Promise<void> {
  const orgIds = await getViewerCompanyOrgIds(userId);
  if (orgIds.length === 0) throw new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  const team = await prisma.team.findUnique({ where: { id: teamId }, select: { organizationId: true } });
  if (!team) throw new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  if (!orgIds.includes(team.organizationId)) {
    throw new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }
}

export async function assertOpsReviewAccess(userId: string, opsReviewId: string): Promise<void> {
  const orgIds = await getViewerCompanyOrgIds(userId);
  if (orgIds.length === 0) throw new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  const review = await prisma.opsReview.findUnique({
    where: { id: opsReviewId },
    include: { Team: true } as any,
  });
  if (!review) throw new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  const orgId = (review as any).Team?.organizationId as string | undefined;
  if (!orgId || !orgIds.includes(orgId)) {
    throw new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }
}
