import path from 'node:path';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z.string().startsWith('mongodb', 'MONGODB_URI must be a MongoDB connection string'),
  CLIENT_URL: z.url(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_DAYS: z.coerce.number().int().positive().default(7),
  UPLOADS_DIR: z.string().optional(), // default: server/uploads
  // Sign in with Google / GitHub (Phase 9). Each is optional: without its keys, that button just doesn't show.
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  // Tests only: send the OAuth flow to a local fake provider instead of Google/GitHub. Ignored in production.
  OAUTH_MOCK_URL: z.url().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:\n' + z.prettifyError(parsed.error));
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === 'production';

// Voice notes and photos live here (never in Git, never touched by deploys).
// From src/config (dev) or dist/config (prod), ../../uploads is server/uploads.
export const uploadsDir = path.resolve(env.UPLOADS_DIR ?? path.resolve(import.meta.dirname, '../../uploads'));
