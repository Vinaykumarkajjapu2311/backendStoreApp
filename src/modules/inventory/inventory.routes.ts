import { Router } from 'express';
import { Role } from '@prisma/client';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { listInventoryHistoryController } from './inventory.controller.js';

export const inventoryRouter = Router();
inventoryRouter.use(requireAuth, requireRole(Role.ADMIN));
inventoryRouter.get('/:productId/history', listInventoryHistoryController);