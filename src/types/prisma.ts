import { Prisma } from '@prisma/client';

export type OrganizationWithBusinessUnits = Prisma.OrganizationGetPayload<{
  include: {
    businessUnits: {
      include: {
        stakeholders: true;
        metrics: true;
        goals: true;
      };
    };
  };
}>;

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
    description: string;
    title: string;
    startDate: Date;
    endDate: Date;
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD';
    stakeholderId: string;
    requirements: string | null;
    progressNotes: string | null;
    businessUnitId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }>;
};

export type StakeholderWithDetails = Prisma.StakeholderGetPayload<{
  include: {
    goals: true;
    meetings: true;
  };
}>;