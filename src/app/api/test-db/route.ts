import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    console.log('Testing database connection...');
    console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
    console.log('DATABASE_URL length:', process.env.DATABASE_URL?.length || 0);
    
    // Test Prisma client initialization
    console.log('Testing Prisma client...');
    
    // Simple database test
    const userCount = await prisma.user.count();
    console.log('Database connection successful, user count:', userCount);
    
    return NextResponse.json({ 
      success: true, 
      userCount,
      message: 'Database connection working',
      hasDbUrl: !!process.env.DATABASE_URL
    });
  } catch (error) {
    console.error('Database test error:', error);
    console.error('Error name:', error instanceof Error ? error.name : 'Unknown');
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        errorName: error instanceof Error ? error.name : 'Unknown',
        hasDbUrl: !!process.env.DATABASE_URL,
        dbUrlLength: process.env.DATABASE_URL?.length || 0
      },
      { status: 500 }
    );
  }
}
