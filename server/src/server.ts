import http from 'node:http';
import { app } from './app.js';
import { env } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';

// A raw HTTP server (instead of app.listen) so Socket.io can share it in Phase 3
const server = http.createServer(app);

async function start() {
  try {
    await connectDB();
    server.listen(env.PORT, () => {
      console.log(`🚀 Grove API on http://localhost:${env.PORT} [${env.NODE_ENV}]`);
    });
  } catch (err) {
    console.error('❌ Failed to start:', err);
    process.exit(1);
  }
}

function shutdown(signal: string) {
  console.log(`\n${signal} received — shutting down gracefully…`);
  server.close(async () => {
    await disconnectDB();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref(); // force-quit if it hangs
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

void start();