import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Get all team members with their user data
    const teamMembers = await prisma.teamMember.findMany({
      where: { isActive: true },
      include: {
        team: {
          select: {
            name: true,
            organization: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Format the response to match expected structure
    const formattedMembers = teamMembers.map(member => ({
      id: member.id,
      name: member.name,
      email: member.email,
      role: member.role,
      teamId: member.teamId,
      team: {
        name: member.team.name,
        organization: member.team.organization
      }
    }));

    return NextResponse.json(formattedMembers);
  } catch (error) {
    console.error('Error fetching team members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team members' },
      { status: 500 }
    );
  }
}
