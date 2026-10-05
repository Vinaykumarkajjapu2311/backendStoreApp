import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100).optional(),
  storeName: z.string().trim().max(150).nullable().optional(),
  address: z.string().trim().max(300).nullable().optional(),
  city: z.string().trim().min(1, 'City is required').max(100).nullable().optional(),
  state: z.string().trim().min(1, 'State is required').max(100).nullable().optional(),
  pincode: z.string().trim().regex(/^\d{6}$/, 'Enter a valid 6-digit Indian PIN code').nullable().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;