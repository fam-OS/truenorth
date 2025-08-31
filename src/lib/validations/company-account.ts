import { z } from 'zod';

export const createCompanyAccountSchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  description: z.string().optional(),
  founderId: z.string().optional(),
  employees: z.string().optional(),
  headquarters: z.string().optional(),
  launchedDate: z.string().optional(),
  isPrivate: z.boolean().default(true),
  tradedAs: z.string().optional(),
  corporateIntranet: z.string().url().optional().or(z.literal('')),
  glassdoorLink: z.string().url().optional().or(z.literal('')),
  linkedinLink: z.string().url().optional().or(z.literal(''))
});

export const updateCompanyAccountSchema = createCompanyAccountSchema.partial();

export type CreateCompanyAccountData = z.infer<typeof createCompanyAccountSchema>;
export type UpdateCompanyAccountData = z.infer<typeof updateCompanyAccountSchema>;
