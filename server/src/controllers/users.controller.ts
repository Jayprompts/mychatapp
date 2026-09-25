import type { RequestHandler } from 'express';
import { z } from 'zod';
import { USER_SUMMARY_FIELDS, User, toUserSummary } from '../models/User.js';
import { authUser } from '../middleware/auth.js';
import { isOnline } from '../services/presence.js';
import { AppError } from '../utils/AppError.js';
import { userSearchQuerySchema } from '../validators/chat.schemas.js';

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /api/users/search?q=jay — people to start a chat with (username prefix or name match).
export const searchUsers: RequestHandler = async (req, res) => {
  const parsed = userSearchQuerySchema.safeParse(req.query);
  if (!parsed.success) throw new AppError(400, 'Validation failed', z.flattenError(parsed.error).fieldErrors);

  const me = authUser(req);
  const pattern = escapeRegex(parsed.data.q.replace(/^@/, ''));

  const users = await User.find({
    _id: { $ne: me._id },
    status: 'active',
    $or: [{ username: { $regex: `^${pattern}`, $options: 'i' } }, { displayName: { $regex: pattern, $options: 'i' } }],
  })
    .select(USER_SUMMARY_FIELDS)
    .sort({ username: 1 })
    .limit(20);

  res.json({ success: true, data: { users: users.map((u) => toUserSummary(u, isOnline(u._id.toString()))) } });
};
