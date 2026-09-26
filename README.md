<p align="center">
  <img src="client/public/icon-512.png" alt="Grove logo" width="96" height="96" />
</p>

<h1 align="center">Grove</h1>

<p align="center">
  <strong>Chat, communities and a blog — in one real time web app.</strong><br />
  <a href="https://chat.mypromptspace.cloud">chat.mypromptspace.cloud</a>
</p>

---

Grove is a full-stack, real-time social platform: one-to-one and group messaging with voice notes and photos, public and private communities built around a shared chat, a blog with threaded comments, rich notifications (in-app, desktop and push), global search, and a role-based admin and moderation console. It is a responsive single-page app that works on phones, tablets and desktops, in light and dark mode.

## Features

**Messaging**
- One-to-one and group chats (up to 100 members) with owner/admin/member roles
- Text, voice notes (waveform, seek, playback speed) and photos with captions
- Replies, emoji reactions, edit (15 minutes), unsend, copy
- Typing indicators, online presence, “Seen” receipts and unread counts — all live
- Offline-friendly: messages written offline send automatically when the connection returns

**Communities**
- Discover by category and search; public communities join instantly
- Private communities with join requests, approvals and resettable invite links
- Cover photos, themes, roles and ownership transfer; every community has its own chat

**Blog**
- Editor with autosaving drafts, cover photo or gradient, photo gallery and a safe Markdown subset
- Feed sorted by Latest, Most liked or Trending; tags, likes, bookmarks
- Threaded comments with @mentions, live updates, and sharing into any chat

**Notifications & search**
- Grouped notifications (“Bob and 3 others liked your post”), live toasts, desktop alerts
- Web Push notifications when Grove is closed (desktop, Android, and iPhone from the Home Screen)
- Global search (⌘K / Ctrl+K) across people, your messages, posts and communities

**Accounts & privacy**
- Sign up with email/username and password, or continue with **Google** or **GitHub**
- Profiles with photo cropping; privacy controls (hide online status); blocking
- Sign-in methods, notification preferences, appearance (Light / Dark / System)
- Log out everywhere; full account deletion

**Administration**
- Roles: Super Admin, Content Moderator, Community Manager
- Dashboard, user management (suspend, ban, reactivate, delete — individually or in bulk), role management
- Reports queue with the reported content shown in context; blog and community management
- Complete audit log of every staff action

## Tech stack

| Layer | Technology |
|---|---|
| Client | React 19, TypeScript, Vite 8, Tailwind CSS v4, React Router 8, TanStack Query 5, React Hook Form + Zod |
| Server | Node.js 24, Express 5, TypeScript, Socket.io 4, Zod 4 |
| Database | MongoDB Atlas with Mongoose 9 |
| Media | Multer, file-type, Sharp (WebP re-encoding, metadata stripping) |
| Auth | httpOnly JWT cookies (Bearer tokens for API clients), bcrypt, OAuth 2.0 + PKCE for Google and GitHub |
| Push | Web Push (VAPID) with a service worker |
| Hosting | VPS with CloudPanel (Nginx, Let’s Encrypt), PM2, GitHub Actions CI/CD |

## Architecture

```
Browser (React SPA + service worker)
        │  HTTPS / WSS (same origin)
        ▼
Nginx (TLS, WebSocket upgrade)
        ▼
Node.js — one PM2 process
  ├─ Express REST API  (/api/*)
  ├─ Socket.io         (real-time events)
  └─ Static client     (client/dist)
        │                      │
        ▼                      ▼
  MongoDB Atlas          server/uploads (private media)
```

Writes go through the REST API (validated, rate-limited, authorised on the server); the server then pushes real-time events to the affected users over Socket.io, and Web Push to users who have Grove closed.

## Getting started

### Prerequisites

- Node.js 24 and npm
- A MongoDB database (MongoDB Atlas recommended) with a user limited to the app’s database
- Optional: Google and/or GitHub OAuth apps, and VAPID keys for push notifications

### 1. Clone and install

```bash
git clone https://github.com/Jayprompts/mychatapp.git
cd mychatapp
(cd server && npm install)
(cd client && npm install)
```

### 2. Configure the server

```bash
cp server/.env.example server/.env
```

Fill in `server/.env`:

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | yes | MongoDB connection string, including the database name |
| `CLIENT_URL` | yes | The app’s origin (`http://localhost:5173` in development) |
| `JWT_SECRET` | yes | A random secret of at least 32 characters |
| `PORT`, `NODE_ENV`, `JWT_EXPIRES_DAYS` | no | Defaults: `4000`, `development`, `7` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | no | Enables “Continue with Google” |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | no | Enables “Continue with GitHub” |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` | no | Enables push notifications (`npx web-push generate-vapid-keys`) |

Generate a JWT secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

OAuth redirect URIs to register with the providers: `<CLIENT_URL>/api/auth/google/callback` and `<CLIENT_URL>/api/auth/github/callback`.

### 3. Run in development

```bash
cd server && npm run dev     # API + Socket.io on http://localhost:4000
cd client && npm run dev     # app on http://localhost:5173 (proxies /api and /socket.io)
```

Create your first Super Admin after registering an account:

```bash
cd server && npm run make-admin -- you@example.com
```

## Scripts

| Location | Command | Purpose |
|---|---|---|
| `server/` | `npm run dev` | Development server with reload |
| `server/` | `npm run build` / `npm start` | Compile to `dist/` / run the compiled server |
| `server/` | `npm run typecheck` | Type-check without emitting |
| `server/` | `npm run make-admin -- <email>` | Promote an account to Super Admin (`make-admin:prod` in production) |
| `client/` | `npm run dev` | Vite development server |
| `client/` | `npm run build` | Type-check and build to `client/dist/` |
| `client/` | `npm run lint` | ESLint |

## Project structure

```
mychatapp/
├── client/                 React app (features/, pages/, components/, lib/)
│   └── public/             icons, manifest, theme bootstrap, service worker
├── server/                 Express + Socket.io API
│   └── src/                config, middleware, validators, routes, controllers, services, models, sockets
├── ops/                    backup.sh and restore.sh
└── .github/workflows/      deploy.yml (CI/CD)
```

## Deployment

Every push to `main` runs the GitHub Actions workflow, which:

1. Lints, type-checks and builds the client and the server
2. Uploads the release to the VPS over SSH (never touching `server/.env`, installed packages or uploaded media)
3. Installs production dependencies, reloads the PM2 process and waits for `/api/health` to report healthy

If any build step fails, nothing is deployed and the live site keeps running the previous version. The production `.env` lives only on the server.

## Backups

`ops/backup.sh` backs up the database (`mongodump`) and uploaded media (space-efficient snapshots) and keeps the four most recent copies; it runs weekly via cron. `ops/restore.sh` lists backups, verifies an archive without writing anything (`check`), and restores the database or media after taking a safety backup first.

## Security

- Passwords hashed with bcrypt; login resistant to user enumeration and brute force (rate limits)
- httpOnly, Secure, SameSite cookies; sessions revocable on every device
- Role and resource checks enforced on the server for every request
- Input validation on every endpoint; no user-supplied HTML is ever rendered
- Strict Content-Security-Policy and security headers
- Uploads verified by their content, re-encoded and served only to authorised users
- OAuth with state and PKCE; accounts linked only through provider-verified emails
- Encrypted, signed push notifications sent only to genuine push services
- Audit log of all administrative actions

## Quality

Grove was built phase by phase, each phase verified by automated API and real-browser test suites — 31 suites and 753 checks, all passing at the latest release — plus accessibility audits (WCAG 2 AA, light and dark themes).

## Roadmap

- Email verification and password reset
- Two-factor authentication
- Pin, mute and archive conversations; message forwarding
- Mobile apps (the API already supports token-based clients)

## License

All rights reserved. Contact the maintainer for usage permissions.
