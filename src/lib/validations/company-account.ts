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

export const updateCompanyAccountSchema = createCompanyAccountSchema.partial().refine(
  (data) => {
    // If corporateIntranet is provided and not empty, it must be a valid URL
    if (data.corporateIntranet && data.corporateIntranet !== '') {
      try {
        new URL(data.corporateIntranet);
      } catch {
        return false;
      }
    }
    // Same for other URL fields
    if (data.glassdoorLink && data.glassdoorLink !== '') {
      try {
        new URL(data.glassdoorLink);
      } catch {
        return false;
      }
    }
    if (data.linkedinLink && data.linkedinLink !== '') {
      try {
        new URL(data.linkedinLink);
      } catch {
        return false;
      }
    }
    return true;
  },
  {
    message: "Invalid URL format"
  }
);

export type CreateCompanyAccountData = z.infer<typeof createCompanyAccountSchema>;
export type UpdateCompanyAccountData = z.infer<typeof updateCompanyAccountSchema>;
