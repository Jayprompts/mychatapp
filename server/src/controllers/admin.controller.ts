import type { Request, RequestHandler } from 'express';
import { z } from 'zod';
import { AuditLog } from '../models/AuditLog.js';
import { Conversation } from '../models/Conversation.js';
import { Community } from '../models/Community.js';
import { Post } from '../models/Post.js';
import { Report } from '../models/Report.js';
import { User, type Role, type UserDoc } from '../models/User.js';
import { authUser, STAFF_ROLES } from '../middleware/auth.js';
import { deleteAccount } from '../services/account.js';
import { audit, toAuditView } from '../services/audit.js';
import { isOnline } from '../services/presence.js';
import { disconnectUser } from '../sockets/index.js';
import { AppError } from '../utils/AppError.js';
import { parseObjectId } from '../utils/objectId.js';
import { auditQuerySchema, usersQuerySchema, type BulkUsersInput, type SetStatusInput } from '../validators/admin.schemas.js';

const PAGE = 20;
const WEEK = 7 * 24 * 60 * 60 * 1000;
const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function parseQuery<T extends z.ZodType>(schema: T, req: Request): z.infer<T> {
  const parsed = schema.safeParse(req.query);
  if (!parsed.success) throw new AppError(400, 'Validation failed', z.flattenError(parsed.error).fieldErrors);
  return parsed.data;
}

// What the admin tables show about a person (more than the public summary: email, role, status).
export const toAdminUser = (u: UserDoc) => ({
  id: u._id.toString(),
  username: u.username,
  displayName: u.displayName,
  email: u.email,
  avatarUrl: u.avatarUrl ?? null,
  role: u.role,
  status: u.status,
  statusReason: u.statusReason ?? '',
  createdAt: u.createdAt,
  lastSeenAt: u.lastSeenAt ?? null,
  online: isOnline(u._id.toString()),
});

async function findUser(id: unknown) {
  const user = await User.findOne({ _id: parseObjectId(id, 'user id'), status: { $ne: 'deleted' } });
  if (!user) throw new AppError(404, 'User not found');
  return user;
}

// Guard rails: never act on yourself; another Super Admin must be demoted first.
function assertCanManage(actor: UserDoc, target: UserDoc) {
  if (actor._id.equals(target._id)) throw new AppError(400, "You can't do that to your own account");
  if (target.role === 'super_admin') throw new AppError(403, 'Change their role first — Super Admins can’t be suspended, banned or deleted');
}

// GET /api/admin/stats — the dashboard cards (+ recent admin activity)
export const stats: RequestHandler = async (_req, res) => {
  const now = Date.now();
  const weekAgo = new Date(now - WEEK);
  const twoWeeksAgo = new Date(now - 2 * WEEK);
  const activeConvs = await Conversation.find({ type: 'community', lastMessageAt: { $gte: weekAgo } }).select('_id');
  const [users, newThisWeek, newLastWeek, blocked, communities, activeCommunities, postsThisWeek, postsLastWeek, openReports, recent] = await Promise.all([
    User.countDocuments({ status: { $ne: 'deleted' } }),
    User.countDocuments({ status: { $ne: 'deleted' }, createdAt: { $gte: weekAgo } }),
    User.countDocuments({ status: { $ne: 'deleted' }, createdAt: { $gte: twoWeeksAgo, $lt: weekAgo } }),
    User.countDocuments({ status: { $in: ['suspended', 'banned'] } }),
    Community.countDocuments(),
    Community.countDocuments({ conversation: { $in: activeConvs.map((c) => c._id) } }),
    Post.countDocuments({ status: 'published', publishedAt: { $gte: weekAgo } }),
    Post.countDocuments({ status: 'published', publishedAt: { $gte: twoWeeksAgo, $lt: weekAgo } }),
    Report.countDocuments({ status: 'open' }),
    AuditLog.find().sort({ createdAt: -1 }).limit(8),
  ]);
  res.json({
    success: true,
    data: {
      users: { total: users, newThisWeek, newLastWeek, blocked },
      communities: { total: communities, active: activeCommunities },
      posts: { thisWeek: postsThisWeek, lastWeek: postsLastWeek },
      reports: { open: openReports },
      recent: recent.map(toAuditView),
    },
  });
};

// GET /api/admin/users?q=&role=&status=&page=
export const listUsers: RequestHandler = async (req, res) => {
  const { q, role, status, page } = parseQuery(usersQuerySchema, req);
  const rx = q ? new RegExp(escapeRegex(q.replace(/^@/, '')), 'i') : null;
  const filter: Record<string, unknown> = {
    status: status ?? { $ne: 'deleted' },
    ...(role ? { role } : {}),
    ...(rx ? { $or: [{ username: rx }, { displayName: rx }, { email: rx }] } : {}),
  };
  const [total, users] = await Promise.all([
    User.countDocuments(filter),
    User.find(filter).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * PAGE).limit(PAGE),
  ]);
  res.json({ success: true, data: { users: users.map(toAdminUser), total, page, pageSize: PAGE } });
};

// Suspend / ban / reactivate one person (shared by the single and bulk endpoints).
async function applyStatus(actor: UserDoc, target: UserDoc, status: 'active' | 'suspended' | 'banned', reason = '') {
  assertCanManage(actor, target);
  target.status = status;
  target.statusReason = status === 'active' ? '' : reason;
  await target.save();
  if (status !== 'active') disconnectUser(target._id.toString()); // signed out everywhere, right now
  const action = status === 'active' ? 'user.activate' : status === 'suspended' ? 'user.suspend' : 'user.ban';
  await audit(actor, action, { type: 'user', id: target._id, label: `@${target.username}` }, reason ? { reason } : null);
}

async function applyDelete(actor: UserDoc, target: UserDoc) {
  assertCanManage(actor, target);
  const label = `@${target.username}`;
  await deleteAccount(target);
  await audit(actor, 'user.delete', { type: 'user', id: target._id, label });
}

// PATCH /api/admin/users/:id/status { status, reason? } — Super Admin
export const setStatus: RequestHandler = async (req, res) => {
  const me = authUser(req);
  const target = await findUser(req.params.id);
  const { status, reason } = req.body as SetStatusInput;
  await applyStatus(me, target, status, reason);
  res.json({ success: true, data: { user: toAdminUser(target) } });
};

// DELETE /api/admin/users/:id — Super Admin (the same clean-up as deleting your own account)
export const removeUser: RequestHandler = async (req, res) => {
  const me = authUser(req);
  await applyDelete(me, await findUser(req.params.id));
  res.json({ success: true, data: { deleted: true } });
};

// POST /api/admin/users/bulk { ids, action, reason? } — Super Admin; does what it can, reports the rest
export const bulkUsers: RequestHandler = async (req, res) => {
  const me = authUser(req);
  const { ids, action, reason } = req.body as BulkUsersInput;
  const done: string[] = [];
  const skipped: { id: string; reason: string }[] = [];
  for (const id of [...new Set(ids)]) {
    try {
      const target = await findUser(id);
      if (action === 'delete') await applyDelete(me, target);
      else await applyStatus(me, target, action === 'activate' ? 'active' : action === 'suspend' ? 'suspended' : 'banned', reason);
      done.push(id);
    } catch (err) {
      skipped.push({ id, reason: err instanceof AppError ? err.message : 'Something went wrong' });
    }
  }
  res.json({ success: true, data: { done, skipped } });
};

// PATCH /api/admin/users/:id/role { role } — Super Admin; there must always be at least one Super Admin
export const setRole: RequestHandler = async (req, res) => {
  const me = authUser(req);
  const target = await findUser(req.params.id);
  const { role } = req.body as { role: Role };
  if (me._id.equals(target._id)) throw new AppError(400, "You can't change your own role — ask another Super Admin");
  if (target.status !== 'active') throw new AppError(400, 'Reactivate this account before giving it a role');
  const from = target.role;
  if (from === role) {
    res.json({ success: true, data: { user: toAdminUser(target) } });
    return;
  }
  target.role = role;
  await target.save();
  await audit(me, 'user.role', { type: 'user', id: target._id, label: `@${target.username}` }, { from, to: role });
  res.json({ success: true, data: { user: toAdminUser(target) } });
};

// GET /api/admin/staff — everyone with a staff role, and how many hold each
export const staff: RequestHandler = async (_req, res) => {
  const users = await User.find({ role: { $in: STAFF_ROLES }, status: { $ne: 'deleted' } }).sort({ role: 1, displayName: 1 });
  const counts = Object.fromEntries(STAFF_ROLES.map((r) => [r, users.filter((u) => u.role === r).length]));
  res.json({ success: true, data: { users: users.map(toAdminUser), counts } });
};

// GET /api/admin/audit?actor=&action=&page= — Super Admin
export const auditLog: RequestHandler = async (req, res) => {
  const { actor, action, page } = parseQuery(auditQuerySchema, req);
  const filter = { ...(actor ? { actor } : {}), ...(action ? { action } : {}) };
  const [total, entries, actors] = await Promise.all([
    AuditLog.countDocuments(filter),
    AuditLog.find(filter).sort({ createdAt: -1 }).skip((page - 1) * PAGE).limit(PAGE),
    AuditLog.aggregate<{ _id: string; name: string }>([{ $group: { _id: '$actor', name: { $last: '$actorName' } } }, { $sort: { name: 1 } }]),
  ]);
  res.json({
    success: true,
    data: {
      entries: entries.map(toAuditView),
      total,
      page,
      pageSize: PAGE,
      actors: actors.map((a) => ({ id: String(a._id), name: a.name })), // for the "by admin" filter
    },
  });
};
