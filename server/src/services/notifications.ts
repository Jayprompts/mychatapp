import type { Types } from 'mongoose';
import { Block } from '../models/Block.js';
import { NOTIFICATION_CATEGORY, Notification, type NotificationDoc, type NotificationType } from '../models/Notification.js';
import { USER_SUMMARY_FIELDS, User, toUserSummary, type UserDoc } from '../models/User.js';
import { emitToUsers } from '../sockets/index.js';
import { isOnline } from './presence.js';

type Id = Types.ObjectId | string;
const str = (id: Id) => id.toString();
const clip = (s: string) => (s.length > 140 ? s.slice(0, 139) + '…' : s);

// Adds and take-backs for the same grouped notification run one after another, in the order they
// were asked for — so a quick "request → approve" can't take back a notification that isn't saved yet.
// (One server process, so an in-memory queue per key is enough.)
const queues = new Map<string, Promise<void>>();
function inOrder(key: string | null, task: () => Promise<void>): Promise<void> {
  if (!key) return task();
  const run = (queues.get(key) ?? Promise.resolve()).then(task, task);
  queues.set(key, run);
  void run.finally(() => queues.get(key) === run && queues.delete(key));
  return run;
}

export type NotifyInput = {
  recipient: Id;
  type: NotificationType;
  actor: UserDoc;
  post?: Id | null;
  comment?: Id | null;
  community?: Id | null;
  conversation?: Id | null;
  title?: string;
  preview?: string;
  groupKey?: string; // set to merge repeats while unread
};

/**
 * Tell someone about something. Never notifies you about yourself, respects the recipient's settings
 * and blocks (in either direction), merges repeats ("Bob and 3 others"), and pushes it live.
 * Never throws: a notification failing must not fail the action that caused it.
 */
export function notify(input: NotifyInput) {
  return inOrder(input.groupKey ? `${str(input.recipient)}:${input.groupKey}` : null, () => deliver(input));
}

async function deliver(input: NotifyInput) {
  try {
    const recipientId = str(input.recipient);
    const actorId = input.actor._id.toString();
    if (recipientId === actorId) return;

    const recipient = await User.findById(recipientId).select('status notificationPrefs');
    if (!recipient || recipient.status !== 'active') return;
    const category = NOTIFICATION_CATEGORY[input.type];
    if (category !== 'always' && recipient.notificationPrefs?.[category] === false) return;
    if (input.type !== 'moderation' && await Block.exists({ $or: [{ blocker: recipientId, blocked: actorId }, { blocker: actorId, blocked: recipientId }] })) return;

    const fields = {
      post: input.post ?? null,
      comment: input.comment ?? null,
      community: input.community ?? null,
      conversation: input.conversation ?? null,
      title: clip(input.title ?? ''),
      preview: clip(input.preview ?? ''),
    };

    let doc: NotificationDoc | null = null;
    if (input.groupKey) {
      // Unread and same key: move this person to the front and bump it to the top.
      await Notification.updateOne({ recipient: recipientId, groupKey: input.groupKey, readAt: null }, { $pull: { actors: input.actor._id } });
      doc = await Notification.findOneAndUpdate(
        { recipient: recipientId, groupKey: input.groupKey, readAt: null },
        { $push: { actors: { $each: [input.actor._id], $position: 0, $slice: 50 } }, $set: fields },
        { returnDocument: 'after' },
      );
    }
    doc ??= await Notification.create({ recipient: recipientId, type: input.type, actors: [input.actor._id], groupKey: input.groupKey ?? null, ...fields });

    const [view] = await buildNotificationViews([doc]);
    emitToUsers([recipientId], 'notification:new', { notification: view, unreadCount: await unreadCount(recipientId) });
  } catch (err) {
    console.error('notify failed:', err);
  }
}

// Take it back (unlike, cancelled request…): remove the person; drop the notification if nobody's left.
export function retract(recipient: Id, groupKey: string, actor: Id) {
  return inOrder(`${str(recipient)}:${groupKey}`, () => takeBack(recipient, groupKey, actor));
}

async function takeBack(recipient: Id, groupKey: string, actor: Id) {
  try {
    const doc = await Notification.findOneAndUpdate({ recipient, groupKey, readAt: null }, { $pull: { actors: actor } }, { returnDocument: 'after' });
    if (!doc) return;
    if (doc.actors.length === 0) await Notification.deleteOne({ _id: doc._id });
    emitToUsers([str(recipient)], 'notifications:changed', { unreadCount: await unreadCount(recipient) });
  } catch (err) {
    console.error('retract failed:', err);
  }
}

// Content went away: its notifications go too.
export async function removeNotificationsFor(filter: { post?: Id; comment?: Id; community?: Id; conversation?: Id }) {
  const recipients = await Notification.find(filter).distinct('recipient');
  if (!recipients.length) return;
  await Notification.deleteMany(filter);
  for (const r of recipients) emitToUsers([r.toString()], 'notifications:changed', { unreadCount: await unreadCount(r) });
}

export const unreadCount = (recipient: Id) => Notification.countDocuments({ recipient, readAt: null });

// @mentions: "@ana_b" → user ids (max 10), limited to `allowed` when given (e.g. chat members).
export async function mentionedUsers(text: string, allowed?: Set<string>) {
  const names = [...new Set([...text.matchAll(/(?:^|[^\w@.])@([a-z0-9_.]{3,30})/gi)].map((m) => m[1].toLowerCase().replace(/\.+$/, '')))].slice(0, 10);
  if (!names.length) return [];
  const users = await User.find({ username: { $in: names }, status: 'active' }).select('_id');
  return users.map((u) => u._id.toString()).filter((id) => !allowed || allowed.has(id));
}

// ── What the API sends ──
export async function buildNotificationViews(docs: NotificationDoc[]) {
  const ids = [...new Set(docs.flatMap((d) => d.actors.slice(0, 3).map(str)))];
  const users = await User.find({ _id: { $in: ids } }).select(USER_SUMMARY_FIELDS);
  const byId = new Map(users.map((u) => [u._id.toString(), u]));
  return docs.map((d) => ({
    id: d._id.toString(),
    type: d.type,
    actors: (d.type === 'moderation' ? [] : d.actors) // moderators stay anonymous: it's "the Grove team"
      .slice(0, 3)
      .map((a) => byId.get(str(a)))
      .filter((u): u is UserDoc => !!u)
      .map((u) => toUserSummary(u, isOnline(u._id.toString()))),
    actorCount: d.type === 'moderation' ? 0 : d.actors.length,
    postId: d.post?.toString() ?? null,
    commentId: d.comment?.toString() ?? null,
    communityId: d.community?.toString() ?? null,
    conversationId: d.conversation?.toString() ?? null,
    title: d.title,
    preview: d.preview,
    read: !!d.readAt,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  }));
}
export type NotificationView = Awaited<ReturnType<typeof buildNotificationViews>>[number];
