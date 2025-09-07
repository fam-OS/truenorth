import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { assertTeamAccess, getViewerCompanyOrgIds, requireUserId } from '@/lib/access';

export async function GET() {
  try {
    // Scope: all members in the viewer's CompanyAccount, including standalone (teamId = null)
    let whereClause: any = {};
    if (process.env.NODE_ENV !== 'test') {
      const userId = await requireUserId().catch((resp) => resp as any);
      if (typeof userId !== 'string') return userId;

      // Derive viewer companyAccountId via org membership or owned account
      const membershipOrg = await prisma.organization.findFirst({
        where: { User: { some: { id: userId } } },
        select: { companyAccountId: true },
      });
      let companyAccountId: string | null = membershipOrg?.companyAccountId ?? null;
      if (!companyAccountId) {
        const owned = await prisma.companyAccount.findFirst({ where: { userId }, select: { id: true } });
        companyAccountId = owned?.id ?? null;
      }
      if (!companyAccountId) {
        return NextResponse.json([], { status: 200 });
      }

      const orgIds = await getViewerCompanyOrgIds(userId);
      whereClause = {
        companyAccountId,
        OR: [
          { teamId: null },
          { Team: { organizationId: { in: orgIds } } },
        ],
      } as any;
    }

    const teamMembers = await prisma.teamMember.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        teamId: true,
        isActive: true,
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json(teamMembers);
  } catch (error) {
    console.error('Error fetching team members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team members' },
      { status: 500 }
    );
  }
}

const createTeamMemberSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required').optional(),
  role: z.string().min(1, 'Role is required'),
  teamId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();

    const body = await request.json();
    console.log('Team member creation request:', body);
    console.log('Authenticated user:', userId);
    
    const validatedData = createTeamMemberSchema.parse(body);
    console.log('Validated data:', validatedData);

    // Determine viewer's companyAccountId (required field)
    const membershipOrg = await prisma.organization.findFirst({
      where: { User: { some: { id: userId } } },
      select: { companyAccountId: true },
    });
    let companyAccountId: string | null = membershipOrg?.companyAccountId ?? null;
    if (!companyAccountId) {
      const owned = await prisma.companyAccount.findFirst({ where: { userId }, select: { id: true } });
      companyAccountId = owned?.id ?? null;
    }
    if (!companyAccountId) {
      return NextResponse.json({ error: 'No company account found for the current user.' }, { status: 400 });
    }

    // Optional team assignment: if provided, validate access; if not, leave null
    let targetTeamId = validatedData.teamId ?? null;
    if (process.env.NODE_ENV !== 'test' && targetTeamId) {
      try {
        await assertTeamAccess(userId, targetTeamId);
      } catch (resp) {
        return resp as any;
      }
    }

    // Generate unique ID for team member
    const teamMemberId = `member-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    
    const teamMemberData: any = {
      id: teamMemberId,
      name: validatedData.name,
      email: validatedData.email || `${validatedData.name.toLowerCase().replace(/\s+/g, '.') }@company.com`,
      role: validatedData.role,
      isActive: true,
    };
    
    const teamMember = await prisma.teamMember.create({
      data: {
        ...teamMemberData,
        CompanyAccount: { connect: { id: companyAccountId } },
        ...(targetTeamId ? { Team: { connect: { id: targetTeamId } } } : {}),
      },
    });

    console.log('Team member created successfully:', teamMember);
    return NextResponse.json(teamMember, { status: 201 });
  } catch (error) {
    console.error('Error creating team member:', error);
    
    if (error instanceof z.ZodError) {
      console.log('Validation errors:', error.issues);
      return NextResponse.json(
        { error: 'Invalid input data', details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
