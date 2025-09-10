import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireUserId } from '@/lib/access';

const onboardingSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  company: z.string().min(1),
  level: z.string().min(1),
  industry: z.string().min(1),
  leadershipStyles: z.array(z.string()).min(1),
});

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    const data = onboardingSchema.parse(body);

    // 1) Update the user's onboarding fields
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        companyName: data.company,
        level: data.level,
        industry: data.industry,
        leadershipStyles: data.leadershipStyles,
        onboardedAt: new Date(),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        companyName: true,
        level: true,
        industry: true,
        leadershipStyles: true,
        onboardedAt: true,
      },
    });

    // 2) Ensure a CompanyAccount exists for this user and is named from onboarding
    let company = await prisma.companyAccount.findFirst({
      where: { userId },
      select: { id: true, name: true },
    });
    if (!company) {
      company = await prisma.companyAccount.create({
        data: {
          id: `acct_${Date.now()}`,
          userId,
          name: data.company,
          description: null,
        },
        select: { id: true, name: true },
      });
    } else if (!company.name || company.name.trim().length === 0) {
      company = await prisma.companyAccount.update({
        where: { id: company.id },
        data: { name: data.company },
        select: { id: true, name: true },
      });
    }

    // 3) Ensure a default Organization exists: "<Company Name> - All"
    const defaultOrgName = `${company.name} - All`;
    let defaultOrg = await prisma.organization.findFirst({
      where: { companyAccountId: company.id, name: defaultOrgName },
      select: { id: true, name: true },
    });
    if (!defaultOrg) {
      defaultOrg = await prisma.organization.create({
        data: {
          id: `org-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: defaultOrgName,
          description: null,
          companyAccountId: company.id,
        },
        select: { id: true, name: true },
      });
    }

    // 4) Create a TeamMember for the user under this CompanyAccount
    // Map onboarding level -> TeamMember.role options used in UI
    const roleMap: Record<string, string> = {
      'Founder / owner': 'CEO',
      'C-level': 'Executive',
      'VP': 'Director',
      'Director': 'Director',
      'Manager': 'Manager',
      'Supervisor': 'Manager',
      'Team Lead': 'Manager',
      'Individual Contributor': 'Team Member',
    };
    const mappedRole = roleMap[data.level] ?? 'Team Member';

    // Upsert TeamMember by composite unique (companyAccountId, email)
    // Note: Prisma supports upsert with unique compound where.
    const teamMember = await prisma.teamMember.upsert({
      where: {
        companyAccountId_email: {
          companyAccountId: company.id,
          email: data.email,
        },
      },
      create: {
        name: `${data.firstName} ${data.lastName}`.trim(),
        email: data.email,
        role: mappedRole,
        companyAccountId: company.id,
      },
      update: {
        name: `${data.firstName} ${data.lastName}`.trim(),
        role: mappedRole,
      },
      select: { id: true, name: true, email: true, role: true, companyAccountId: true },
    });

    return NextResponse.json({ success: true, user: updated, companyAccount: company, organization: defaultOrg, teamMember });
  } catch (error: any) {
    if (error?.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 });
    }
    if (error instanceof Response) return error; // from requireUserId
    console.error('Onboarding save failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
