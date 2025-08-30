import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export async function GET() {
  let prisma: PrismaClient | null = null;
  
  try {
    console.log('Testing database connection...');
    console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
    console.log('DATABASE_URL length:', process.env.DATABASE_URL?.length || 0);
    
    // Test with connection pooling for serverless
    console.log('Creating Prisma client with connection pooling...');
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL + '?pgbouncer=true&connection_limit=1'
        }
      }
    });
    
    // Simple database test
    const userCount = await prisma.user.count();
    console.log('Database connection successful, user count:', userCount);
    
    return NextResponse.json({ 
      success: true, 
      userCount,
      message: 'Database connection working with pooling',
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
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }
}
