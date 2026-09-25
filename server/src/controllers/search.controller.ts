import type { RequestHandler } from 'express';
import { z } from 'zod';
import { Community } from '../models/Community.js';
import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';
import { Post } from '../models/Post.js';
import { USER_SUMMARY_FIELDS, User, toUserSummary } from '../models/User.js';
import { authUser } from '../middleware/auth.js';
import { blocksInvolving } from '../services/blocks.js';
import { buildCommunityCards } from '../services/communities.js';
import { buildConversationViews } from '../services/conversationView.js';
import { buildPostCards } from '../services/posts.js';
import { isOnline } from '../services/presence.js';
import { AppError } from '../utils/AppError.js';

const TYPES = ['top', 'people', 'messages', 'posts', 'communities'] as const;
const querySchema = z.object({
  q: z.string().trim().min(2, 'Type at least 2 characters').max(60),
  type: z.enum(TYPES).default('top'),
});

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /api/search?q=&type=top|people|messages|posts|communities
// "top" = a few of each kind; a tab = up to 20. Messages only ever come from your own chats.
export const search: RequestHandler = async (req, res) => {
  const me = authUser(req);
  const meId = me._id.toString();
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) throw new AppError(400, 'Validation failed', z.flattenError(parsed.error).fieldErrors);
  const { q, type } = parsed.data;
  const limit = type === 'top' ? 3 : 20;
  const want = (t: (typeof TYPES)[number]) => type === 'top' || type === t;
  const rx = new RegExp(escapeRegex(q), 'i');
  const blocks = await blocksInvolving(meId);
  const hidden = [...blocks.byMe, ...blocks.byThem];

  const [people, communities, posts, messages] = await Promise.all([
    want('people') ? findPeople(q, rx, meId, hidden, limit) : null,
    want('communities') ? findCommunities(rx, meId, limit) : null,
    want('posts') ? findPosts(rx, meId, hidden, limit) : null,
    want('messages') ? findMessages(rx, meId, limit) : null,
  ]);
  res.json({ success: true, data: { q, type, people, communities, posts, messages } });
};

async function findPeople(q: string, rx: RegExp, meId: string, hidden: string[], limit: number) {
  const handle = escapeRegex(q.replace(/^@/, '').toLowerCase());
  const users = await User.find({
    _id: { $nin: [meId, ...hidden] },
    status: 'active',
    $or: [{ username: { $regex: handle } }, { displayName: rx }],
  })
    .select(USER_SUMMARY_FIELDS)
    .limit(50);
  // Exact handle first, then handles that start with it, then everything else (handle or name contains it).
  const rank = (u: (typeof users)[number]) => (u.username === handle ? 0 : u.username.startsWith(handle) ? 1 : 2);
  return users
    .sort((a, b) => rank(a) - rank(b) || a.displayName.localeCompare(b.displayName))
    .slice(0, limit)
    .map((u) => toUserSummary(u, isOnline(u._id.toString())));
}

async function findCommunities(rx: RegExp, meId: string, limit: number) {
  const found = await Community.find({ $or: [{ name: rx }, { description: rx }] })
    .sort({ memberCount: -1 })
    .limit(50);
  const byName = [...found.filter((c) => rx.test(c.name)), ...found.filter((c) => !rx.test(c.name))]; // name matches first
  return buildCommunityCards(byName.slice(0, limit), meId);
}

async function findPosts(rx: RegExp, meId: string, hidden: string[], limit: number) {
  const found = await Post.find({ status: 'published', author: { $nin: hidden }, $or: [{ title: rx }, { excerpt: rx }, { body: rx }] })
    .sort({ publishedAt: -1 })
    .limit(60);
  const score = (p: (typeof found)[number]) => (rx.test(p.title) ? 2 : 0) + (rx.test(p.excerpt) ? 1 : 0);
  const ranked = [...found].sort((a, b) => score(b) - score(a)).slice(0, limit); // stable: newest first within a score
  return buildPostCards(ranked, meId);
}

async function findMessages(rx: RegExp, meId: string, limit: number) {
  const mine = await Conversation.find({ 'members.user': meId }).select('_id');
  const found = await Message.find({
    conversation: { $in: mine.map((c) => c._id) },
    type: { $in: ['text', 'image'] },
    deletedAt: null,
    text: rx,
  })
    .sort({ _id: -1 })
    .limit(limit);
  if (!found.length) return [];

  const convIds = [...new Set(found.map((m) => m.conversation.toString()))];
  const views = await buildConversationViews(await Conversation.find({ _id: { $in: convIds } }), meId);
  const byConv = new Map(views.map((v) => [v.id, v]));
  return found.map((m) => {
    const conversation = byConv.get(m.conversation.toString())!;
    const sender = conversation.members.find((x) => x.user.id === m.sender.toString())?.user ?? null;
    return { id: m._id.toString(), text: m.text, type: m.type, createdAt: m.createdAt, sender, conversation };
  });
}
