import type { RequestHandler } from 'express';
import { env } from '../config/env.js';
import { authUser } from '../middleware/auth.js';
import { PushSubscription } from '../models/PushSubscription.js';
import { isAllowedEndpoint, pushEnabled } from '../services/push.js';
import { AppError } from '../utils/AppError.js';
import type { PushSubscriptionInput } from '../validators/push.schemas.js';

const MAX_DEVICES = 10; // per person — the oldest drops off

// GET /api/push/key — the public key browsers need to subscribe (null = push isn't set up on this server)
export const publicKey: RequestHandler = (_req, res) => {
  res.json({ success: true, data: { publicKey: pushEnabled ? env.VAPID_PUBLIC_KEY : null } });
};

// POST /api/push/subscriptions { endpoint, keys: { p256dh, auth } } — this device wants push notifications.
// The same browser signing in as someone else simply moves the subscription to them.
export const subscribe: RequestHandler = async (req, res) => {
  if (!pushEnabled) throw new AppError(503, 'Push notifications aren’t set up on this server');
  const me = authUser(req);
  const { endpoint, keys } = req.body as PushSubscriptionInput;
  if (!isAllowedEndpoint(endpoint)) throw new AppError(400, 'That push service isn’t supported');

  await PushSubscription.findOneAndUpdate(
    { endpoint },
    { $set: { user: me._id, keys, userAgent: (req.get('user-agent') ?? '').slice(0, 300) } },
    { upsert: true },
  );
  const extra = await PushSubscription.find({ user: me._id }).sort({ updatedAt: -1 }).skip(MAX_DEVICES).select('_id');
  if (extra.length) await PushSubscription.deleteMany({ _id: { $in: extra.map((s) => s._id) } });
  res.status(201).json({ success: true, data: { subscribed: true } });
};

// DELETE /api/push/subscriptions { endpoint } — switched off on this device (or signing out of it)
export const unsubscribe: RequestHandler = async (req, res) => {
  const me = authUser(req);
  const { endpoint } = req.body as { endpoint: string };
  await PushSubscription.deleteOne({ endpoint, user: me._id });
  res.json({ success: true, data: { subscribed: false } });
};
