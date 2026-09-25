import type { Request, RequestHandler } from 'express';
import { User, type Role, type UserDoc } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { AUTH_COOKIE, verifyToken } from '../utils/jwt.js';

// Web sends the httpOnly cookie; mobile (Expo) / Postman can send "Authorization: Bearer <token>".
function extractToken(req: Request): string | null {
  const cookieToken: unknown = req.cookies?.[AUTH_COOKIE];
  if (typeof cookieToken === 'string' && cookieToken) return cookieToken;

  const header = req.get('authorization');
  if (header?.startsWith('Bearer ')) return header.slice(7).trim() || null;

  return null;
}

// Shared by REST (requireAuth) and Socket.io: token -> active user, or throws 401/403.
// A fresh DB read each time means bans, role changes and logout-all apply immediately.
export async function authenticateToken(token: string): Promise<UserDoc> {
  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    throw new AppError(401, 'Session expired or invalid — please log in again');
  }

  const user = await User.findById(payload.sub).select('+tokenVersion');
  if (!user || user.tokenVersion !== payload.tv) {
    throw new AppError(401, 'Session expired or invalid — please log in again');
  }
  if (user.status !== 'active') {
    throw new AppError(403, `Your account is ${user.status}`);
  }
  return user;
}

export const requireAuth: RequestHandler = async (req, _res, next) => {
  const token = extractToken(req);
  if (!token) throw new AppError(401, 'Not authenticated');

  req.user = await authenticateToken(token);
  next();
};

// Use AFTER requireAuth. super_admin always passes.
export const requireRole =
  (...roles: Role[]): RequestHandler =>
  (req, _res, next) => {
    const role = req.user?.role;
    if (!role) throw new AppError(401, 'Not authenticated');
    if (role !== 'super_admin' && !roles.includes(role)) {
      throw new AppError(403, 'You do not have permission to do this');
    }
    next();
  };

// For handlers behind requireAuth: returns req.user with a non-optional type.
export function authUser(req: Request): UserDoc {
  if (!req.user) throw new AppError(401, 'Not authenticated');
  return req.user;
}
