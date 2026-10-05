import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { createOrderController, getOrderController, listOrdersController } from './order.controller.js';

export const orderRouter = Router();
orderRouter.use(requireAuth);
orderRouter.post('/', createOrderController);
orderRouter.get('/', listOrdersController);
orderRouter.get('/:id', getOrderController);