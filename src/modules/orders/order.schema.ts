import { z } from 'zod';

export const createOrderSchema = z.object({
  items: z.array(z.object({ productId: z.string().min(1), quantity: z.number().int().min(1) })).min(1),
}).superRefine((value, context) => {
  const ids = value.items.map((item) => item.productId);
  if (new Set(ids).size !== ids.length) context.addIssue({ code: 'custom', path: ['items'], message: 'Duplicate products are not allowed in an order' });
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;