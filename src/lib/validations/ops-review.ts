import { z } from 'zod';

export const Quarter = z.enum(['Q1', 'Q2', 'Q3', 'Q4']);

export const createOpsReviewSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  quarter: Quarter,
  month: z.number().int().min(1).max(12).optional(),
  year: z.number().int().min(2000).max(3000),
  teamId: z.string().min(1),
  ownerId: z.string().min(1).optional(),
});

export const updateOpsReviewSchema = createOpsReviewSchema.partial();

export type CreateOpsReviewInput = z.infer<typeof createOpsReviewSchema>;
export type UpdateOpsReviewInput = z.infer<typeof updateOpsReviewSchema>;
