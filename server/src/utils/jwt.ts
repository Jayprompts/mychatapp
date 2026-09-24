import jwt from 'jsonwebtoken';
import type { CookieOptions } from 'express';
import { env, isProd } from '../config/env.js';

export const AUTH_COOKIE = 'grove_token';

const MAX_AGE_SECONDS = env.JWT_EXPIRES_DAYS * 24 * 60 * 60;

export type TokenPayload = {
  sub: string; // user id
  tv: number; // token version
};

export function signToken(userId: string, tokenVersion: number): string {
  const payload: TokenPayload = { sub: userId, tv: tokenVersion };
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: MAX_AGE_SECONDS });
}

export function verifyToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET);
  if (typeof decoded === 'string' || typeof decoded.sub !== 'string' || typeof decoded.tv !== 'number') {
    throw new Error('Malformed token payload');
  }
  return { sub: decoded.sub, tv: decoded.tv };
}

const baseCookie: CookieOptions = {
  httpOnly: true, // JS can't read it -> XSS can't steal it
  secure: isProd, // HTTPS-only in production
  sameSite: 'lax', // not sent on cross-site POSTs -> CSRF protection
  path: '/',
};

export const authCookieOptions: CookieOptions = { ...baseCookie, maxAge: MAX_AGE_SECONDS * 1000 };
export const clearCookieOptions: CookieOptions = baseCookie;
