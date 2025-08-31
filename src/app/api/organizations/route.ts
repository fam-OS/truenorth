import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createOrganizationSchema } from '@/lib/validations/organization';
import { handleError } from '@/lib/api-response';

export async function GET() {
  try {
    console.log('Fetching organizations...');
    
    const organizations = await prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        businessUnits: {
          select: {
            id: true,
            name: true,
            description: true,
            stakeholders: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              }
            }
          }
        },
        ceoGoals: {
          select: {
            id: true,
            description: true,
            createdAt: true,
          }
        }
      }
    });

    console.log(`Found ${organizations.length} organizations`);
    return NextResponse.json(organizations);
  } catch (error) {
    console.error('Organizations API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organizations' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const data = createOrganizationSchema.parse(json);

    const organization = await prisma.organization.create({
      data,
      include: {
        businessUnits: true,
      },
    });

    return NextResponse.json(organization, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}