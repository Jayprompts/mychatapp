import webpush from 'web-push';
import type { Types } from 'mongoose';
import { env, isProd } from '../config/env.js';
import type { ConversationDoc } from '../models/Conversation.js';
import { previewFor, type MessageDoc } from '../models/Message.js';
import { PushSubscription } from '../models/PushSubscription.js';
import { User } from '../models/User.js';
import { isOnline } from './presence.js';
import type { NotificationView } from './notifications.js';

// Web Push: notifications that reach people while Grove is closed. Only sent when they have no Grove
// tab open anywhere — otherwise the in-app toast / desktop alert already told them.

export const pushEnabled = !!(env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY);
if (pushEnabled) webpush.setVapidDetails(env.VAPID_SUBJECT, env.VAPID_PUBLIC_KEY!, env.VAPID_PRIVATE_KEY!);

// We POST to whatever address a browser gives us, so only accept the real push services
// (never an address inside our own network). Tests may use a local fake one.
const PUSH_HOSTS = [/(^|\.)googleapis\.com$/, /(^|\.)push\.services\.mozilla\.com$/, /(^|\.)push\.apple\.com$/, /(^|\.)notify\.windows\.com$/];
export function isAllowedEndpoint(endpoint: string) {
  try {
    const url = new URL(endpoint);
    if (!isProd && url.protocol === 'http:' && url.hostname === 'localhost') return true;
    return url.protocol === 'https:' && PUSH_HOSTS.some((re) => re.test(url.hostname));
  } catch {
    return false;
  }
}

export type PushPayload = { title: string; body: string; url: string; tag: string };
type Id = Types.ObjectId | string;

export async function pushTo(userId: Id, payload: PushPayload, { urgent = false } = {}) {
  if (!pushEnabled || isOnline(userId.toString())) return;
  const subs = await PushSubscription.find({ user: userId });
  await Promise.all(
    subs.map(async (sub) => {
      try {
        // web-push encrypts + signs; we send it ourselves (fetch: timeouts, and works with the local test service)
        const req = webpush.generateRequestDetails({ endpoint: sub.endpoint, keys: { p256dh: sub.keys!.p256dh, auth: sub.keys!.auth } }, JSON.stringify(payload), {
          TTL: 24 * 60 * 60, // undelivered after a day → not worth showing
          urgency: urgent ? 'high' : 'normal',
          topic: payload.tag.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 32), // a newer one replaces an undelivered older one
        });
        const res = await fetch(req.endpoint, { method: req.method, headers: req.headers as Record<string, string>, body: new Uint8Array(req.body), signal: AbortSignal.timeout(10_000) });
        if (res.status === 404 || res.status === 410) await PushSubscription.deleteOne({ _id: sub._id }); // that device unsubscribed / was reset
        else if (!res.ok) console.error('push failed:', res.status, (await res.text()).slice(0, 200));
      } catch (err) {
        console.error('push failed:', (err as Error).message);
      }
    }),
  );
}

// New message in a 1-on-1 or group chat (community chats only reach you through @mentions — big rooms would never stop buzzing).
export async function pushNewMessage(conversation: ConversationDoc, message: MessageDoc) {
  if (!pushEnabled || message.type === 'system' || conversation.type === 'community') return;
  try {
    const senderId = message.sender.toString();
    const others = conversation.members.map((m) => m.user.toString()).filter((id) => id !== senderId && !isOnline(id));
    if (!others.length) return;
    const [sender, recipients] = await Promise.all([
      User.findById(senderId).select('displayName'),
      User.find({ _id: { $in: others }, status: 'active', 'notificationPrefs.messages': { $ne: false } }).select('_id'),
    ]);
    const name = sender?.displayName ?? 'Someone';
    const payload: PushPayload = {
      title: conversation.type === 'direct' ? name : `${name} in ${conversation.name}`,
      body: previewFor(message.type, message.text),
      url: `/chats/${conversation._id.toString()}`,
      tag: `chat-${conversation._id.toString()}`, // one per chat: a new message replaces the last
    };
    await Promise.all(recipients.map((r) => pushTo(r._id, payload, { urgent: true })));
  } catch (err) {
    console.error('pushNewMessage failed:', err);
  }
}

// Mirrors the app's notification wording (client/src/features/notifications/format.ts).
export function pushForNotification(n: NotificationView): PushPayload {
  const first = n.actors[0]?.displayName ?? 'Someone';
  const others = n.actorCount - 1;
  const who = others > 0 ? `${first} and ${others} ${others === 1 ? 'other' : 'others'}` : first;
  const post = n.postId ? `/blog/${n.postId}${n.commentId ? `#comment-${n.commentId}` : ''}` : '/blog';
  const place = n.communityId ? `/communities/${n.communityId}` : n.conversationId ? `/chats/${n.conversationId}` : '/chats';
  const t = n.title ? `“${n.title}”` : 'your post';
  const quote = n.preview ? `“${n.preview}”` : '';
  const say = (action: string, url: string, body = '') => ({ title: `${who} ${action}`, body, url, tag: `n-${n.id}` });
  switch (n.type) {
    case 'post_like':
      return say(`liked your post ${t}`, post);
    case 'post_comment':
      return say(`commented on ${t}`, post, quote);
    case 'comment_reply':
      return say('replied to your comment', post, quote);
    case 'comment_like':
      return say('liked your comment', post);
    case 'mention':
      return n.postId ? say(`mentioned you in a comment on ${t}`, post, quote) : say(`mentioned you in ${n.title || 'a chat'}`, place, quote);
    case 'community_join':
      return say(`joined ${n.title}`, place);
    case 'community_request':
      return say(`asked to join ${n.title}`, place);
    case 'request_approved':
      return say(`approved your request to join ${n.title} 🎉`, place);
    case 'group_added':
      return say(`added you to ${n.title || 'a group'}`, place);
    case 'moderation':
      return { title: 'The Grove team', body: [n.title, n.preview].filter(Boolean).join(' — '), url: n.postId ? `/blog/${n.postId}` : '/notifications', tag: `n-${n.id}` };
  }
}
