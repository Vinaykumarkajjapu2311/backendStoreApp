import argon2 from 'argon2';
import { Role } from '@prisma/client';

import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../utils/api-error.js';
import { signAccessToken } from '../../utils/jwt.js';
import type { ChangePasswordInput, LoginInput } from './auth.schema.js';

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { phone: input.phone } });

  if (!user) {
    throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid phone number or password');
  }

  if (!user.isActive) {
    throw new ApiError(403, 'ACCOUNT_INACTIVE', 'Your account is inactive. Please contact the administrator.');
  }

  const passwordMatches = await argon2.verify(user.passwordHash, input.password);
  if (!passwordMatches) {
    throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid phone number or password');
  }

  return {
    accessToken: signAccessToken({ sub: user.id, role: user.role }),
    user: toPublicUser(user),
  };
}

export async function getAuthenticatedUser(id: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user || !user.isActive) {
    throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');
  }
  return toPublicUser(user);
}

export async function changePassword(id: string, input: ChangePasswordInput) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user || !user.isActive) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');
  if (!(await argon2.verify(user.passwordHash, input.currentPassword))) throw new ApiError(400, 'INVALID_CURRENT_PASSWORD', 'Current password is incorrect');
  await prisma.user.update({ where: { id }, data: { passwordHash: await argon2.hash(input.newPassword) } });
}

function toPublicUser(user: { id: string; name: string; phone: string; role: Role; storeName?: string | null; address?: string | null; city?: string | null; state?: string | null; pincode?: string | null }) {
  return { id: user.id, name: user.name, phone: user.phone, role: user.role, storeName: user.storeName ?? null, address: user.address ?? null, city: user.city ?? null, state: user.state ?? null, pincode: user.pincode ?? null };
}
