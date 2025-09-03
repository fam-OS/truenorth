import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/api-response';
import { createBusinessUnitSchema } from '@/lib/validations/organization';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const businessUnitsRaw = await prisma.businessUnit.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        Stakeholder: true,
        Goal: true,
        Metric: true,
        // BusinessUnit has no Organization relation per schema.prisma
      },
    });

    // Normalize keys for UI compatibility: provide both capitalized and lowercase collections
    const businessUnits = businessUnitsRaw.map((bu: any) => ({
      ...bu,
      stakeholders: bu.Stakeholder ?? [],
      goals: bu.Goal ?? [],
      metrics: bu.Metric ?? [],
    }));

    return NextResponse.json(businessUnits);
  } catch (error) {
    console.error('Error fetching business units:', error);
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const json = await request.json();
    const data = createBusinessUnitSchema.parse(json);
    const { companyAccountId } = json;

    if (!companyAccountId) {
      return NextResponse.json({ error: 'Company Account ID is required' }, { status: 400 });
    }

    // Verify the company account belongs to the user
    const companyAccount = await prisma.companyAccount.findFirst({
      where: {
        id: companyAccountId,
        userId: session.user.id,
      },
    });

    if (!companyAccount) {
      return NextResponse.json({ error: 'Company account not found' }, { status: 404 });
    }

    // Generate unique ID for business unit
    const businessUnitId = `bu-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    const businessUnit = await prisma.businessUnit.create({
      data: {
        id: businessUnitId,
        name: data.name,
        description: data.description,
      },
    });

    return NextResponse.json(businessUnit, { status: 201 });
  } catch (error) {
    console.error('Error creating business unit:', error);
    return handleError(error);
  }
}
