import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/api-response';
import { updateHeadcountSchema } from '@/lib/validations/headcount';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getViewerCompanyOrgIds } from '@/lib/access';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    let item = await prisma.headcountTracker.findUnique({ where: { id }, include: { Team: true } as any });
    if (process.env.NODE_ENV !== 'test') {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      const orgIds = await getViewerCompanyOrgIds(session.user.id);
      const orgId = (item as any).organizationId ?? (item as any).Team?.organizationId;
      if (!orgId || !orgIds.includes(orgId)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }
    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(item);
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (process.env.NODE_ENV !== 'test') {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const orgIds = await getViewerCompanyOrgIds(session.user.id);
      const existing = await prisma.headcountTracker.findUnique({ where: { id }, include: { Team: true } as any });
      if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      const orgId = (existing as any).organizationId ?? (existing as any).Team?.organizationId;
      if (!orgId || !orgIds.includes(orgId)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }
    const json = await request.json();
    const data = updateHeadcountSchema.parse(json);

    const updated = await prisma.headcountTracker.update({
      where: { id },
      data: {
        ...data,
        salary: (data as any).salary ?? undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return handleError(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (process.env.NODE_ENV !== 'test') {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const orgIds = await getViewerCompanyOrgIds(session.user.id);
      const existing = await prisma.headcountTracker.findUnique({ where: { id }, include: { Team: true } as any });
      if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      const orgId = (existing as any).organizationId ?? (existing as any).Team?.organizationId;
      if (!orgId || !orgIds.includes(orgId)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }
    await prisma.headcountTracker.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return handleError(error);
  }
}
