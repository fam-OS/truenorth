import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

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
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const companyAccount = await prisma.companyAccount.findFirst({
      where: {
        userId: session.user.id
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

    if (!companyAccount) {
      return NextResponse.json({ error: 'Company account not found' }, { status: 404 });
    }

    return NextResponse.json(companyAccount);
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
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user already has a company account (1:1 relationship)
    const existingAccount = await prisma.companyAccount.findFirst({
      where: {
        userId: session.user.id
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
        ...companyData,
        userId: session.user.id,
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
