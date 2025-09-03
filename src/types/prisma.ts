import { Prisma, $Enums } from '@prisma/client';

// Note: Keep this aligned with what /api/organizations returns. We only use a few fields in the UI.
export type OrganizationWithBusinessUnits = {
  id: string;
  name: string;
  description: string | null;
  companyAccountId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type BusinessUnitWithDetails = {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  organizationId: string | null;
  orgId: string;
  Organization: {
    id: string;
    name: string;
    description: string | null;
    companyAccountId: string;
    createdAt: Date;
    updatedAt: Date;
  } | null;
  Stakeholder: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    businessUnitId: string | null;
    reportsToId: string | null;
    teamMemberId: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
  stakeholders: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    businessUnitId: string | null;
    reportsToId: string | null;
    teamMemberId: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
  Metric: Array<{
    id: string;
    name: string;
    description: string | null;
    target: number | null;
    current: number | null;
    unit: string | null;
    businessUnitId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }>;
  metrics: Array<{
    id: string;
    name: string;
    description: string | null;
    target: number | null;
    current: number | null;
    unit: string | null;
    businessUnitId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }>;
  Goal: Array<{
    id: string;
    title: string;
    description: string | null;
    status: $Enums.GoalStatus | null;
    stakeholderId: string | null;
    progressNotes: string | null;
    businessUnitId: string;
    quarter: $Enums.Quarter;
    year: number;
    createdAt: Date;
    updatedAt: Date;
  }>;
};

export type StakeholderWithDetails = Prisma.StakeholderGetPayload<{
  include: {
    Goal: true;
    Meeting: true;
  };
}>;