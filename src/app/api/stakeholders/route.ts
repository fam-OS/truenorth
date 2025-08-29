import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/api-response';
import { z } from 'zod';

const createGlobalStakeholderSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  role: z.string().min(1, 'Role is required'),
  email: z.string().email('Valid email is required').optional(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const data = createGlobalStakeholderSchema.parse(json);

    // After running Prisma migration + generate, types will align. Until then, suppress mismatch.
    const stakeholder = await prisma.stakeholder.create({
      data: {
        name: data.name,
        role: data.role,
        email: data.email ?? '',
        // businessUnitId left undefined for BU-agnostic stakeholders
      },
    });

    return NextResponse.json(stakeholder, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

export const GET = async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const unassigned = searchParams.get('unassigned');

    const stakeholders = await prisma.stakeholder.findMany({ orderBy: { name: 'asc' } });
    const result = unassigned === 'true'
      ? stakeholders.filter((s) => s.businessUnitId == null)
      : stakeholders;
    return NextResponse.json(result);
  } catch (error) {
    return handleError(error);
  }
};
