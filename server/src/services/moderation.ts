import type { Types } from 'mongoose';
import { Comment } from '../models/Comment.js';
import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';
import { Post } from '../models/Post.js';
import { Report } from '../models/Report.js';
import { USER_SUMMARY_FIELDS, User, toUserSummary, type UserDoc } from '../models/User.js';
import { removeComment } from './comments.js';
import { unsendMessage } from './conversations.js';
import { notify } from './notifications.js';
import { coverUrlFor, destroyPost } from './posts.js';
import { isOnline } from './presence.js';
import { AppError } from '../utils/AppError.js';

export type TargetType = 'post' | 'comment' | 'message' | 'user';
const clip = (s: string, n = 140) => (s.length > n ? s.slice(0, n - 1) + '…' : s);

// "The Grove team" tells the author what happened (the moderator is never named).
export function tellAuthor(author: Types.ObjectId | string, moderator: UserDoc, title: string, preview = '', extra: { post?: Types.ObjectId | null } = {}) {
  return notify({ recipient: author, type: 'moderation', actor: moderator, title, preview, post: extra.post ?? null });
}

// The reported thing, in context, for the moderator's detail view.
export async function loadTarget(type: TargetType, id: string) {
  const summary = async (userId: Types.ObjectId | null | undefined) => {
    if (!userId) return null;
    const u = await User.findById(userId).select(`${USER_SUMMARY_FIELDS} email role status statusReason createdAt bio`);
    return u ? { ...toUserSummary(u, isOnline(u._id.toString())), email: u.email, role: u.role, status: u.status, statusReason: u.statusReason ?? '', createdAt: u.createdAt, bio: u.bio ?? '' } : null;
  };

  if (type === 'post') {
    const p = await Post.findById(id);
    if (!p) return { exists: false as const, author: null, label: '', content: null };
    return {
      exists: true as const,
      author: await summary(p.author),
      label: p.title,
      content: { kind: 'post' as const, id: p._id.toString(), title: p.title, body: clip(p.body, 1500), coverUrl: coverUrlFor(p), coverTheme: p.coverTheme, status: p.status, publishedAt: p.publishedAt, url: `/blog/${p._id.toString()}` },
    };
  }
  if (type === 'comment') {
    const c = await Comment.findById(id);
    if (!c || c.deletedAt) return { exists: false as const, author: null, label: '', content: null };
    const [post, parent] = await Promise.all([Post.findById(c.post).select('title'), c.parent ? Comment.findById(c.parent) : null]);
    return {
      exists: true as const,
      author: await summary(c.author),
      label: clip(c.body, 60),
      content: {
        kind: 'comment' as const,
        id: c._id.toString(),
        body: c.body,
        createdAt: c.createdAt,
        post: post ? { id: post._id.toString(), title: post.title } : null,
        parent: parent && !parent.deletedAt ? { author: await summary(parent.author), body: clip(parent.body, 300) } : null,
        url: `/blog/${c.post.toString()}#comment-${c._id.toString()}`,
      },
    };
  }
  if (type === 'message') {
    const m = await Message.findById(id);
    if (!m || m.deletedAt) return { exists: false as const, author: null, label: '', content: null };
    const [before, after, conv] = await Promise.all([
      Message.find({ conversation: m.conversation, _id: { $lt: m._id } }).sort({ _id: -1 }).limit(3),
      Message.find({ conversation: m.conversation, _id: { $gt: m._id } }).sort({ _id: 1 }).limit(3),
      Conversation.findById(m.conversation).select('type name'),
    ]);
    const around = [...before.reverse(), m, ...after];
    const people = await User.find({ _id: { $in: around.map((x) => x.sender) } }).select('displayName username');
    const nameOf = new Map(people.map((u) => [u._id.toString(), u.displayName]));
    return {
      exists: true as const,
      author: await summary(m.sender),
      label: clip(m.text || m.type, 60),
      content: {
        kind: 'message' as const,
        id: m._id.toString(),
        conversation: conv ? { id: conv._id.toString(), type: conv.type, name: conv.type === 'direct' ? '1-on-1 chat' : (conv.name ?? 'Group') } : null,
        context: around.map((x) => ({
          id: x._id.toString(),
          sender: nameOf.get(x.sender.toString()) ?? 'Deleted user',
          text: x.deletedAt ? '(message deleted)' : x.type === 'system' ? '' : x.text || (x.type === 'image' ? '📷 Photo' : '🎤 Voice message'),
          system: x.type === 'system',
          createdAt: x.createdAt,
          isTarget: x._id.equals(m._id),
        })).filter((x) => !x.system),
      },
    };
  }
  const u = await summary(id as unknown as Types.ObjectId);
  if (!u || u.status === 'deleted') return { exists: false as const, author: null, label: '', content: null };
  const posts = await Post.countDocuments({ author: id, status: 'published' });
  return { exists: true as const, author: u, label: `@${u.username}`, content: { kind: 'user' as const, id, posts } };
}

// Remove the reported content (the author is told by the caller). Users can't be "removed" — ban instead.
export async function removeTarget(type: TargetType, id: string) {
  if (type === 'post') {
    const p = await Post.findById(id);
    if (p) await destroyPost(p);
  } else if (type === 'comment') {
    const c = await Comment.findById(id);
    const post = c && (await Post.findById(c.post));
    if (c && post && !c.deletedAt) await removeComment(c, post);
  } else if (type === 'message') {
    const m = await Message.findById(id);
    const conv = m && (await Conversation.findById(m.conversation));
    if (m && conv) await unsendMessage(conv, m);
  } else {
    throw new AppError(400, 'Accounts can’t be removed from here — ban the user instead');
  }
}

// Close every open report about this thing.
export function closeReports(type: TargetType, id: string, moderator: UserDoc, resolution: 'dismissed' | 'removed' | 'warned' | 'banned', note: string) {
  return Report.updateMany(
    { targetType: type, target: id, status: 'open' },
    { $set: { status: resolution === 'dismissed' ? 'dismissed' : 'resolved', resolution, resolvedBy: moderator._id, resolvedAt: new Date(), note } },
  );
}
