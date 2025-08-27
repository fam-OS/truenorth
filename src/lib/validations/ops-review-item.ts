import { z } from 'zod';
import { Quarter } from './ops-review';

export const createOpsReviewItemSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  targetMetric: z.number().optional(),
  actualMetric: z.number().optional(),
  quarter: Quarter.optional(),
  year: z.number().int().min(2000).max(3000).optional(),
  teamId: z.string().min(1),
  ownerId: z.string().min(1).optional(),
  opsReviewId: z.string().min(1),
});

// Update schema allows clearing some fields by accepting null
export const updateOpsReviewItemSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  targetMetric: z.number().nullable().optional(),
  actualMetric: z.number().nullable().optional(),
  quarter: Quarter.optional(),
  year: z.number().int().min(2000).max(3000).optional(),
  teamId: z.string().min(1).optional(),
  ownerId: z.string().min(1).nullable().optional(),
  opsReviewId: z.string().min(1).optional(),
});

export type CreateOpsReviewItemInput = z.infer<typeof createOpsReviewItemSchema>;
export type UpdateOpsReviewItemInput = z.infer<typeof updateOpsReviewItemSchema>;
