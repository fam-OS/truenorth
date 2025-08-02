import { z } from 'zod';

export const createOrganizationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
});

export const createBusinessUnitSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  orgId: z.string().min(1, 'Organization ID is required'),
});

export const createStakeholderSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  role: z.string().min(1, 'Role is required'),
  businessUnitId: z.string().min(1, 'Business Unit ID is required'),
});

export const createGoalSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  startDate: z.string().transform((str) => new Date(str)),
  endDate: z.string().transform((str) => new Date(str)),
  stakeholderId: z.string().min(1, 'Stakeholder ID is required'),
  requirements: z.string().optional(),
  progressNotes: z.string().optional(),
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'AT_RISK', 'BLOCKED', 'CANCELLED']).default('NOT_STARTED'),
});

export const createMeetingSchema = z.object({
  date: z.string().transform((str) => new Date(str)),
  notes: z.string().min(1, 'Notes are required'),
  stakeholderId: z.string().min(1, 'Stakeholder ID is required'),
});

export const createMetricSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  target: z.number().min(0, 'Target must be a positive number'),
  current: z.number().min(0, 'Current value must be a positive number'),
  unit: z.string().min(1, 'Unit is required'),
  businessUnitId: z.string().min(1, 'Business Unit ID is required'),
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type CreateBusinessUnitInput = z.infer<typeof createBusinessUnitSchema>;
export type CreateStakeholderInput = z.infer<typeof createStakeholderSchema>;
export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type CreateMeetingInput = z.infer<typeof createMeetingSchema>;
export type CreateMetricInput = z.infer<typeof createMetricSchema>;