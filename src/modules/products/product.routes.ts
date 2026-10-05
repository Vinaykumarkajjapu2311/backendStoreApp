import { Router } from 'express';
import { Role } from '@prisma/client';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { createProductController, deactivateProductController, getProductController, listCategoriesController, listProductsController, updateProductController } from './product.controller.js';

export const productRouter = Router();
productRouter.use(requireAuth);
productRouter.get('/categories', listCategoriesController);
productRouter.get('/', listProductsController);
productRouter.get('/:id', getProductController);
productRouter.post('/', requireRole(Role.ADMIN), createProductController);
productRouter.patch('/:id', requireRole(Role.ADMIN), updateProductController);
productRouter.delete('/:id', requireRole(Role.ADMIN), deactivateProductController);