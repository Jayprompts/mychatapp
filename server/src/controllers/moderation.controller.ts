import type { Request, RequestHandler } from 'express';
import { z } from 'zod';
import { Community } from '../models/Community.js';
import { Conversation } from '../models/Conversation.js';
import { Post, type PostDoc } from '../models/Post.js';
import { Report } from '../models/Report.js';
import { USER_SUMMARY_FIELDS, User, toUserSummary, type UserDoc } from '../models/User.js';
import { authUser } from '../middleware/auth.js';
import { audit } from '../services/audit.js';
import { destroyCommunityData, emitCommunityUpdated, syncCommunity } from '../services/communities.js';
import { emitConversationUpdated, memberIds, person, postSystemEvent } from '../services/conversations.js';
import { removeFromGroup } from '../services/membership.js';
import { closeReports, loadTarget, removeTarget, tellAuthor, type TargetType } from '../services/moderation.js';
import { coverUrlFor, destroyPost } from '../services/posts.js';
import { isOnline } from '../services/presence.js';
import { disconnectUser, emitToUsers } from '../sockets/index.js';
import { AppError } from '../utils/AppError.js';
import { parseObjectId } from '../utils/objectId.js';
import {
  adminCommunitiesQuerySchema,
  adminPostsQuerySchema,
  reportsQuerySchema,
  type BulkPostsInput,
  type ResolveReportInput,
} from '../validators/admin.schemas.js';

const PAGE = 20;
const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function parseQuery<T extends z.ZodType>(schema: T, req: Request): z.infer<T> {
  const parsed = schema.safeParse(req.query);
  if (!parsed.success) throw new AppError(400, 'Validation failed', z.flattenError(parsed.error).fieldErrors);
  return parsed.data;
}
const summaries = async (ids: unknown[]) => {
  const users = await User.find({ _id: { $in: ids } }).select(USER_SUMMARY_FIELDS);
  return new Map(users.map((u) => [u._id.toString(), toUserSummary(u, isOnline(u._id.toString()))]));
};
const targetKind = (t: unknown): TargetType => {
  if (t === 'post' || t === 'comment' || t === 'message' || t === 'user') return t;
  throw new AppError(400, 'Unknown report type');
};

// ═════════ Reports queue (Super Admin + Content Moderator) ═════════

export const reportCount: RequestHandler = async (_req, res) => {
  res.json({ success: true, data: { open: await Report.countDocuments({ status: 'open' }) } });
};

// GET /api/admin/reports?status=&type=&page= — one row per reported thing ("3 reports · Spam ×2")
export const listReports: RequestHandler = async (req, res) => {
  const { status, type, page } = parseQuery(reportsQuerySchema, req);
  const [result] = await Report.aggregate<{ rows: Record<string, unknown>[]; total: { n: number }[] }>([
    { $match: { status, ...(type ? { targetType: type } : {}) } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: { type: '$targetType', target: '$target' },
        count: { $sum: 1 },
        reasons: { $push: '$reason' },
        latest: { $first: '$createdAt' },
        snapshot: { $first: '$snapshot' },
        targetAuthor: { $first: '$targetAuthor' },
        resolution: { $first: '$resolution' },
        resolvedAt: { $first: '$resolvedAt' },
      },
    },
    { $sort: { latest: -1 } },
    { $facet: { rows: [{ $skip: (page - 1) * PAGE }, { $limit: PAGE }], total: [{ $count: 'n' }] } },
  ]);
  const authors = await summaries(result.rows.map((r) => r.targetAuthor));
  const rows = result.rows.map((r) => {
    const id = r._id as { type: string; target: unknown };
    const tally: Record<string, number> = {};
    for (const reason of r.reasons as string[]) tally[reason] = (tally[reason] ?? 0) + 1;
    return {
      targetType: id.type,
      targetId: String(id.target),
      count: r.count,
      reasons: Object.entries(tally).sort((a, b) => b[1] - a[1]).map(([reason, n]) => ({ reason, count: n })),
      latest: r.latest,
      snapshot: r.snapshot,
      author: authors.get(String(r.targetAuthor)) ?? null,
      resolution: r.resolution ?? null,
      resolvedAt: r.resolvedAt ?? null,
    };
  });
  res.json({ success: true, data: { rows, total: result.total[0]?.n ?? 0, page, pageSize: PAGE } });
};

// GET /api/admin/reports/:type/:id — the thing in context + every report about it
export const reportDetail: RequestHandler = async (req, res) => {
  const type = targetKind(req.params.type);
  const id = parseObjectId(req.params.id, 'id');
  const [target, reports] = await Promise.all([loadTarget(type, id), Report.find({ targetType: type, target: id }).sort({ createdAt: -1 }).limit(100)]);
  const reporters = await summaries(reports.map((r) => r.reporter));
  const authorId = reports[0]?.targetAuthor;
  const priorAboutAuthor = authorId ? await Report.countDocuments({ targetAuthor: authorId, status: 'resolved', resolution: { $in: ['removed', 'warned', 'banned'] } }) : 0;
  res.json({
    success: true,
    data: {
      type,
      id,
      ...target,
      priorAboutAuthor, // earlier reports about this person that led to action
      reports: reports.map((r) => ({
        id: r._id.toString(),
        reporter: reporters.get(r.reporter.toString()) ?? null,
        reason: r.reason,
        details: r.details,
        snapshot: r.snapshot,
        status: r.status,
        resolution: r.resolution ?? null,
        note: r.note ?? '',
        createdAt: r.createdAt,
      })),
    },
  });
};

const TOLD: Record<Exclude<TargetType, 'user'>, string> = { post: 'post', comment: 'comment', message: 'message' };

// POST /api/admin/reports/:type/:id/resolve { action: dismiss | remove | warn | ban, note? }
export const resolveReport: RequestHandler = async (req, res) => {
  const me = authUser(req);
  const type = targetKind(req.params.type);
  const id = parseObjectId(req.params.id, 'id');
  const { action, note = '' } = req.body as ResolveReportInput;

  const open = await Report.find({ targetType: type, target: id, status: 'open' });
  if (!open.length) throw new AppError(404, 'There are no open reports about this');
  const authorId = open[0].targetAuthor;
  // The reason most people gave, for the author's notice ("removed for Spam").
  const tally = new Map<string, number>();
  for (const r of open) tally.set(r.reason, (tally.get(r.reason) ?? 0) + 1);
  const topReason = [...tally.entries()].sort((a, b) => b[1] - a[1])[0][0];
  const target = await loadTarget(type, id);
  const label = target.label || open[0].snapshot.slice(0, 60);
  const why = note || topReason;

  if (action === 'dismiss') {
    await closeReports(type, id, me, 'dismissed', note);
    await audit(me, 'report.dismiss', { type: 'report', id, label }, note ? { reason: note } : null);
  } else if (action === 'remove') {
    if (type === 'user') throw new AppError(400, 'Accounts can’t be removed from here — ban the user instead');
    await removeTarget(type, id);
    await closeReports(type, id, me, 'removed', note);
    await audit(me, `${type}.delete`, { type, id, label: type === 'post' ? label : `@${target.author?.username ?? 'deleted'}` }, { reason: why });
    if (authorId) void tellAuthor(authorId, me, `removed your ${TOLD[type]}${type === 'post' ? ` “${label}”` : ''}`, `Reason: ${why}`);
  } else if (action === 'warn') {
    if (!authorId) throw new AppError(400, 'There’s no one to warn');
    await closeReports(type, id, me, 'warned', note);
    await audit(me, 'user.warn', { type: 'user', id: authorId, label: `@${target.author?.username ?? 'deleted'}` }, { reason: why });
    void tellAuthor(authorId, me, 'sent you a warning', why);
  } else {
    // Ban: Super Admin only (same rule as the Users screen).
    if (me.role !== 'super_admin') throw new AppError(403, 'Only a Super Admin can ban accounts');
    const author = authorId && (await User.findById(authorId));
    if (!author || author.status === 'deleted') throw new AppError(404, 'That account no longer exists');
    if (author._id.equals(me._id)) throw new AppError(400, "You can't ban yourself");
    if (author.role === 'super_admin') throw new AppError(403, 'Change their role first — Super Admins can’t be banned');
    author.status = 'banned';
    author.statusReason = why;
    await author.save();
    disconnectUser(author._id.toString());
    await closeReports(type, id, me, 'banned', note);
    await audit(me, 'user.ban', { type: 'user', id: author._id, label: `@${author.username}` }, { reason: why });
  }
  res.json({ success: true, data: { resolved: open.length } });
};

// ═════════ Blog management (Super Admin + Content Moderator) ═════════

const toAdminPost = (p: PostDoc, authors: Map<string, ReturnType<typeof toUserSummary>>) => ({
  id: p._id.toString(),
  title: p.title,
  tag: p.tag,
  coverUrl: coverUrlFor(p),
  coverTheme: p.coverTheme,
  author: authors.get(p.author.toString()) ?? null,
  publishedAt: p.publishedAt,
  likeCount: p.likeCount,
  commentCount: p.commentCount,
  featured: p.featured,
});

// GET /api/admin/posts?q=&featured=&page= — published posts (drafts stay private to their authors)
export const listPosts: RequestHandler = async (req, res) => {
  const { q, featured, page } = parseQuery(adminPostsQuerySchema, req);
  const rx = q ? new RegExp(escapeRegex(q), 'i') : null;
  const authorIds = rx ? (await User.find({ $or: [{ username: rx }, { displayName: rx }] }).select('_id')).map((u) => u._id) : [];
  const filter: Record<string, unknown> = {
    status: 'published',
    ...(featured ? { featured: true } : {}),
    ...(rx ? { $or: [{ title: rx }, { author: { $in: authorIds } }] } : {}),
  };
  const [total, posts] = await Promise.all([
    Post.countDocuments(filter),
    Post.find(filter).sort({ featured: -1, publishedAt: -1 }).skip((page - 1) * PAGE).limit(PAGE),
  ]);
  const authors = await summaries(posts.map((p) => p.author));
  res.json({ success: true, data: { posts: posts.map((p) => toAdminPost(p, authors)), total, page, pageSize: PAGE } });
};

async function findPublished(id: unknown) {
  const post = await Post.findOne({ _id: parseObjectId(id, 'post id'), status: 'published' });
  if (!post) throw new AppError(404, 'Post not found');
  return post;
}

async function postAction(me: UserDoc, post: PostDoc, action: 'feature' | 'unfeature' | 'unpublish' | 'delete', reason = '') {
  if (action === 'feature' || action === 'unfeature') {
    post.featured = action === 'feature';
    await post.save();
    await audit(me, action === 'feature' ? 'post.feature' : 'post.unfeature', { type: 'post', id: post._id, label: post.title });
  } else if (action === 'unpublish') {
    post.status = 'draft';
    post.featured = false;
    await post.save();
    await audit(me, 'post.unpublish', { type: 'post', id: post._id, label: post.title }, reason ? { reason } : null);
    void tellAuthor(post.author, me, `moved your post “${post.title}” back to drafts`, reason ? `Reason: ${reason}` : 'You can edit it and publish it again.', { post: post._id });
  } else {
    const author = post.author;
    const title = post.title;
    await destroyPost(post);
    await Report.updateMany({ targetType: 'post', target: post._id, status: 'open' }, { $set: { status: 'resolved', resolution: 'removed', resolvedBy: me._id, resolvedAt: new Date() } });
    await audit(me, 'post.delete', { type: 'post', id: post._id, label: title }, reason ? { reason } : null);
    void tellAuthor(author, me, `removed your post “${title}”`, reason ? `Reason: ${reason}` : '');
  }
}

// PATCH /api/admin/posts/:id { featured } · POST /:id/unpublish { reason? } · DELETE /:id { reason? }
export const setPostFlags: RequestHandler = async (req, res) => {
  const post = await findPublished(req.params.id);
  await postAction(authUser(req), post, (req.body as { featured: boolean }).featured ? 'feature' : 'unfeature');
  res.json({ success: true, data: { featured: post.featured } });
};
export const unpublishPost: RequestHandler = async (req, res) => {
  await postAction(authUser(req), await findPublished(req.params.id), 'unpublish', (req.body as { reason?: string }).reason);
  res.json({ success: true, data: { status: 'draft' } });
};
export const deletePost: RequestHandler = async (req, res) => {
  await postAction(authUser(req), await findPublished(req.params.id), 'delete', (req.body as { reason?: string }).reason);
  res.json({ success: true, data: { deleted: true } });
};
export const bulkPosts: RequestHandler = async (req, res) => {
  const me = authUser(req);
  const { ids, action, reason } = req.body as BulkPostsInput;
  const done: string[] = [];
  const skipped: { id: string; reason: string }[] = [];
  for (const id of [...new Set(ids)]) {
    try {
      await postAction(me, await findPublished(id), action, reason);
      done.push(id);
    } catch (err) {
      skipped.push({ id, reason: err instanceof AppError ? err.message : 'Something went wrong' });
    }
  }
  res.json({ success: true, data: { done, skipped } });
};

// ═════════ Community management (Super Admin + Community Manager) ═════════

// GET /api/admin/communities?q=&featured=&page=
export const listCommunities: RequestHandler = async (req, res) => {
  const { q, featured, page } = parseQuery(adminCommunitiesQuerySchema, req);
  const rx = q ? new RegExp(escapeRegex(q), 'i') : null;
  const filter: Record<string, unknown> = { ...(featured ? { featured: true } : {}), ...(rx ? { $or: [{ name: rx }, { description: rx }] } : {}) };
  const [total, list] = await Promise.all([
    Community.countDocuments(filter),
    Community.find(filter).sort({ featured: -1, memberCount: -1, _id: -1 }).skip((page - 1) * PAGE).limit(PAGE),
  ]);
  const convs = await Conversation.find({ _id: { $in: list.map((c) => c.conversation) } }).select('members');
  const adminsOf = new Map(convs.map((c) => [c._id.toString(), c.members.filter((m) => m.role === 'admin').length]));
  const owners = await summaries(list.map((c) => c.owner));
  res.json({
    success: true,
    data: {
      communities: list.map((c) => ({
        id: c._id.toString(),
        name: c.name,
        icon: c.icon,
        theme: c.theme,
        category: c.category,
        visibility: c.visibility,
        memberCount: c.memberCount,
        featured: c.featured,
        createdAt: c.createdAt,
        owner: owners.get(c.owner.toString()) ?? null,
        admins: adminsOf.get(c.conversation.toString()) ?? 0,
      })),
      total,
      page,
      pageSize: PAGE,
    },
  });
};

async function findCommunityWithChat(id: unknown) {
  const community = await Community.findById(parseObjectId(id, 'community id'));
  const conversation = community && (await Conversation.findById(community.conversation));
  if (!community || !conversation) throw new AppError(404, 'Community not found');
  return { community, conversation };
}

// PATCH /api/admin/communities/:id { featured } — featured communities lead Discover
export const setCommunityFlags: RequestHandler = async (req, res) => {
  const me = authUser(req);
  const { community, conversation } = await findCommunityWithChat(req.params.id);
  community.featured = (req.body as { featured: boolean }).featured;
  await community.save();
  await audit(me, community.featured ? 'community.feature' : 'community.unfeature', { type: 'community', id: community._id, label: community.name });
  emitCommunityUpdated(community._id.toString(), memberIds(conversation));
  res.json({ success: true, data: { featured: community.featured } });
};

// DELETE /api/admin/communities/:id { reason? } — everything goes; members are told it's gone
export const deleteCommunity: RequestHandler = async (req, res) => {
  const me = authUser(req);
  const { community, conversation } = await findCommunityWithChat(req.params.id);
  const reason = (req.body as { reason?: string }).reason ?? '';
  const everyone = memberIds(conversation);
  const name = community.name;
  const owner = community.owner;
  await destroyCommunityData(conversation._id);
  emitToUsers(everyone, 'conversation:removed', { conversationId: conversation._id.toString() });
  emitCommunityUpdated(community._id.toString(), everyone);
  await audit(me, 'community.delete', { type: 'community', id: community._id, label: name }, reason ? { reason } : null);
  void tellAuthor(owner, me, `removed your community ${name}`, reason ? `Reason: ${reason}` : '');
  res.json({ success: true, data: { deleted: true } });
};

// GET /api/admin/communities/:id/members
export const communityMembers: RequestHandler = async (req, res) => {
  const { conversation } = await findCommunityWithChat(req.params.id);
  const people = await summaries(conversation.members.map((m) => m.user));
  const order = { owner: 0, admin: 1, member: 2 } as const;
  const members = conversation.members
    .map((m) => ({ user: people.get(m.user.toString()), role: m.role, joinedAt: m.joinedAt }))
    .filter((m) => m.user)
    .sort((a, b) => order[a.role] - order[b.role] || a.user!.displayName.localeCompare(b.user!.displayName));
  res.json({ success: true, data: { members } });
};

// PATCH /api/admin/communities/:id/members/:userId { role: owner | admin | member }
// Making someone the owner hands ownership over (the old owner becomes an admin).
export const setMemberRole: RequestHandler = async (req, res) => {
  const me = authUser(req);
  const { community, conversation } = await findCommunityWithChat(req.params.id);
  const userId = parseObjectId(req.params.userId, 'user id');
  const member = conversation.members.find((m) => m.user.toString() === userId);
  if (!member) throw new AppError(404, "That person isn't a member");
  const { role } = req.body as { role: 'owner' | 'admin' | 'member' };
  const from = member.role;
  if (from === role) {
    res.json({ success: true, data: { role } });
    return;
  }
  if (from === 'owner') throw new AppError(400, 'To change the owner, make someone else the owner');

  if (role === 'owner') {
    await Conversation.updateOne({ _id: conversation._id, 'members.role': 'owner' }, { $set: { 'members.$.role': 'admin' } });
  }
  await Conversation.updateOne({ _id: conversation._id, 'members.user': userId }, { $set: { 'members.$.role': role } });
  const updated = (await Conversation.findById(conversation._id))!;
  await syncCommunity(updated);
  const target = await User.findById(userId);
  if (target && role !== 'owner') await postSystemEvent(updated, me, { kind: 'role', targets: [person(target)], role });
  emitConversationUpdated(updated);
  emitCommunityUpdated(community._id.toString(), memberIds(updated));
  await audit(me, 'community.member_role', { type: 'community', id: community._id, label: community.name }, { user: target ? `@${target.username}` : userId, from, to: role });
  res.json({ success: true, data: { role } });
};

// DELETE /api/admin/communities/:id/members/:userId — the owner can't be removed (hand over ownership first)
export const removeMember: RequestHandler = async (req, res) => {
  const me = authUser(req);
  const { community, conversation } = await findCommunityWithChat(req.params.id);
  const userId = parseObjectId(req.params.userId, 'user id');
  const member = conversation.members.find((m) => m.user.toString() === userId);
  if (!member) throw new AppError(404, "That person isn't a member");
  if (member.role === 'owner') throw new AppError(400, 'Make someone else the owner before removing this person');
  const target = await User.findById(userId);
  await removeFromGroup(conversation, userId, target, me);
  await audit(me, 'community.member_remove', { type: 'community', id: community._id, label: community.name }, { user: target ? `@${target.username}` : userId });
  res.json({ success: true, data: { removed: true } });
};
