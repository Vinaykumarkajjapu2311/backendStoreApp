import type { Request, Response } from 'express';
import { createOrderSchema } from './order.schema.js';
import { createOrder, getOrder, listOrders } from './order.service.js';

export async function createOrderController(request: Request, response: Response) {
  const order = await createOrder(request.user!.id, createOrderSchema.parse(request.body));
  response.status(201).json({ success: true, message: 'Order placed successfully.', order });
}

export async function listOrdersController(request: Request, response: Response) {
  response.json({ success: true, orders: await listOrders(request.user!.id) });
}

export async function getOrderController(request: Request, response: Response) {
  const id = request.params.id;
  if (typeof id !== 'string') { response.status(404).json({ success: false, error: { code: 'ORDER_NOT_FOUND', message: 'Order not found' } }); return; }
  response.json({ success: true, order: await getOrder(request.user!.id, id) });
}