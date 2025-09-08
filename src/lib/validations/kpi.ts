import { z } from 'zod';

const quarterEnum = z.enum(['Q1', 'Q2', 'Q3', 'Q4']);
const kpiTypeEnum = z.enum(['QUALITATIVE', 'QUANTITATIVE']);

export const createKpiSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  targetMetric: z.number().optional(),
  quarter: quarterEnum,
  year: z.number().int(),
  organizationId: z.string().min(1, 'Organization ID is required'),
  teamId: z.string().min(1, 'Team ID is required'),
  initiativeId: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v ? v : undefined)),
  businessUnitId: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v ? v : undefined)),
  businessUnitIds: z.array(z.string()).optional(),
  kpiType: kpiTypeEnum.optional(),
  revenueImpacting: z.boolean().optional(),
});

export const updateKpiSchema = createKpiSchema.partial();

export type CreateKpiInput = z.infer<typeof createKpiSchema>;
export type UpdateKpiInput = z.infer<typeof updateKpiSchema>;
