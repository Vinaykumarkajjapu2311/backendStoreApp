import type { NextFunction, Request, Response } from 'express';
import { Role } from '@prisma/client';

import { ApiError } from '../utils/api-error.js';
import { verifyAccessToken } from '../utils/jwt.js';
import { prisma } from '../config/prisma.js';

export type AuthenticatedUser = { id: string; role: Role };

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export async function requireAuth(request: Request, _response: Response, next: NextFunction) {
  const header = request.header('authorization');
  const token = header?.startsWith('Bearer ') ? header.slice(7).trim() : null;

  if (!token) {
    next(new ApiError(401, 'UNAUTHORIZED', 'Authentication required'));
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.sub }, select: { role: true, isActive: true } });
    if (!user || !user.isActive) {
      next(new ApiError(401, 'UNAUTHORIZED', 'Authentication required'));
      return;
    }
    request.user = { id: payload.sub, role: user.role };
    next();
  } catch {
    next(new ApiError(401, 'UNAUTHORIZED', 'Invalid or expired token'));
  }
}

export function requireRole(...roles: Role[]) {
  return (request: Request, _response: Response, next: NextFunction) => {
    if (!request.user || !roles.includes(request.user.role)) {
      next(new ApiError(403, 'FORBIDDEN', 'You do not have permission to access this resource'));
      return;
    }
    next();
  };
}
