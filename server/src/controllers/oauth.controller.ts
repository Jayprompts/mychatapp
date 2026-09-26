import crypto from 'node:crypto';
import type { CookieOptions, RequestHandler, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env, isProd } from '../config/env.js';
import { accountBlockedMessage, authUser, authenticateToken } from '../middleware/auth.js';
import { User, toPublicUser, type UserDoc } from '../models/User.js';
import {
  OAUTH_PROVIDERS,
  authorizeUrl,
  configuredProviders,
  fetchProfile,
  importPicture,
  isConfigured,
  randomToken,
  suggestUsername,
  type OAuthProfile,
  type OAuthProvider,
} from '../services/oauth.js';
import { AppError } from '../utils/AppError.js';
import { AUTH_COOKIE, authCookieOptions, signToken } from '../utils/jwt.js';
import type { CompleteOAuthInput } from '../validators/auth.schemas.js';
import { sendAuth } from './auth.controller.js';

// Two short-lived, signed, httpOnly cookies scoped to /api/auth:
//   grove_oauth         state + PKCE verifier + where to go afterwards (10 min, one use)
//   grove_oauth_signup  a verified Google/GitHub profile waiting for its username (30 min)
const FLOW_COOKIE = 'grove_oauth';
const SIGNUP_COOKIE = 'grove_oauth_signup';
const cookie = (minutes: number): CookieOptions => ({ httpOnly: true, secure: isProd, sameSite: 'lax', path: '/api/auth', maxAge: minutes * 60_000 });
const clearOpts: CookieOptions = { httpOnly: true, secure: isProd, sameSite: 'lax', path: '/api/auth' };

type Flow = { p: OAuthProvider; s: string; v: string; n: string; l?: string }; // l = connecting to this signed-in user
type Pending = Omit<OAuthProfile, 'handle'> & { suggestion: string; next: string };

const sign = (payload: object, minutes: number) => jwt.sign(payload, env.JWT_SECRET, { expiresIn: minutes * 60 });
function read<T>(token: unknown): T | null {
  if (typeof token !== 'string') return null;
  try {
    return jwt.verify(token, env.JWT_SECRET) as T;
  } catch {
    return null;
  }
}

const app = (path: string) => `${env.CLIENT_URL.replace(/\/$/, '')}${path}`;
// Only our own pages: "/chats/123" yes; "//evil.com", "https://…" or the API no.
const safeNext = (n: unknown) => (typeof n === 'string' && /^\/(?!\/)/.test(n) && !n.startsWith('/api') && n.length < 300 ? n : '/chats');
const fail = (res: Response, code: string, message?: string, page = '/login') =>
  res.redirect(app(`${page}?${new URLSearchParams({ oauth_error: code, ...(message ? { oauth_message: message } : {}) })}`));
const signedInUser = (req: { cookies?: Record<string, string> }) =>
  req.cookies?.[AUTH_COOKIE] ? authenticateToken(req.cookies[AUTH_COOKIE]).catch(() => null) : Promise.resolve(null);
const field = (p: OAuthProvider) => (p === 'google' ? 'googleId' : 'githubId');
const provider = (p: unknown): OAuthProvider | null => (OAUTH_PROVIDERS.includes(p as OAuthProvider) ? (p as OAuthProvider) : null);

// GET /api/auth/providers — which buttons to show
export const providers: RequestHandler = (_req, res) => {
  res.json({ success: true, data: { providers: configuredProviders() } });
};

// GET /api/auth/:provider?next=/somewhere — off to Google/GitHub
// GET /api/auth/:provider?link=1 — Settings ▸ "Connect": add it to the signed-in account
export const start: RequestHandler = async (req, res) => {
  const p = provider(req.params.provider);
  if (!p || !isConfigured(p)) return fail(res, 'unavailable');
  const flow: Flow = { p, s: randomToken(), v: randomToken(), n: safeNext(req.query.next) };
  if (req.query.link === '1') {
    const me = await signedInUser(req);
    if (!me) return fail(res, 'expired');
    flow.l = me._id.toString();
  }
  res.cookie(FLOW_COOKIE, sign(flow, 10), cookie(10));
  res.redirect(authorizeUrl(p, flow.s, flow.v));
};

// GET /api/auth/:provider/callback?code&state — back from Google/GitHub
export const callback: RequestHandler = async (req, res) => {
  const p = provider(req.params.provider);
  const flow = read<Flow>(req.cookies?.[FLOW_COOKIE]);
  res.clearCookie(FLOW_COOKIE, clearOpts); // one use only
  if (!p || !isConfigured(p)) return fail(res, 'unavailable');
  if (req.query.error) return fail(res, 'cancelled'); // they pressed Cancel on the provider's page
  const { code, state } = req.query;
  // CSRF: the state we set in *this* browser must come back unchanged.
  const stateOk =
    !!flow && flow.p === p && typeof state === 'string' && state.length === flow.s.length && crypto.timingSafeEqual(Buffer.from(state), Buffer.from(flow.s));
  if (!stateOk || typeof code !== 'string') return fail(res, 'expired');

  let profile: OAuthProfile;
  try {
    profile = await fetchProfile(p, code, flow.v);
  } catch (err) {
    console.error(`OAuth ${p} failed:`, (err as Error).message);
    return fail(res, 'failed');
  }

  // Settings ▸ Connect: attach to the account that started it (still signed in, same person).
  if (flow.l) {
    const me = await signedInUser(req);
    if (!me || me._id.toString() !== flow.l) return fail(res, 'expired', undefined, '/settings');
    if (await User.exists({ [field(p)]: profile.id, _id: { $ne: me._id } })) return fail(res, 'linked_elsewhere', undefined, '/settings');
    me.set(field(p), profile.id);
    if (!me.avatarUrl) await setPicture(me, profile.picture);
    await me.save();
    return res.redirect(app(`/settings?connected=${p}`));
  }

  // 1) Signed in with this Google/GitHub account before.
  let user: UserDoc | null = await User.findOne({ [field(p)]: profile.id }).select('+tokenVersion');
  // 2) Same email as an existing account — link it, but only if the provider has verified that email
  //    (otherwise anyone could claim an account by typing its email into a new Google/GitHub account).
  if (!user && profile.email && profile.emailVerified) {
    user = await User.findOne({ email: profile.email, status: { $ne: 'deleted' } }).select('+tokenVersion');
    if (user) {
      user.set(field(p), profile.id);
      user.emailVerified = true;
      if (!user.avatarUrl) await setPicture(user, profile.picture);
      await user.save();
    }
  }
  if (user) {
    if (user.status !== 'active') return fail(res, 'blocked', accountBlockedMessage(user));
    res.cookie(AUTH_COOKIE, signToken(user._id.toString(), user.tokenVersion ?? 0), authCookieOptions);
    return res.redirect(app(flow.n));
  }

  // 3) New to Grove: they choose a username first.
  if (!profile.email) return fail(res, 'no_email');
  if (await User.exists({ email: profile.email })) return fail(res, 'email_in_use');
  const { handle: _handle, ...rest } = profile;
  const pending: Pending = { ...rest, suggestion: await suggestUsername(profile), next: flow.n };
  res.cookie(SIGNUP_COOKIE, sign(pending, 30), cookie(30));
  res.redirect(app('/welcome/username'));
};

// GET /api/auth/oauth/pending — the "Choose your username" screen's data
export const pending: RequestHandler = (req, res) => {
  const p = read<Pending>(req.cookies?.[SIGNUP_COOKIE]);
  if (!p) throw new AppError(404, 'That sign-in has expired — please start again');
  res.json({ success: true, data: { provider: p.provider, email: p.email, name: p.name, picture: p.picture, suggestion: p.suggestion, next: p.next } });
};

// POST /api/auth/oauth/complete { username, displayName? } — create the account and sign in
export const complete: RequestHandler = async (req, res) => {
  const p = read<Pending>(req.cookies?.[SIGNUP_COOKIE]);
  if (!p || !p.email) throw new AppError(404, 'That sign-in has expired — please start again');
  const { username, displayName } = req.body as CompleteOAuthInput;

  // Pressed twice / two tabs: the account already exists → just sign in.
  const existing = await User.findOne({ [field(p.provider)]: p.id }).select('+tokenVersion');
  if (existing) {
    res.clearCookie(SIGNUP_COOKIE, clearOpts);
    return sendAuth(req, res, existing, 200);
  }
  if (await User.exists({ username })) {
    throw new AppError(409, 'That username is already taken', { username: ['That username is already taken'] });
  }
  if (await User.exists({ email: p.email })) throw new AppError(409, 'An account with this email already exists — log in instead');

  const user = new User({
    username,
    displayName: displayName || p.name.slice(0, 50),
    email: p.email,
    emailVerified: p.emailVerified,
    authProvider: p.provider,
    [field(p.provider)]: p.id,
  });
  await setPicture(user, p.picture);
  await user.save();
  res.clearCookie(SIGNUP_COOKIE, clearOpts);
  sendAuth(req, res, user, 201);
};

async function setPicture(user: UserDoc, url: string | null) {
  const key = await importPicture(url);
  if (!key) return;
  user.avatarKey = key;
  user.avatarUrl = `/api/users/${user._id.toString()}/avatar?v=${Date.now()}`;
}

// DELETE /api/users/me/providers/:provider — Settings ▸ Disconnect (never the last way to sign in)
export const unlink: RequestHandler = async (req, res) => {
  const p = provider(req.params.provider);
  if (!p) throw new AppError(404, 'Not found');
  const me = await User.findById(authUser(req)._id).select('+passwordHash');
  if (!me) throw new AppError(404, 'Not found');
  const others = [!!me.passwordHash, p !== 'google' && !!me.googleId, p !== 'github' && !!me.githubId].filter(Boolean).length;
  if (!others) throw new AppError(400, 'This is your only way to sign in — you can’t disconnect it');
  me.set(field(p), undefined);
  await me.save();
  res.json({ success: true, data: { user: toPublicUser(me) } });
};
