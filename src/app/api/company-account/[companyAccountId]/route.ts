import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { requireUserId } from '@/lib/access';

const updateCompanyAccountSchema = z.object({
  name: z.string().min(1, 'Company name is required').optional(),
  description: z.string().optional(),
  founderId: z.string().optional(),
  employees: z.string().optional(),
  headquarters: z.string().optional(),
  launchedDate: z.string().optional(),
  isPrivate: z.boolean().optional(),
  tradedAs: z.string().optional(),
  // Accept any string and normalize below; empty string clears the field
  corporateIntranet: z.string().optional(),
  glassdoorLink: z.string().optional(),
  linkedinLink: z.string().optional()
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyAccountId: string }> }
) {
  const { companyAccountId } = await params;
  try {
    const userId = await requireUserId();

    const companyAccount = await prisma.companyAccount.findFirst({
      where: {
        id: companyAccountId,
        userId: userId
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ companyAccountId: string }> }
) {
  const { companyAccountId } = await params;
  try {
    const userId = await requireUserId();

    // Verify ownership
    const existingAccount = await prisma.companyAccount.findFirst({
      where: {
        id: companyAccountId,
        userId: userId
      }
    });

    if (!existingAccount) {
      return NextResponse.json({ error: 'Company account not found' }, { status: 404 });
    }

    const body = await request.json();
    console.log('Company account update request body:', body);
    const validatedData = updateCompanyAccountSchema.parse(body);
    console.log('Company account validated data:', validatedData);

    // Extract founderId and validate if provided
    const { founderId, ...companyData } = validatedData;

    // Normalize link fields: allow entries without scheme by prefixing https://
    function normalizeLink(input?: string): string | undefined {
      if (typeof input !== 'string') return undefined;
      const s = input.trim();
      if (s === '') return '';
      const tryUrl = (u: string) => { try { new URL(u); return u; } catch { return null; } };
      return tryUrl(s) ?? tryUrl(`https://${s}`) ?? undefined;
    }
    const normalizedLinks: Record<string, string | undefined> = {
      corporateIntranet: normalizeLink(companyData.corporateIntranet),
      glassdoorLink: normalizeLink(companyData.glassdoorLink),
      linkedinLink: normalizeLink(companyData.linkedinLink),
    };
    // If any provided link fails normalization, return 400
    for (const [k, v] of Object.entries(normalizedLinks)) {
      if (companyData[k as keyof typeof companyData] !== undefined && v === undefined) {
        return NextResponse.json({ error: `Invalid URL format for ${k}` }, { status: 400 });
      }
    }
    Object.assign(companyData, normalizedLinks);
    console.log('Extracted founderId:', founderId);
    
    // If founderId is provided and not empty, verify it exists
    if (founderId && founderId !== '') {
      const founderExists = await prisma.teamMember.findUnique({
        where: { id: founderId }
      });
      
      if (!founderExists) {
        return NextResponse.json(
          { error: 'Founder not found' },
          { status: 400 }
        );
      }
    }

    const companyAccount = await prisma.companyAccount.update({
      where: {
        id: companyAccountId
      },
      data: {
        ...companyData,
        ...(founderId && founderId !== '' ? {
          founderId: founderId
        } : founderId === '' ? {
          founderId: null
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

    // If a founderId is set, ensure Executive Team exists and link the founder TeamMember to it
    if (companyAccount.founderId) {
      // Ensure an organization exists for this company account
      let org = await prisma.organization.findFirst({
        where: { companyAccountId: companyAccount.id },
        select: { id: true, name: true },
      });
      if (!org) {
        org = await prisma.organization.create({
          data: {
            id: `org-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
            name: companyAccount.name,
            description: companyAccount.description ?? null,
            companyAccountId: companyAccount.id,
          },
          select: { id: true, name: true },
        });
      }

      // Ensure Executive Team exists under that organization
      const execName = 'Executive Team';
      let execTeam = await prisma.team.findFirst({
        where: { organizationId: org.id, name: execName },
        select: { id: true },
      });
      if (!execTeam) {
        try {
          execTeam = await prisma.team.create({
            data: { name: execName, organizationId: org.id, description: 'Company leadership team' },
            select: { id: true },
          });
        } catch {
          execTeam = await prisma.team.findFirst({ where: { organizationId: org.id, name: execName }, select: { id: true } });
        }
      }

      // Link founder TeamMember to CompanyAccount and Executive Team (ignore if founder not found)
      try {
        await prisma.teamMember.update({
          where: { id: companyAccount.founderId },
          data: {
            CompanyAccount: { connect: { id: companyAccount.id } },
            ...(execTeam?.id ? { Team: { connect: { id: execTeam.id } } } : {}),
          },
        });
      } catch (e) {
        console.warn('Could not link founder to Executive Team on update:', e);
      }
    }

    console.log('Updated company account:', companyAccount);
    return NextResponse.json(companyAccount);
  } catch (error) {
    console.error('Error updating company account:', error);
    
    if (error && typeof error === 'object' && 'issues' in error) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      );
    }
    
    // Check for Prisma errors
    if (error && typeof error === 'object' && 'code' in error) {
      console.error('Prisma error code:', error.code);
      console.error('Prisma error details:', error);
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
    const userId = await requireUserId();

    // Verify ownership
    const existingAccount = await prisma.companyAccount.findFirst({
      where: {
        id: companyAccountId,
        userId: userId
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
