import { z } from 'zod';

export const createInitiativeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  summary: z.string().optional(),
  valueProposition: z.string().optional(),
  implementationDetails: z.string().optional(),
  releaseDate: z
    .string()
    .optional()
    .nullable()
    .transform((str) => (str ? new Date(str) : undefined)),
  organizationId: z.string().min(1, 'Organization ID is required'),
  ownerId: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v ? v : undefined)),
  businessUnitId: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v ? v : undefined)),
});

export const updateInitiativeSchema = createInitiativeSchema.partial();

export type CreateInitiativeInput = z.infer<typeof createInitiativeSchema>;
export type UpdateInitiativeInput = z.infer<typeof updateInitiativeSchema>;
