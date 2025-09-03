import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { subject, category, priority, description, steps } = await request.json();

    if (!subject || !category || !description) {
      return NextResponse.json(
        { error: 'Subject, category, and description are required' },
        { status: 400 }
      );
    }

    // Get user ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Create support request
    const supportRequest = await prisma.supportRequest.create({
      data: {
        id: randomUUID(),
        subject,
        category,
        priority: priority || 'medium',
        description,
        steps: steps || null,
        userId: user.id,
        status: 'open',
      },
    });

    return NextResponse.json(
      { message: 'Support request submitted successfully', id: supportRequest.id },
      { status: 201 }
    );
  } catch (error) {
    console.error('Support request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's support requests
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const supportRequests = await prisma.supportRequest.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(supportRequests);
  } catch (error) {
    console.error('Get support requests error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
