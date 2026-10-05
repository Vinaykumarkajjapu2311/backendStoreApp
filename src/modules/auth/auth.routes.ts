import { Router } from 'express';
import rateLimit from 'express-rate-limit';

import { requireAuth } from '../../middleware/auth.js';
import { changePasswordController, loginController, meController } from './auth.controller.js';

export const authRouter = Router();

const loginRateLimit = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: 10,
	standardHeaders: 'draft-8',
	legacyHeaders: false,
	message: {
		success: false,
		error: { code: 'TOO_MANY_REQUESTS', message: 'Too many login attempts. Please try again later.' },
	},
});

authRouter.post('/login', loginRateLimit, loginController);
authRouter.get('/me', requireAuth, meController);
authRouter.patch('/change-password', requireAuth, changePasswordController);
