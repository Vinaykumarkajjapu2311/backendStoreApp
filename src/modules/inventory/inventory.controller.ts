import type { Request, Response } from 'express';
import { prisma } from '../../config/prisma.js';

export async function listInventoryHistoryController(request: Request, response: Response) {
  const productId = request.params.productId;
  if (typeof productId !== 'string') { response.status(400).json({ success: false, error: { code: 'INVALID_PRODUCT_ID', message: 'Invalid product id' } }); return; }
  const history = await prisma.inventoryTransaction.findMany({ where: { productId }, orderBy: { createdAt: 'desc' } });
  response.json({ success: true, history });
}