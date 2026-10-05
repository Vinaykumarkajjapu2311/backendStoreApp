import type { Request, Response } from 'express';
import { updateProfileSchema } from './profile.schema.js';
import { getProfile, updateProfile } from './profile.service.js';

export async function getProfileController(request: Request, response: Response) {
  const user = await getProfile(request.user!.id);
  response.json({ success: true, user });
}

export async function updateProfileController(request: Request, response: Response) {
  const user = await updateProfile(request.user!.id, updateProfileSchema.parse(request.body));
  response.json({ success: true, user });
}