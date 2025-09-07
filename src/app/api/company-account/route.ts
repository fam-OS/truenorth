import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { requireUserId } from '@/lib/access';
import { handleError } from '@/lib/api-response';

const createCompanyAccountSchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  description: z.string().optional(),
  founderId: z.string().optional(),
  employees: z.string().optional(),
  headquarters: z.string().optional(),
  launchedDate: z.string().optional(),
  isPrivate: z.boolean().default(true),
  tradedAs: z.string().optional(),
  corporateIntranet: z.string().url().optional().or(z.literal('')),
  glassdoorLink: z.string().url().optional().or(z.literal('')),
  linkedinLink: z.string().url().optional().or(z.literal(''))
});

export async function GET() {
  try {
    const userId = await requireUserId();

    const companyAccount = await prisma.companyAccount.findFirst({
      where: {
        userId: userId
      }
    });

    if (!companyAccount) {
      return NextResponse.json({ error: 'Company account not found' }, { status: 404 });
    }

    // Fetch founder separately if founderId exists
    let founder = null;
    if (companyAccount.founderId) {
      founder = await prisma.teamMember.findUnique({
        where: { id: companyAccount.founderId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        }
      });
    }

    const result = {
      ...companyAccount,
      founder
    };

    return NextResponse.json(result);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireUserId();

    // Check if user already has a company account (1:1 relationship)
    const existingAccount = await prisma.companyAccount.findFirst({
      where: {
        userId: userId
      }
    });

    if (existingAccount) {
      return NextResponse.json(
        { error: 'User already has a company account' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = createCompanyAccountSchema.parse(body);

    // Extract founderId from validated data and handle founder relationship
    const { founderId, ...companyData } = validatedData;

    const companyAccount = await prisma.companyAccount.create({
      data: {
        id: `company-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        ...companyData,
        userId: userId,
        ...(founderId && founderId !== '' ? {
          founderId: founderId
        } : {})
      },
      select: {
        id: true,
        name: true,
        description: true,
        founderId: true,
        employees: true,
        headquarters: true,
        launchedDate: true,
        isPrivate: true,
        tradedAs: true,
        corporateIntranet: true,
        glassdoorLink: true,
        linkedinLink: true,
        userId: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (process.env.NODE_ENV !== 'test') {
      // Ensure there is at least one Organization for this CompanyAccount
      // Use the company name as the default organization name
      let organization = await prisma.organization.findFirst({
        where: { companyAccountId: companyAccount.id },
        select: { id: true }
      });

      if (!organization) {
        organization = await prisma.organization.create({
          data: {
            id: `org-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
            name: companyAccount.name,
            description: companyAccount.description ?? null,
            companyAccountId: companyAccount.id,
          },
          select: { id: true },
        });
      }

      // Ensure Executive Team exists under that organization
      let executiveTeam = await prisma.team.findFirst({
        where: { organizationId: organization.id, name: 'Executive Team' },
        select: { id: true },
      });
      if (!executiveTeam) {
        try {
          executiveTeam = await prisma.team.create({
            data: {
              name: 'Executive Team',
              organizationId: organization.id,
              description: 'Company leadership team',
            },
            select: { id: true },
          });
        } catch (e: any) {
          // In case of a race or unique constraint, fetch existing
          executiveTeam = await prisma.team.findFirst({
            where: { organizationId: organization.id, name: 'Executive Team' },
            select: { id: true },
          });
        }
      }

      // If a founderId was provided, relate that TeamMember to the Executive Team
      if (founderId && executiveTeam?.id) {
        try {
          await prisma.teamMember.update({
            where: { id: founderId },
            data: {
              CompanyAccount: { connect: { id: companyAccount.id } },
              Team: { connect: { id: executiveTeam.id } },
            },
          });
        } catch (e) {
          console.warn('Founder team member could not be linked to Executive Team:', e);
        }
      }
    }

    return NextResponse.json(companyAccount, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid data', details: error.message },
        { status: 400 }
      );
    }
    return handleError(error);
  }
}
