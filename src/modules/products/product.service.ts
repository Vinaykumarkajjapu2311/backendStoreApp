import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../utils/api-error.js';
import type { z } from 'zod';
import type { createProductSchema, updateProductSchema } from './product.schema.js';

const productInclude = { category: { select: { id: true, name: true } } } satisfies Prisma.ProductInclude;

export async function listProducts(includeInactive = false) {
  return prisma.product.findMany({ where: includeInactive ? undefined : { isActive: true }, include: productInclude, orderBy: { name: 'asc' } });
}

export async function getProduct(id: string, includeInactive = false) {
  const product = await prisma.product.findFirst({ where: { id, ...(includeInactive ? {} : { isActive: true }) }, include: productInclude });
  if (!product) throw new ApiError(404, 'PRODUCT_NOT_FOUND', 'Product not found');
  return product;
}

export async function listCategories() {
  return prisma.category.findMany({ where: { products: { some: { isActive: true } } }, orderBy: { name: 'asc' } });
}

export async function createProduct(input: z.infer<typeof createProductSchema>) {
  const category = await prisma.category.findUnique({ where: { id: input.categoryId } });
  if (!category) throw new ApiError(400, 'INVALID_CATEGORY', 'Category not found');
  return prisma.product.create({ data: input, include: productInclude });
}

export async function updateProduct(id: string, input: z.infer<typeof updateProductSchema>) {
  const current = await getProduct(id, true);
  const stockQuantity = input.stockQuantity ?? current.stockQuantity;
  const minimumOrderQuantity = input.minimumOrderQuantity ?? current.minimumOrderQuantity;
  if (minimumOrderQuantity > stockQuantity) throw new ApiError(400, 'INVALID_PRODUCT', 'Minimum order quantity cannot exceed stock quantity');
  if (input.categoryId) {
    const category = await prisma.category.findUnique({ where: { id: input.categoryId } });
    if (!category) throw new ApiError(400, 'INVALID_CATEGORY', 'Category not found');
  }
  return prisma.product.update({ where: { id }, data: input, include: productInclude });
}

export async function deactivateProduct(id: string) {
  await getProduct(id, true);
  return prisma.product.update({ where: { id }, data: { isActive: false }, include: productInclude });
}