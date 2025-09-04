import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { requireUserId } from '@/lib/access';

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
    console.error('Error fetching company account:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
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

    return NextResponse.json(companyAccount, { status: 201 });
  } catch (error) {
    console.error('Error creating company account:', error);
    console.error('Error details:', error instanceof Error ? error.message : error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid data', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
