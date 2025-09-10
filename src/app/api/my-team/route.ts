import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUserId } from '@/lib/access';

// Returns direct reports for the current user. Today we resolve "me" to the
// founder TeamMember of the viewer's CompanyAccount (owner). If the viewer
// is not an account owner or no founder is set, we return an empty list.
export async function GET() {
  try {
    const userId = await requireUserId().catch((resp) => resp as any);
    if (typeof userId !== 'string') return userId;

    const company = await prisma.companyAccount.findFirst({
      where: { userId },
      select: { founderId: true },
    });

    const managerId = company?.founderId ?? null;
    if (!managerId) {
      return NextResponse.json([]);
    }

    const reports = await prisma.teamMember.findMany({
      where: { reportsToId: managerId },
      orderBy: { name: 'asc' },
    });

    // Normalize date to ISO string
    const data = reports.map((r: any) => ({
      id: r.id,
      name: r.name,
      role: r.role ?? null,
      lastOneOnOneAt: r.lastOneOnOneAt ? new Date(r.lastOneOnOneAt).toISOString() : null,
    }));

    return NextResponse.json(data);
  } catch (e) {
    console.error('GET /api/my-team error', e);
    return NextResponse.json({ error: 'Failed to load direct reports' }, { status: 500 });
  }
}
