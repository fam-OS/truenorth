import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/api-response';
import { createOrganizationSchema } from '@/lib/validations/organization';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    // Destructure params at the beginning of the function
    const { organizationId } = await params;
    await prisma.organization.delete({
      where: { id: organizationId },
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
    const data = createOrganizationSchema.parse(json);

    const updated = await prisma.organization.update({
      where: { id: organizationId },
      data,
      include: {
        businessUnits: {
          include: {
            stakeholders: true,
            metrics: true,
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return handleError(error);
  }
}
