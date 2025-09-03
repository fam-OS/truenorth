import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    // Get all team members with simplified query
    const teamMembers = await prisma.teamMember.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        teamId: true,
        isActive: true,
      },
      where: { isActive: true },
      orderBy: {
        name: 'asc'
      }
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
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      console.log('Team member creation failed: No authenticated user');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('Team member creation request:', body);
    console.log('Authenticated user:', session.user.id);
    
    const validatedData = createTeamMemberSchema.parse(body);
    console.log('Validated data:', validatedData);

    // Generate unique ID for team member
    const teamMemberId = `member-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    
    const teamMemberData: any = {
      id: teamMemberId,
      name: validatedData.name,
      email: validatedData.email || `${validatedData.name.toLowerCase().replace(/\s+/g, '.')}@company.com`,
      role: validatedData.role,
      isActive: true,
    };
    
    if (validatedData.teamId) {
      teamMemberData.teamId = validatedData.teamId;
    }
    
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
