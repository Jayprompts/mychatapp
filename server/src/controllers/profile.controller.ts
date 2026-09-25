import type { RequestHandler } from 'express';
import { Block } from '../models/Block.js';
import { Conversation } from '../models/Conversation.js';
import { Post } from '../models/Post.js';
import { USER_SUMMARY_FIELDS, User, toPublicUser, toUserSummary } from '../models/User.js';
import { authUser } from '../middleware/auth.js';
import { deleteAccount } from '../services/account.js';
import { blockBetween } from '../services/blocks.js';
import { deleteMedia, mediaPath, storeAvatar } from '../services/media.js';
import { broadcastPresence, emitToUsers } from '../sockets/index.js';
import { isOnline } from '../services/presence.js';
import { AppError } from '../utils/AppError.js';
import { AUTH_COOKIE, clearCookieOptions } from '../utils/jwt.js';
import { parseObjectId } from '../utils/objectId.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import type { UpdateProfileInput } from '../validators/profile.schemas.js';
import { sendAuth } from './auth.controller.js';

const taken = (field: string) => new AppError(409, `That ${field} is already taken`, { [field]: [`That ${field} is already taken`] });

// Password-protected actions re-check the password (a stolen unlocked laptop shouldn't be enough).
async function requirePassword(userId: unknown, password: string) {
  const user = await User.findById(userId).select('+passwordHash +tokenVersion');
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw new AppError(400, 'That password is incorrect', { password: ['That password is incorrect'] });
  }
  return user;
}

// GET /api/users/:username — anyone's profile page
export const getProfile: RequestHandler = async (req, res) => {
  const me = authUser(req);
  const username = String(req.params.username).toLowerCase();
  const user = await User.findOne({ username, status: { $ne: 'deleted' } });
  if (!user) throw new AppError(404, 'User not found');
  const id = user._id;

  const [communities, posts, likes, block] = await Promise.all([
    Conversation.countDocuments({ type: 'community', 'members.user': id }),
    Post.countDocuments({ author: id, status: 'published' }),
    Post.aggregate<{ total: number }>([{ $match: { author: id, status: 'published' } }, { $group: { _id: null, total: { $sum: '$likeCount' } } }]),
    me._id.equals(id) ? null : blockBetween(me._id.toString(), id.toString()),
  ]);

  res.json({
    success: true,
    data: {
      profile: {
        ...toUserSummary(user, isOnline(id.toString())),
        bio: user.bio ?? '',
        website: user.website ?? '',
        location: user.location ?? '',
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        stats: { communities, posts, likes: likes[0]?.total ?? 0 },
        isMe: me._id.equals(id),
        blocked: block, // 'byMe' | 'byThem' | null
      },
    },
  });
};

// PATCH /api/users/me { displayName?, username?, bio?, website?, location? }
export const updateMe: RequestHandler = async (req, res) => {
  const me = authUser(req);
  const input = req.body as UpdateProfileInput;
  if (input.username && input.username !== me.username && (await User.exists({ username: input.username }))) throw taken('username');

  me.set(input);
  try {
    await me.save();
  } catch (err) {
    if ((err as { code?: number }).code === 11000) throw taken('username'); // lost a race for the same name
    throw err;
  }
  res.json({ success: true, data: { user: toPublicUser(me) } });
};

// POST /api/users/me/avatar (multipart "file") · DELETE /api/users/me/avatar
export const uploadAvatar: RequestHandler = async (req, res) => {
  const me = authUser(req);
  if (!req.file) throw new AppError(400, 'No file uploaded');
  const key = await storeAvatar(req.file.buffer);
  const old = me.avatarKey;
  me.avatarKey = key;
  me.avatarUrl = `/api/users/${me._id.toString()}/avatar?v=${Date.now()}`; // new URL each time, so caches refresh
  await me.save();
  if (old) await deleteMedia(old);
  res.json({ success: true, data: { user: toPublicUser(me) } });
};

export const removeAvatar: RequestHandler = async (req, res) => {
  const me = authUser(req);
  const old = me.avatarKey;
  me.avatarKey = null;
  me.avatarUrl = null;
  await me.save();
  if (old) await deleteMedia(old);
  res.json({ success: true, data: { user: toPublicUser(me) } });
};

// GET /api/users/:id/avatar — profile photos are visible to everyone signed in
export const getAvatar: RequestHandler = async (req, res, next) => {
  const user = await User.findById(parseObjectId(req.params.id, 'user id')).select('avatarKey');
  if (!user?.avatarKey) throw new AppError(404, 'Not found');
  res.setHeader('Cache-Control', 'private, max-age=31536000, immutable');
  res.type('image/webp');
  res.sendFile(mediaPath(user.avatarKey), (err) => err && !res.headersSent && next(new AppError(404, 'Not found')));
};

// PATCH /api/users/me/email { email, password }
export const changeEmail: RequestHandler = async (req, res) => {
  const me = authUser(req);
  const { email, password } = req.body as { email: string; password: string };
  const user = await requirePassword(me._id, password);
  if (email === user.email) throw new AppError(400, "That's already your email", { email: ["That's already your email"] });
  if (await User.exists({ email })) throw taken('email');

  user.email = email;
  user.emailVerified = false; // verification arrives with email sending
  await user.save();
  res.json({ success: true, data: { user: toPublicUser(user) } });
};

// PATCH /api/users/me/password { currentPassword, newPassword } — signs out every other device
export const changePassword: RequestHandler = async (req, res) => {
  const me = authUser(req);
  const { currentPassword, newPassword } = req.body as { currentPassword: string; newPassword: string };
  const user = await requirePassword(me._id, currentPassword);
  if (await verifyPassword(newPassword, user.passwordHash)) {
    throw new AppError(400, 'Choose a password you haven’t used here', { newPassword: ['That’s your current password'] });
  }
  user.passwordHash = await hashPassword(newPassword);
  user.passwordChangedAt = new Date();
  user.tokenVersion = (user.tokenVersion ?? 0) + 1; // other devices' tokens stop working
  await user.save();
  sendAuth(req, res, user, 200); // …but this one gets a fresh token and stays signed in
};

// PATCH /api/users/me/privacy { showOnlineStatus }
export const updatePrivacy: RequestHandler = async (req, res) => {
  const me = authUser(req);
  const { showOnlineStatus } = req.body as { showOnlineStatus: boolean };
  const was = me.showOnlineStatus !== false;
  me.showOnlineStatus = showOnlineStatus;
  await me.save();
  if (was && !showOnlineStatus) {
    await broadcastPresence(me._id.toString(), false, null, { force: true }); // contacts now see me as offline
  } else if (!was && showOnlineStatus && isOnline(me._id.toString())) {
    await broadcastPresence(me._id.toString(), true, null);
  }
  res.json({ success: true, data: { user: toPublicUser(me) } });
};

// GET /api/users/me/blocks · POST/DELETE /api/users/:id/block
export const listBlocks: RequestHandler = async (req, res) => {
  const me = authUser(req);
  const rows = await Block.find({ blocker: me._id }).sort({ createdAt: -1 });
  const users = await User.find({ _id: { $in: rows.map((r) => r.blocked) } }).select(USER_SUMMARY_FIELDS);
  const byId = new Map(users.map((u) => [u._id.toString(), u]));
  const blocked = rows
    .map((r) => byId.get(r.blocked.toString()))
    .filter((u) => !!u)
    .map((u) => toUserSummary(u, false));
  res.json({ success: true, data: { users: blocked } });
};

// Both sides' chat screens refresh (composer locks / unlocks).
async function notifyDirectChat(meId: string, otherId: string) {
  const c = await Conversation.findOne({ type: 'direct', 'members.user': { $all: [meId, otherId] } }).select('_id');
  if (c) emitToUsers([meId, otherId], 'conversation:updated', { conversationId: c._id.toString() });
}

export const block: RequestHandler = async (req, res) => {
  const me = authUser(req);
  const otherId = parseObjectId(req.params.id, 'user id');
  if (me._id.equals(otherId)) throw new AppError(400, "You can't block yourself");
  if (!(await User.exists({ _id: otherId, status: { $ne: 'deleted' } }))) throw new AppError(404, 'User not found');
  await Block.updateOne({ blocker: me._id, blocked: otherId }, { $setOnInsert: { blocker: me._id, blocked: otherId } }, { upsert: true });
  await notifyDirectChat(me._id.toString(), otherId);
  res.json({ success: true, data: { blocked: true } });
};

export const unblock: RequestHandler = async (req, res) => {
  const me = authUser(req);
  const otherId = parseObjectId(req.params.id, 'user id');
  await Block.deleteOne({ blocker: me._id, blocked: otherId });
  await notifyDirectChat(me._id.toString(), otherId);
  res.json({ success: true, data: { blocked: false } });
};

// DELETE /api/users/me { password, confirm: "DELETE" }
export const removeAccount: RequestHandler = async (req, res) => {
  const me = authUser(req);
  await requirePassword(me._id, (req.body as { password: string }).password);
  await deleteAccount(me);
  res.clearCookie(AUTH_COOKIE, clearCookieOptions);
  res.json({ success: true, data: { deleted: true } });
};
