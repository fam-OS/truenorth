import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { apiResponse } from '@/lib/api-response';

const updateBusinessUnitSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().nullable(),
});

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = updateBusinessUnitSchema.parse(body);

    const businessUnit = await prisma.businessUnit.update({
      where: { id: params.id },
      data: {
        name: validatedData.name,
        description: validatedData.description,
      },
      include: {
        organization: true,
        stakeholders: true,
        metrics: true,
        goals: true,
      },
    });

    return apiResponse(businessUnit);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiResponse(null, 400, 'Invalid request data', error.errors);
    }

    console.error('Failed to update business unit:', error);
    return apiResponse(null, 500, 'Failed to update business unit');
  }
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const businessUnit = await prisma.businessUnit.findUnique({
      where: { id: params.id },
      include: {
        organization: true,
        stakeholders: true,
        metrics: true,
        goals: true,
      },
    });

    if (!businessUnit) {
      return apiResponse(null, 404, 'Business unit not found');
    }

    return apiResponse(businessUnit);
  } catch (error) {
    console.error('Failed to fetch business unit:', error);
    return apiResponse(null, 500, 'Failed to fetch business unit');
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.businessUnit.delete({
      where: { id: params.id },
    });

    return apiResponse({ success: true });
  } catch (error) {
    console.error('Failed to delete business unit:', error);
    return apiResponse(null, 500, 'Failed to delete business unit');
  }
}