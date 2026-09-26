import type { Request, RequestHandler, Response } from 'express';
import { User, toPublicUser, type UserDoc } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { AUTH_COOKIE, authCookieOptions, clearCookieOptions, signToken } from '../utils/jwt.js';
import { accountBlockedMessage, authUser } from '../middleware/auth.js';
import { disconnectUser } from '../sockets/index.js';
import type { LoginInput, RegisterInput } from '../validators/auth.schemas.js';

// Sets the auth cookie. The raw token is only returned in the body when the client
// explicitly asks for it (mobile app / Postman Bearer testing) via "X-Auth-Mode: bearer" —
// browsers never see it, so the httpOnly protection isn't undermined.
export function sendAuth(req: Request, res: Response, user: UserDoc, status: number) {
  const token = signToken(user._id.toString(), user.tokenVersion ?? 0);
  res.cookie(AUTH_COOKIE, token, authCookieOptions);

  const wantsToken = req.get('x-auth-mode')?.toLowerCase() === 'bearer';
  res.status(status).json({
    success: true,
    data: { user: toPublicUser(user), ...(wantsToken ? { token } : {}) },
  });
}

export const register: RequestHandler = async (req, res) => {
  const { username, displayName, email, password } = req.body as RegisterInput;

  const existing = await User.findOne({ $or: [{ email }, { username }] }).select('email username');
  if (existing) {
    const field = existing.email === email ? 'email' : 'username';
    throw new AppError(409, `That ${field} is already taken`, { [field]: [`That ${field} is already taken`] });
  }

  const user = await User.create({
    username,
    displayName: displayName ?? username,
    email,
    passwordHash: await hashPassword(password),
    authProvider: 'local',
  });

  sendAuth(req, res, user, 201);
};

export const login: RequestHandler = async (req, res) => {
  const { identifier, password } = req.body as LoginInput;

  const user = await User.findOne(identifier.includes('@') ? { email: identifier } : { username: identifier }).select(
    '+passwordHash +tokenVersion',
  );

  // Always run the hash check (even with no user) so response time doesn't reveal which accounts exist.
  const ok = await verifyPassword(password, user?.passwordHash);
  if (user && !user.passwordHash && user.authProvider !== 'local' && user.status !== 'deleted') {
    const name = user.authProvider === 'google' ? 'Google' : 'GitHub';
    throw new AppError(401, `This account signs in with ${name} — use “Continue with ${name}”`);
  }
  if (!user || !ok) throw new AppError(401, 'Invalid email/username or password');
  if (user.status !== 'active') throw new AppError(403, accountBlockedMessage(user));

  sendAuth(req, res, user, 200);
};

export const me: RequestHandler = (req, res) => {
  res.json({ success: true, data: { user: toPublicUser(authUser(req)) } });
};

export const logout: RequestHandler = (_req, res) => {
  res.clearCookie(AUTH_COOKIE, clearCookieOptions);
  res.json({ success: true, data: { message: 'Logged out' } });
};

// Invalidates every token ever issued to this user (all devices), then clears this device's cookie.
export const logoutAll: RequestHandler = async (req, res) => {
  const userId = authUser(req)._id;
  await User.updateOne({ _id: userId }, { $inc: { tokenVersion: 1 } });
  disconnectUser(userId.toString()); // live sockets on other devices drop immediately
  res.clearCookie(AUTH_COOKIE, clearCookieOptions);
  res.json({ success: true, data: { message: 'Logged out on all devices' } });
};
