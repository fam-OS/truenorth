import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    console.log('Testing database connection...');
    
    // Simple database test
    const userCount = await prisma.user.count();
    console.log('Database connection successful, user count:', userCount);
    
    return NextResponse.json({ 
      success: true, 
      userCount,
      message: 'Database connection working'
    });
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      },
      { status: 500 }
    );
  }
}
