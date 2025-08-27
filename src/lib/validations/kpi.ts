import { z } from 'zod';

const quarterEnum = z.enum(['Q1', 'Q2', 'Q3', 'Q4']);

export const createKpiSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  targetMetric: z.number().optional(),
  actualMetric: z.number().optional(),
  quarter: quarterEnum,
  year: z.number().int(),
  organizationId: z.string().min(1, 'Organization ID is required'),
  teamId: z.string().min(1, 'Team ID is required'),
  initiativeId: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v ? v : undefined)),
});

export const updateKpiSchema = createKpiSchema.partial();

export type CreateKpiInput = z.infer<typeof createKpiSchema>;
export type UpdateKpiInput = z.infer<typeof updateKpiSchema>;
