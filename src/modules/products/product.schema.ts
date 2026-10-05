import { z } from 'zod';

const productFields = {
  name: z.string().trim().min(1),
  description: z.string().trim().min(1),
  price: z.number().int().positive(),
  stockQuantity: z.number().int().min(0),
  minimumOrderQuantity: z.number().int().min(1),
  unit: z.string().trim().min(1),
  imageUrl: z.string().url().nullable().optional(),
  categoryId: z.string().trim().min(1),
};

export const createProductSchema = z.object(productFields).superRefine((value, context) => {
  if (value.minimumOrderQuantity > value.stockQuantity) context.addIssue({ code: 'custom', path: ['minimumOrderQuantity'], message: 'Minimum order quantity cannot exceed stock quantity' });
});

export const updateProductSchema = z.object({ ...productFields, isActive: z.boolean().optional() }).partial().superRefine((value, context) => {
  if (value.minimumOrderQuantity !== undefined && value.stockQuantity !== undefined && value.minimumOrderQuantity > value.stockQuantity) context.addIssue({ code: 'custom', path: ['minimumOrderQuantity'], message: 'Minimum order quantity cannot exceed stock quantity' });
});