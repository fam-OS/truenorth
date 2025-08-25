import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/api-response';
import { z } from 'zod';

export async function DELETE(
  _request: Request,
  { params }: { params: { organizationId: string; businessUnitId: string } }
) {
  try {
    // Destructure params at the beginning of the function
    const { businessUnitId } = await params;
    
    await prisma.businessUnit.delete({
      where: { id: businessUnitId },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}

// Simple update schema for editing a business unit
const updateBusinessUnitSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: { organizationId: string; businessUnitId: string } }
) {
  try {
    const { businessUnitId } = await params;
    const json = await request.json();
    const data = updateBusinessUnitSchema.parse(json);

    const updated = await prisma.businessUnit.update({
      where: { id: businessUnitId },
      data: {
        name: data.name,
        description: data.description,
      },
      include: {
        stakeholders: true,
        metrics: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return handleError(error);
  }
}
