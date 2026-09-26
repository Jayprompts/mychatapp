import crypto from 'node:crypto';
import { env, isProd } from '../config/env.js';
import { User } from '../models/User.js';
import { storeAvatar } from './media.js';

// Sign in with Google / GitHub: the standard OAuth 2.0 "authorization code" flow, by hand (no sessions
// needed): state + PKCE live in a short-lived signed cookie, the code is swapped for a token server-side,
// and only the provider's verified profile ever reaches our database.

export const OAUTH_PROVIDERS = ['google', 'github'] as const;
export type OAuthProvider = (typeof OAUTH_PROVIDERS)[number];

export type OAuthProfile = {
  provider: OAuthProvider;
  id: string; // the provider's stable id for this person
  email: string | null; // null when the provider has no verified email for them
  emailVerified: boolean;
  name: string;
  handle: string | null; // GitHub login — a good username suggestion
  picture: string | null;
};

// Tests point the whole flow at a local fake provider; production always talks to the real ones.
const mock = !isProd && env.OAUTH_MOCK_URL ? env.OAUTH_MOCK_URL.replace(/\/$/, '') : null;

const PROVIDERS = {
  google: {
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
    authorizeUrl: mock ? `${mock}/google/auth` : 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: mock ? `${mock}/google/token` : 'https://oauth2.googleapis.com/token',
    scope: 'openid email profile',
    extra: { prompt: 'select_account' }, // let people pick which Google account
  },
  github: {
    clientId: env.GITHUB_CLIENT_ID,
    clientSecret: env.GITHUB_CLIENT_SECRET,
    authorizeUrl: mock ? `${mock}/github/authorize` : 'https://github.com/login/oauth/authorize',
    tokenUrl: mock ? `${mock}/github/token` : 'https://github.com/login/oauth/access_token',
    scope: 'read:user user:email',
    extra: {},
  },
} as const;

const API = {
  googleUser: mock ? `${mock}/google/userinfo` : 'https://openidconnect.googleapis.com/v1/userinfo',
  githubUser: mock ? `${mock}/github/user` : 'https://api.github.com/user',
  githubEmails: mock ? `${mock}/github/emails` : 'https://api.github.com/user/emails',
};

export const isConfigured = (p: OAuthProvider) => !!(PROVIDERS[p].clientId && PROVIDERS[p].clientSecret);
export const configuredProviders = () => OAUTH_PROVIDERS.filter(isConfigured);

// Must match the redirect URI registered with the provider exactly.
export const callbackUrl = (p: OAuthProvider) => `${env.CLIENT_URL.replace(/\/$/, '')}/api/auth/${p}/callback`;

const base64url = (buf: Buffer) => buf.toString('base64url');
export const randomToken = () => base64url(crypto.randomBytes(32));
const challengeFor = (verifier: string) => base64url(crypto.createHash('sha256').update(verifier).digest());

export function authorizeUrl(p: OAuthProvider, state: string, verifier: string) {
  const cfg = PROVIDERS[p];
  const params = new URLSearchParams({
    client_id: cfg.clientId!,
    redirect_uri: callbackUrl(p),
    response_type: 'code',
    scope: cfg.scope,
    state,
    code_challenge: challengeFor(verifier),
    code_challenge_method: 'S256',
    ...cfg.extra,
  });
  return `${cfg.authorizeUrl}?${params}`;
}

async function getJson<T>(url: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`${new URL(url).host} answered ${res.status}`);
  return (await res.json()) as T;
}

// Code → access token → the person's profile.
export async function fetchProfile(p: OAuthProvider, code: string, verifier: string): Promise<OAuthProfile> {
  const cfg = PROVIDERS[p];
  const token = await getJson<{ access_token?: string; error?: string }>(cfg.tokenUrl, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: callbackUrl(p),
      client_id: cfg.clientId!,
      client_secret: cfg.clientSecret!,
      code_verifier: verifier,
    }),
  });
  if (!token.access_token) throw new Error(`No access token (${token.error ?? 'unknown error'})`);
  const auth = { Authorization: `Bearer ${token.access_token}`, 'User-Agent': 'Grove', Accept: 'application/json' };

  if (p === 'google') {
    const u = await getJson<{ sub: string; email?: string; email_verified?: boolean; name?: string; picture?: string }>(API.googleUser, { headers: auth });
    return {
      provider: p,
      id: u.sub,
      email: u.email?.toLowerCase() ?? null,
      emailVerified: u.email_verified === true,
      name: u.name || u.email?.split('@')[0] || 'Grove user',
      handle: null,
      picture: u.picture ? u.picture.replace(/=s\d+-c$/, '=s512-c') : null, // ask for a bigger photo
    };
  }

  const u = await getJson<{ id: number; login: string; name?: string | null; avatar_url?: string }>(API.githubUser, { headers: auth });
  // The profile's email may be hidden; the emails list has the primary one and whether it's verified.
  const emails = await getJson<{ email: string; primary: boolean; verified: boolean }[]>(API.githubEmails, { headers: auth }).catch(() => []);
  const best = emails.find((e) => e.primary && e.verified) ?? emails.find((e) => e.verified) ?? null;
  return {
    provider: p,
    id: String(u.id),
    email: best?.email.toLowerCase() ?? null,
    emailVerified: !!best,
    name: u.name || u.login,
    handle: u.login,
    picture: u.avatar_url ? `${u.avatar_url}${u.avatar_url.includes('?') ? '&' : '?'}s=512` : null,
  };
}

// A free username close to their handle / name / email (people can change it before continuing).
export async function suggestUsername(profile: OAuthProfile): Promise<string> {
  const raw = profile.handle ?? profile.email?.split('@')[0] ?? profile.name;
  let base = raw
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9_.]+/g, '')
    .replace(/^[._]+|[._]+$/g, '')
    .slice(0, 24);
  if (base.length < 3) base = `${base}user`.slice(0, 24);
  if (!(await User.exists({ username: base }))) return base;
  for (let i = 0; i < 20; i++) {
    const candidate = `${base}${Math.floor(10 + Math.random() * 9990)}`;
    if (!(await User.exists({ username: candidate }))) return candidate;
  }
  return `${base}${Date.now().toString(36)}`.slice(0, 30);
}

// Their Google/GitHub photo becomes their Grove photo (stored and resized like an upload). Best effort:
// a slow or odd image just means no photo yet.
export async function importPicture(url: string | null): Promise<string | null> {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && !(mock && url.startsWith(mock))) return null;
    const res = await fetch(url, { signal: AbortSignal.timeout(5_000) });
    if (!res.ok || !res.headers.get('content-type')?.startsWith('image/')) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > 5 * 1024 * 1024) return null;
    return await storeAvatar(buf);
  } catch {
    return null;
  }
}
