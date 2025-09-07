import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/api-response';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getViewerCompanyOrgIds } from '@/lib/access';

const updateTeamSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().nullable(),
  organizationId: z.string().min(1, 'Organization is required').optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;
    if (process.env.NODE_ENV !== 'test') {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const orgIds = await getViewerCompanyOrgIds(session.user.id);
      const allowed = await prisma.team.findFirst({ where: { id: teamId, organizationId: { in: orgIds } }, select: { id: true } });
      if (!allowed) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        Organization: { select: { id: true, name: true } },
        TeamMember: { select: { id: true, name: true, email: true, role: true } },
      },
    });
    if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 });

    // Transform to the shape expected by the Team page
    const response = {
      id: team.id,
      name: team.name,
      description: team.description ?? null,
      organizationId: team.organizationId,
      organization: team.Organization ? { id: team.Organization.id, name: team.Organization.name } : null,
      members: (team.TeamMember ?? []).map((m) => ({
        id: m.id,
        name: m.name,
        email: m.email || '',
        role: m.role || 'Member',
      })),
    };
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching team:', error);
    return handleError(error);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;
    if (process.env.NODE_ENV !== 'test') {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const orgIds = await getViewerCompanyOrgIds(session.user.id);
      const allowed = await prisma.team.findFirst({ where: { id: teamId, organizationId: { in: orgIds } }, select: { id: true } });
      if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const json = await request.json();
    console.log('Team update request data:', json);
    const data = updateTeamSchema.parse(json);
    const updated = await prisma.team.update({
      where: { id: teamId },
      data: { 
        name: data.name, 
        description: data.description ?? undefined,
        ...(data.organizationId && { organizationId: data.organizationId }),
      },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Team update error:', error);
    if (error instanceof z.ZodError) {
      console.log('Validation errors:', error.issues);
      return NextResponse.json({ error: 'Invalid request data', details: error.issues }, { status: 400 });
    }
    return handleError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;
    if (process.env.NODE_ENV !== 'test') {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const orgIds = await getViewerCompanyOrgIds(session.user.id);
      const allowed = await prisma.team.findFirst({ where: { id: teamId, organizationId: { in: orgIds } }, select: { id: true } });
      if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    await prisma.team.delete({ where: { id: teamId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
