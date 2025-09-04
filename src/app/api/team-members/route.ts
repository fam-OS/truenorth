import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { assertTeamAccess, getViewerCompanyOrgIds, requireUserId } from '@/lib/access';

export async function GET() {
  try {
    let whereClause: any = {};
    if (process.env.NODE_ENV !== 'test') {
      const userId = await requireUserId().catch(resp => resp as any);
      if (typeof userId !== 'string') return userId;
      const orgIds = await getViewerCompanyOrgIds(userId);
      // Filter by teams within viewer organizations
      whereClause = {
        Team: {
          organizationId: { in: orgIds }
        }
      } as any;
    }

    // Get team members with scoping as applicable
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

    // If no teamId provided, auto-assign to a default "General Team" under the viewer's CompanyAccount orgs
    let targetTeamId = validatedData.teamId;
    if (!targetTeamId) {
      let orgIds = await getViewerCompanyOrgIds(userId);
      if (orgIds.length === 0) {
        // No orgs yet: create a default Organization under the viewer's CompanyAccount
        // First, try to infer companyAccountId from any org membership; otherwise use owned CompanyAccount
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
        const defaultOrg = await prisma.organization.create({
          data: {
            id: `org-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            name: 'General Organization',
            description: 'Auto-created for team member management',
            companyAccountId,
          },
          select: { id: true },
        });
        orgIds = [defaultOrg.id];
      }
      // Try to find an existing General Team in any of the orgs
      let team = await prisma.team.findFirst({
        where: {
          organizationId: { in: orgIds },
          name: 'General Team'
        },
        select: { id: true }
      });
      // If none, create one under the first org
      if (!team) {
        team = await prisma.team.create({
          data: {
            name: 'General Team',
            organizationId: orgIds[0],
          },
          select: { id: true }
        });
      }
      targetTeamId = team.id;
    }

    // In non-test, ensure chosen team belongs to viewer orgs
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
      email: validatedData.email || `${validatedData.name.toLowerCase().replace(/\s+/g, '.')}@company.com`,
      role: validatedData.role,
      isActive: true,
      teamId: targetTeamId,
    };
    
    const teamMember = await prisma.teamMember.create({
      data: teamMemberData,
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
