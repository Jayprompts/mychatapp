import { rateLimit } from 'express-rate-limit';

const tooMany = (message: string) => ({
  standardHeaders: 'draft-8' as const,
  legacyHeaders: false,
  handler: (_req: unknown, res: import('express').Response) => {
    res.status(429).json({ success: false, error: { message } });
  },
});

// Login: 10 failed attempts per 15 min per IP (successful logins don't count).
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  ...tooMany('Too many login attempts. Try again in 15 minutes.'),
});

// Register: 5 accounts per hour per IP.
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  ...tooMany('Too many accounts created from this network. Try again later.'),
});

// New blog posts (drafts included): 30 per hour per IP — stops scripted spam, never bothers a writer.
export const postWriteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 30,
  ...tooMany("You're creating posts too quickly. Try again in a while."),
});
