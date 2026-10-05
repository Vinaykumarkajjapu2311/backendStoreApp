import type { Request, Response } from 'express';

import { changePasswordSchema, loginSchema } from './auth.schema.js';
import { changePassword, getAuthenticatedUser, login } from './auth.service.js';

export async function loginController(request: Request, response: Response) {
  const input = loginSchema.parse(request.body);
  const result = await login(input);
  response.json({ success: true, data: result });
}

export async function meController(request: Request, response: Response) {
  const user = await getAuthenticatedUser(request.user!.id);
  response.json({ success: true, data: { user } });
}

export async function changePasswordController(request: Request, response: Response) {
  await changePassword(request.user!.id, changePasswordSchema.parse(request.body));
  response.json({ success: true, message: 'Password changed successfully' });
}
