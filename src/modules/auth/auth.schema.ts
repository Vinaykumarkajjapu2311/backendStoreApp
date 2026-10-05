import { z } from 'zod';

export const loginSchema = z.object({
  phone: z.string().trim().regex(/^\d{10}$/, 'Phone number must contain 10 digits'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
}).refine((value) => value.currentPassword !== value.newPassword, { path: ['newPassword'], message: 'New password must be different from the current password' });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
