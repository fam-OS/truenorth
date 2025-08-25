import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/api-response';
import { z } from 'zod';

const createStakeholderSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  role: z.string().min(1, 'Role is required'),
  email: z.string().email('Valid email is required').optional(),
});

const linkExistingSchema = z.object({
  stakeholderId: z.string().min(1, 'Stakeholder ID is required'),
});

export async function POST(
  request: Request,
  { params }: { params: { businessUnitId: string } }
) {
  try {
    const { businessUnitId } = await params;
    const json = await request.json();

    // Discriminate between linking existing vs creating new
    const parsedLink = linkExistingSchema.safeParse(json);
    if (parsedLink.success) {
      const { stakeholderId } = parsedLink.data;
      const stakeholder = await prisma.stakeholder.update({
        where: { id: stakeholderId },
        data: {
          businessUnit: { connect: { id: businessUnitId } },
        },
      });
      return NextResponse.json(stakeholder, { status: 200 });
    }

    const data = createStakeholderSchema.parse(json);
    const stakeholder = await prisma.stakeholder.create({
      data: {
        name: data.name,
        role: data.role,
        email: data.email ?? '',
        businessUnit: { connect: { id: businessUnitId } },
      },
    });

    return NextResponse.json(stakeholder, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
