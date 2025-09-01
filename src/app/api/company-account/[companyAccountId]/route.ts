import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { updateCompanyAccountSchema } from '@/lib/validations/company-account';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyAccountId: string }> }
) {
  const { companyAccountId } = await params;
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const companyAccount = await prisma.companyAccount.findFirst({
      where: {
        id: companyAccountId,
        user: {
          id: session.user.id!
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ companyAccountId: string }> }
) {
  const { companyAccountId } = await params;
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership
    const existingAccount = await prisma.companyAccount.findFirst({
      where: {
        id: companyAccountId,
        user: {
          id: session.user.id
        }
      }
    });

    if (!existingAccount) {
      return NextResponse.json({ error: 'Company account not found' }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = updateCompanyAccountSchema.parse(body);

    const companyAccount = await prisma.companyAccount.update({
      where: {
        id: companyAccountId
      },
      data: validatedData,
      include: {
        founder: true,
        organizations: {
          include: {
            businessUnits: true
          }
        }
      }
    });

    return NextResponse.json(companyAccount);
  } catch (error) {
    console.error('Error updating company account:', error);
    
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ companyAccountId: string }> }
) {
  const { companyAccountId } = await params;
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership
    const existingAccount = await prisma.companyAccount.findFirst({
      where: {
        id: companyAccountId,
        user: {
          id: session.user.id
        }
      }
    });

    if (!existingAccount) {
      return NextResponse.json({ error: 'Company account not found' }, { status: 404 });
    }

    // Delete the company account (this will cascade delete organizations due to schema constraints)
    await prisma.companyAccount.delete({
      where: {
        id: companyAccountId
      }
    });

    return NextResponse.json({ message: 'Company account deleted successfully' });
  } catch (error) {
    console.error('Error deleting company account:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
