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

export type BusinessUnitWithDetails = Prisma.BusinessUnitGetPayload<{
  include: {
    stakeholders: true;
    metrics: true;
    goals: true;
    organization: true;
  };
}>;

export type StakeholderWithDetails = Prisma.StakeholderGetPayload<{
  include: {
    goals: true;
    meetings: true;
  };
}>;