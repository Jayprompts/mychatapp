import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { env, isProd } from './config/env.js';
import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/users.routes.js';
import conversationRoutes from './routes/conversations.routes.js';
import { notFound, errorHandler } from './middleware/error.js';

export const app = express();

app.set('trust proxy', 1); // behind Nginx in production (correct client IPs for rate limiting)

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'], // React inline styles + Inter font CSS
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        imgSrc: ["'self'", 'data:', 'blob:', 'https:'], // https: for OAuth profile pictures later
        mediaSrc: ["'self'", 'blob:'], // voice notes (Phase 4)
        connectSrc: ["'self'"], // API + Socket.io (same origin, incl. wss:)
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        upgradeInsecureRequests: isProd ? [] : null,
      },
    },
  }),
);
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
if (!isProd) app.use(morgan('dev'));

// ── API routes ──────────────────────────────────────
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/conversations', conversationRoutes);

// ── React app (production) ──────────────────────────
// One process serves the API, Socket.io and the built client from the same domain.
// In development Vite serves the client instead, so this is skipped.
// Layout on the server: <site>/server/dist/app.js and <site>/client/dist/index.html
const clientDist = path.resolve(import.meta.dirname, '../../client/dist');
const indexHtml = path.join(clientDist, 'index.html');

if (isProd && fs.existsSync(indexHtml)) {
  // Hashed build files (/assets/index-3f9a.js) never change -> cache for a year.
  app.use('/assets', express.static(path.join(clientDist, 'assets'), { immutable: true, maxAge: '1y', fallthrough: false }));
  // Everything else in client/dist (favicon, manifest, og-image…) -> cache for a day.
  app.use(express.static(clientDist, { index: false, maxAge: '1d' }));

  // Any other GET/HEAD that isn't an API call is a page of the React app (/chats/123, /profile…).
  app.use((req, res, next) => {
    if ((req.method !== 'GET' && req.method !== 'HEAD') || req.path.startsWith('/api/')) return next();
    res.setHeader('Cache-Control', 'no-cache'); // always pick up a new deploy
    res.sendFile(indexHtml);
  });
}

// ── Fallbacks ───────────────────────────────────────
app.use(notFound);
app.use(errorHandler);
