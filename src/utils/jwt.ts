import jwt from 'jsonwebtoken';

import { env } from '../config/env.js';
import { Role } from '@prisma/client';

export type AuthTokenPayload = {
  sub: string;
  role: Role;
};

export function signAccessToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): AuthTokenPayload {
  const payload = jwt.verify(token, env.JWT_SECRET);
  if (typeof payload !== 'object' || typeof payload.sub !== 'string' || !isRole(payload.role)) {
    throw new Error('Invalid token payload');
  }
  return { sub: payload.sub, role: payload.role };
}

function isRole(value: unknown): value is Role {
  return value === Role.ADMIN || value === Role.STORE_OWNER;
}
