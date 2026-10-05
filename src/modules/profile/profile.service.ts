import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../utils/api-error.js';
import type { UpdateProfileInput } from './profile.schema.js';

const profileSelect = {
  id: true,
  name: true,
  phone: true,
  role: true,
  storeName: true,
  address: true,
  city: true,
  state: true,
  pincode: true,
} as const;

export async function getProfile(id: string) {
  const user = await prisma.user.findFirst({ where: { id, isActive: true }, select: profileSelect });
  if (!user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');
  return user;
}

export async function updateProfile(id: string, input: UpdateProfileInput) {
  await getProfile(id);
  return prisma.user.update({ where: { id }, data: input, select: profileSelect });
}