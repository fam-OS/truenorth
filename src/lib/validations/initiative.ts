import { z } from 'zod';

const initiativeTypeEnum = z.enum(['CAPITALIZABLE', 'OPERATIONAL_EFFICIENCY', 'KTLO']);
const initiativeStatusEnum = z.enum(['NOT_STARTED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED']);

export const createInitiativeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: initiativeTypeEnum.optional(),
  atRisk: z.boolean().optional(),
  status: initiativeStatusEnum.optional(),
  summary: z.string().optional(),
  valueProposition: z.string().optional(),
  implementationDetails: z.string().optional(),
  releaseDate: z
    .string()
    .optional()
    .nullable()
    .transform((str) => (str ? new Date(str) : undefined)),
  organizationId: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v ? v : undefined)),
  ownerId: z
    .string()
    .optional()
    .nullable()
    // Preserve null to signal explicit disconnect; empty string -> undefined
    .transform((v) => (v === null ? null : v ? v : undefined)),
  businessUnitId: z
    .string()
    .optional()
    .nullable()
    // Preserve null to signal explicit disconnect; empty string -> undefined
    .transform((v) => (v === null ? null : v ? v : undefined)),
});

export const updateInitiativeSchema = createInitiativeSchema.partial();

export type CreateInitiativeInput = z.infer<typeof createInitiativeSchema>;
export type UpdateInitiativeInput = z.infer<typeof updateInitiativeSchema>;
