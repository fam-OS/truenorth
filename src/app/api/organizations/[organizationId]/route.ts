import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/api-response';
import { createOrganizationSchema, updateOrganizationSchema } from '@/lib/validations/organization';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    const { organizationId } = await params;
    const organization = await (prisma as any).organization.findUnique({
      where: { id: organizationId },
      include: {
        Parent: { select: { id: true, name: true } },
      },
    });

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(organization);
  } catch (error) {
    console.error('Error fetching organization:', error);
    return handleError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    // Destructure params at the beginning of the function
    const { organizationId } = await params;
    
    // Delete related entities first to avoid foreign key constraints
    await prisma.$transaction(async (tx) => {
      // Delete business units and their related data
      const businessUnits = await tx.businessUnit.findMany({
        where: {
          Team: { some: { organizationId } },
        },
      });
      
      for (const bu of businessUnits) {
        // Delete stakeholders
        await tx.stakeholder.deleteMany({
          where: { businessUnitId: bu.id }
        });
        
        // Delete metrics
        await tx.metric.deleteMany({
          where: { businessUnitId: bu.id }
        });
      }
      
      // Delete business units
      await tx.businessUnit.deleteMany({
        where: {
          Team: { some: { organizationId } },
        },
      });
      
      // Delete teams and team members
      const teams = await tx.team.findMany({
        where: { organizationId }
      });
      
      for (const team of teams) {
        await tx.teamMember.deleteMany({
          where: { teamId: team.id }
        });
      }
      
      await tx.team.deleteMany({
        where: { organizationId }
      });
      
      // Delete other related entities
      await tx.initiative.deleteMany({
        where: { organizationId }
      });
      
      await tx.kpi.deleteMany({
        where: { organizationId }
      });
      
      await tx.headcountTracker.deleteMany({
        where: { organizationId }
      });
      
      await tx.cost.deleteMany({
        where: { organizationId }
      });
      
      await tx.ceoGoal.deleteMany({
        where: { organizationId }
      });
      
      // Finally delete the organization
      await tx.organization.delete({
        where: { id: organizationId }
      });
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    const { organizationId } = await params;
    const json = await request.json();
    const data = updateOrganizationSchema.parse(json);

    const updateData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== undefined)
    );

    const updated = await prisma.organization.update({
      where: { id: organizationId },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    return handleError(error);
  }
}
