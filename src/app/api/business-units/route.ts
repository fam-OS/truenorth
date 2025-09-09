import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/api-response';
import { createBusinessUnitSchema } from '@/lib/validations/organization';
import { getViewerCompanyOrgIds, requireUserId } from '@/lib/access';

export async function GET() {
  try {
    // Centralized auth and scoping by viewer's organizations
    const userId = await requireUserId();
    const orgIds = await getViewerCompanyOrgIds(userId);

    const businessUnitsRaw = await prisma.businessUnit.findMany({
      where: {
        OR: [
          // Units linked to Teams in viewer orgs
          { Team: { some: { organizationId: { in: orgIds } } } },
          // Units linked via Stakeholders whose TeamMember belongs to Teams in viewer orgs
          { Stakeholder: { some: { TeamMember: { Team: { organizationId: { in: orgIds } } } } } },
          // Units linked via KPIs that belong to viewer orgs
          { Kpi: { some: { Organization: { id: { in: orgIds } } } } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        Stakeholder: true,
        Goal: true,
        Metric: true,
        Team: { include: { Organization: true } },
      },
    });

    // Normalize keys for UI compatibility and surface a representative Organization
    const businessUnits = businessUnitsRaw.map((bu: any) => {
      const orgFromTeam = bu.Team?.[0]?.Organization || null;
      const Organization = orgFromTeam
        ? {
            id: orgFromTeam.id,
            name: orgFromTeam.name,
            description: orgFromTeam.description,
            companyAccountId: orgFromTeam.companyAccountId,
            createdAt: orgFromTeam.createdAt,
            updatedAt: orgFromTeam.updatedAt,
          }
        : null;

      return {
        ...bu,
        Organization,
        orgId: Organization?.id ?? bu.orgId ?? '',
        organizationId: Organization?.id ?? bu.organizationId ?? null,
        stakeholders: bu.Stakeholder ?? [],
        goals: bu.Goal ?? [],
        metrics: bu.Metric ?? [],
      };
    });

    return NextResponse.json(businessUnits);
  } catch (error) {
    console.error('Error fetching business units:', error);
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    console.debug('[BusinessUnits][POST] userId:', userId);

    const json = await request.json();
    console.debug('[BusinessUnits][POST] Raw body:', json);
    const data = createBusinessUnitSchema.parse(json);
    console.debug('[BusinessUnits][POST] Parsed data:', data);
    let { companyAccountId } = json as { companyAccountId?: string };
    if (!companyAccountId) {
      // Infer the user's company account if not explicitly provided
      const inferred = await prisma.companyAccount.findFirst({ where: { userId } });
      companyAccountId = inferred?.id;
      console.debug('[BusinessUnits][POST] Inferred companyAccountId:', companyAccountId);
      if (!companyAccountId) {
        return NextResponse.json({ error: 'Company Account ID is required' }, { status: 400 });
      }
    }

    // Verify the company account belongs to the user
    const companyAccount = await prisma.companyAccount.findFirst({
      where: {
        id: companyAccountId,
        userId: userId,
      },
    });

    if (!companyAccount) {
      return NextResponse.json({ error: 'Company account not found' }, { status: 404 });
    }

    // Generate unique ID for business unit
    const businessUnitId = `bu-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    console.debug('[BusinessUnits][POST] Creating BU with id prefix bu- and name:', data.name);
    const businessUnit = await prisma.businessUnit.create({
      data: {
        id: businessUnitId,
        name: data.name,
        description: data.description,
      },
    });
    console.debug('[BusinessUnits][POST] Created BU:', businessUnit.id);

    // Ensure BU appears in GET by linking it to an Organization via a Team
    // Prefer organizationId from request; else pick the first org the viewer can access
    try {
      const targetOrgId = (json as any).organizationId ?? (await getViewerCompanyOrgIds(userId))[0];
      if (targetOrgId) {
        const team = await prisma.team.create({
          data: {
            name: `${data.name} Team`,
            description: `Auto-linked team for Business Unit ${data.name}`,
            organizationId: targetOrgId,
            businessUnitId: businessUnit.id,
          },
        });
        console.debug('[BusinessUnits][POST] Linked BU via Team:', team.id, '-> org', targetOrgId);
      } else {
        console.debug('[BusinessUnits][POST] No accessible organization to link BU; it may not appear in GET until linked.');
      }
    } catch (linkErr) {
      console.error('[BusinessUnits][POST] Skipping link step due to error:', linkErr);
      // Proceed without failing the BU creation
    }

    return NextResponse.json(businessUnit, { status: 201 });
  } catch (error) {
    console.error('Error creating business unit:', error);
    return handleError(error);
  }
}
