import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createCompanyAccountSchema } from '@/lib/validations/company-account';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const companyAccount = await prisma.companyAccount.findFirst({
      where: {
        user: {
          id: session.user.id
        }
      },
      include: {
        founder: true,
        organizations: {
          include: {
            businessUnits: true
          }
        }
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
        user: {
          id: session.user.id
        }
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
        user: {
          connect: { id: session.user.id }
        },
        ...(founderId && founderId !== '' ? {
          founder: {
            connect: { id: founderId }
          }
        } : {})
      },
      include: {
        founder: true,
        organizations: {
          include: {
            businessUnits: true
          }
        }
      }
    });

    return NextResponse.json(companyAccount, { status: 201 });
  } catch (error) {
    console.error('Error creating company account:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid data', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
