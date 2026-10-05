import { InventoryTransactionType, Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../utils/api-error.js';
import type { CreateOrderInput } from './order.schema.js';

const orderInclude = { items: { orderBy: { productName: 'asc' } } } satisfies Prisma.OrderInclude;

export async function createOrder(userId: string, input: CreateOrderInput) {
  return prisma.$transaction(async (transaction) => {
    const productIds = input.items.map((item) => item.productId);
    const products = await transaction.product.findMany({ where: { id: { in: productIds } } });
    const byId = new Map(products.map((product) => [product.id, product]));
    const validated = input.items.map((item) => {
      const product = byId.get(item.productId);
      if (!product) throw new ApiError(404, 'PRODUCT_NOT_FOUND', 'Product not found');
      if (!product.isActive) throw new ApiError(400, 'PRODUCT_UNAVAILABLE', `${product.name} is no longer available.`);
      if (item.quantity < product.minimumOrderQuantity) throw new ApiError(400, 'MOQ_NOT_MET', `Minimum order quantity for ${product.name} is ${product.minimumOrderQuantity} ${product.unit}.`);
      if (item.quantity > product.stockQuantity) throw new ApiError(400, 'INSUFFICIENT_STOCK', `Only ${product.stockQuantity} ${product.unit} of ${product.name} are currently available.`);
      return { item, product, subtotal: product.price * item.quantity };
    });
    const totalAmount = validated.reduce((total, entry) => total + entry.subtotal, 0);
    const order = await transaction.order.create({ data: { userId, totalAmount, items: { create: validated.map(({ item, product, subtotal }) => ({ productId: product.id, productName: product.name, quantity: item.quantity, unitPrice: product.price, subtotal })) } }, include: orderInclude });
    for (const { item, product } of validated) {
      const updated = await transaction.product.updateMany({ where: { id: product.id, isActive: true, stockQuantity: { gte: item.quantity } }, data: { stockQuantity: { decrement: item.quantity } } });
      if (updated.count !== 1) throw new ApiError(400, 'INSUFFICIENT_STOCK', `Stock changed for ${product.name}. Please review your cart.`);
      await transaction.inventoryTransaction.create({ data: { productId: product.id, type: InventoryTransactionType.ORDER, quantity: -item.quantity, referenceType: 'ORDER', referenceId: order.id } });
    }
    return order;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function listOrders(userId: string) {
  return prisma.order.findMany({ where: { userId }, include: orderInclude, orderBy: { createdAt: 'desc' } });
}

export async function getOrder(userId: string, id: string) {
  const order = await prisma.order.findFirst({ where: { id, userId }, include: orderInclude });
  if (!order) throw new ApiError(404, 'ORDER_NOT_FOUND', 'Order not found');
  return order;
}