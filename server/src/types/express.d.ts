import type { UserDoc } from '../models/User.js';

// Adds `req.user` (set by requireAuth) to Express's Request type everywhere.
declare global {
  namespace Express {
    interface Request {
      user?: UserDoc;
    }
  }
}

export {};
