import type { RequestHandler } from 'express';
import { z } from 'zod';
import { Notification } from '../models/Notification.js';
import { toPublicUser } from '../models/User.js';
import { authUser } from '../middleware/auth.js';
import { buildNotificationViews, unreadCount } from '../services/notifications.js';
import { emitToUsers } from '../sockets/index.js';
import { AppError } from '../utils/AppError.js';
import { parseObjectId } from '../utils/objectId.js';

const listQuery = z.object({
  before: z.iso.datetime().optional(), // updatedAt of the last one you have
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

// GET /api/notifications?before=&limit= — newest activity first
export const list: RequestHandler = async (req, res) => {
  const me = authUser(req)._id;
  const parsed = listQuery.safeParse(req.query);
  if (!parsed.success) throw new AppError(400, 'Validation failed', z.flattenError(parsed.error).fieldErrors);
  const { before, limit } = parsed.data;

  const docs = await Notification.find({ recipient: me, ...(before ? { updatedAt: { $lt: new Date(before) } } : {}) })
    .sort({ updatedAt: -1 })
    .limit(limit + 1);
  res.json({
    success: true,
    data: { notifications: await buildNotificationViews(docs.slice(0, limit)), hasMore: docs.length > limit, unreadCount: await unreadCount(me) },
  });
};

// GET /api/notifications/unread-count
export const count: RequestHandler = async (req, res) => {
  res.json({ success: true, data: { unreadCount: await unreadCount(authUser(req)._id) } });
};

// POST /api/notifications/:id/read · POST /api/notifications/read-all — other tabs/devices update too
export const markRead: RequestHandler = async (req, res) => {
  const me = authUser(req)._id;
  await Notification.updateOne({ _id: parseObjectId(req.params.id, 'notification id'), recipient: me, readAt: null }, { $set: { readAt: new Date() } });
  const n = await unreadCount(me);
  emitToUsers([me.toString()], 'notifications:changed', { unreadCount: n });
  res.json({ success: true, data: { unreadCount: n } });
};

export const markAllRead: RequestHandler = async (req, res) => {
  const me = authUser(req)._id;
  await Notification.updateMany({ recipient: me, readAt: null }, { $set: { readAt: new Date() } });
  emitToUsers([me.toString()], 'notifications:changed', { unreadCount: 0 });
  res.json({ success: true, data: { unreadCount: 0 } });
};

// PATCH /api/users/me/notifications { messages?, social?, communities? }
export const updatePrefs: RequestHandler = async (req, res) => {
  const me = authUser(req);
  const input = req.body as Partial<Record<'messages' | 'social' | 'communities', boolean>>;
  for (const [k, v] of Object.entries(input)) me.set(`notificationPrefs.${k}`, v);
  await me.save();
  res.json({ success: true, data: { user: toPublicUser(me) } });
};
