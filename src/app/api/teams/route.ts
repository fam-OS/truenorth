import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { handleError } from '@/lib/api-response';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const teams = await prisma.$queryRaw`
      SELECT id, name 
      FROM "Team" 
      ORDER BY name ASC
    `;
    
    return NextResponse.json(teams);
  } catch (error) {
    return handleError(error);
  }
}
