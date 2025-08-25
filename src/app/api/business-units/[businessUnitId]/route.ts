import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/api-response';

const updateBusinessUnitSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().nullable(),
});

export async function PUT(
  request: Request,
  { params }: { params: { businessUnitId: string } }
) {
  try {
    // Destructure params at the beginning of the function
    const { businessUnitId } = await params;
    const body = await request.json();
    const validatedData = updateBusinessUnitSchema.parse(body);

    const businessUnit = await prisma.businessUnit.update({
      where: { id: businessUnitId },
      data: {
        name: validatedData.name,
        description: validatedData.description,
      },
      include: {
        organization: true,
        stakeholders: true,
        metrics: true,

      },
    });

    return NextResponse.json(businessUnit);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.issues }, { status: 400 });
    }

    console.error('Failed to update business unit:', error);
    return handleError(error);
  }
}

export async function GET(
  _request: Request,
  { params }: { params: { businessUnitId: string } }
) {
  try {
    // Destructure params at the beginning of the function
    const { businessUnitId } = await params;
    const businessUnit = await prisma.businessUnit.findUnique({
      where: { id: businessUnitId },
      include: {
        organization: true,
        stakeholders: true,
        metrics: true,

      },
    });

    if (!businessUnit) {
      return NextResponse.json({ error: 'Business unit not found' }, { status: 404 });
    }

    return NextResponse.json(businessUnit);
  } catch (error) {
    console.error('Failed to fetch business unit:', error);
    return handleError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { businessUnitId: string } }
) {
  try {
    // Destructure params at the beginning of the function
    const { businessUnitId } = await params;
    await prisma.businessUnit.delete({
      where: { id: businessUnitId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete business unit:', error);
    return handleError(error);
  }
}