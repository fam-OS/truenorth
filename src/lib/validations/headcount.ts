import { z } from 'zod';

export const upsertHeadcountSchema = z.object({
  teamId: z.string().min(1, 'Team is required'),
  organizationId: z.string().optional().nullable().transform((v) => (v || undefined)),
  year: z.number().int().min(2000).max(2100),
  role: z.string().min(1),
  level: z.string().min(1),
  salary: z.union([z.number(), z.string()]).transform((v) => (typeof v === 'string' ? parseFloat(v) : v)),
  q1Forecast: z.number().int().min(0).optional().default(0),
  q1Actual: z.number().int().min(0).optional().default(0),
  q2Forecast: z.number().int().min(0).optional().default(0),
  q2Actual: z.number().int().min(0).optional().default(0),
  q3Forecast: z.number().int().min(0).optional().default(0),
  q3Actual: z.number().int().min(0).optional().default(0),
  q4Forecast: z.number().int().min(0).optional().default(0),
  q4Actual: z.number().int().min(0).optional().default(0),
  notes: z.string().optional().nullable().transform((v) => (v || undefined)),
});

export const updateHeadcountSchema = upsertHeadcountSchema.partial();

export type UpsertHeadcountInput = z.infer<typeof upsertHeadcountSchema>;
export type UpdateHeadcountInput = z.infer<typeof updateHeadcountSchema>;
