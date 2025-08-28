import { z } from 'zod';

export const costTypeEnum = z.enum(['SOFTWARE', 'TRAINING', 'SALARY', 'OTHER']);

export const upsertCostSchema = z.object({
  id: z.string().cuid().optional(),
  teamId: z.string().min(1),
  organizationId: z.string().optional().nullable(),
  year: z.number().int().min(1900).max(3000),
  type: costTypeEnum,
  q1Forecast: z.union([z.number(), z.string()]).transform((v) => (typeof v === 'string' ? Number(v) : v)).optional(),
  q1Actual: z.union([z.number(), z.string()]).transform((v) => (typeof v === 'string' ? Number(v) : v)).optional(),
  q2Forecast: z.union([z.number(), z.string()]).transform((v) => (typeof v === 'string' ? Number(v) : v)).optional(),
  q2Actual: z.union([z.number(), z.string()]).transform((v) => (typeof v === 'string' ? Number(v) : v)).optional(),
  q3Forecast: z.union([z.number(), z.string()]).transform((v) => (typeof v === 'string' ? Number(v) : v)).optional(),
  q3Actual: z.union([z.number(), z.string()]).transform((v) => (typeof v === 'string' ? Number(v) : v)).optional(),
  q4Forecast: z.union([z.number(), z.string()]).transform((v) => (typeof v === 'string' ? Number(v) : v)).optional(),
  q4Actual: z.union([z.number(), z.string()]).transform((v) => (typeof v === 'string' ? Number(v) : v)).optional(),
  notes: z.string().optional().nullable(),
});
