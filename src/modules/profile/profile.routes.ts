import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { getProfileController, updateProfileController } from './profile.controller.js';

export const profileRouter = Router();
profileRouter.use(requireAuth);
profileRouter.get('/', getProfileController);
profileRouter.patch('/', updateProfileController);