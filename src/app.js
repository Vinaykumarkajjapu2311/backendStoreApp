import cors from 'cors';
import express from 'express';

import { env } from './config/env.js';
import { errorHandler } from './middleware/error-handler.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { productRouter } from './modules/products/product.routes.js';
import { profileRouter } from './modules/profile/profile.routes.js';
import { orderRouter } from './modules/orders/order.routes.js';
import { inventoryRouter } from './modules/inventory/inventory.routes.js';

export const app = express();

app.use(cors({ origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(',') }));
app.use(express.json());

app.get('/health', (_request, response) => {
  response.json({ success: true, data: { status: 'ok' } });
});
app.use('/api/auth', authRouter);
app.use('/api/products', productRouter);
app.use('/api/profile', profileRouter);
app.use('/api/orders', orderRouter);
app.use('/api/inventory', inventoryRouter);
app.use(errorHandler);
