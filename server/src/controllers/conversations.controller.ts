import type { RequestHandler } from 'express';
import { z } from 'zod';
import { Conversation, directKeyFor } from '../models/Conversation.js';
import { Message, toPublicMessage, type MessageDoc } from '../models/Message.js';
import { User } from '../models/User.js';
import { authUser } from '../middleware/auth.js';
import { buildConversationView, buildConversationViews } from '../services/conversationView.js';
import { MEDIA_LIMITS, deleteMedia, storeImage, storeVoice, type StoredMedia } from '../services/media.js';
import { emitToUsers } from '../sockets/index.js';
import { buildReplySnapshot, findMemberConversation, memberIds, publishNewMessage } from '../services/conversations.js';
import { AppError } from '../utils/AppError.js';
import {
  mediaMessageSchema,
  messagesQuerySchema,
  type OpenDirectInput,
  type SendMessageInput,
} from '../validators/chat.schemas.js';

// GET /api/conversations — my chats, newest activity first.
// Direct chats someone opened but never messaged only show up for the person who opened them.
export const listConversations: RequestHandler = async (req, res) => {
  const me = authUser(req)._id.toString();
  const conversations = await Conversation.find({
    'members.user': me,
    $or: [{ lastMessage: { $ne: null } }, { createdBy: me }],
  })
    .sort({ lastMessageAt: -1 })
    .limit(100);

  res.json({ success: true, data: { conversations: await buildConversationViews(conversations, me) } });
};

// POST /api/conversations/direct { userId } — find or create the 1-on-1 chat with someone.
export const openDirectConversation: RequestHandler = async (req, res) => {
  const me = authUser(req)._id.toString();
  const { userId } = req.body as OpenDirectInput;

  if (userId === me) throw new AppError(400, "You can't start a chat with yourself");
  const other = await User.exists({ _id: userId, status: 'active' });
  if (!other) throw new AppError(404, 'User not found');

  // Upsert on the unique directKey: two people opening the same chat at once still get ONE conversation.
  const conversation = await Conversation.findOneAndUpdate(
    { directKey: directKeyFor(me, userId) },
    {
      $setOnInsert: {
        type: 'direct',
        createdBy: me,
        members: [{ user: me }, { user: userId }],
        lastMessageAt: new Date(),
      },
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
  );

  res.json({ success: true, data: { conversation: await buildConversationView(conversation, me) } });
};

// GET /api/conversations/:id
export const getConversation: RequestHandler = async (req, res) => {
  const me = authUser(req)._id.toString();
  const conversation = await findMemberConversation(req.params.id, me);
  res.json({ success: true, data: { conversation: await buildConversationView(conversation, me) } });
};

// GET /api/conversations/:id/messages?before=<messageId>&limit=30 — history, oldest -> newest.
// Cursor pagination: pass the oldest id you have as `before` to load the page above it.
export const listMessages: RequestHandler = async (req, res) => {
  const me = authUser(req)._id.toString();
  const conversation = await findMemberConversation(req.params.id, me);

  const parsed = messagesQuerySchema.safeParse(req.query);
  if (!parsed.success) throw new AppError(400, 'Validation failed', z.flattenError(parsed.error).fieldErrors);
  const { before, limit } = parsed.data;

  const page = await Message.find({ conversation: conversation._id, ...(before ? { _id: { $lt: before } } : {}) })
    .sort({ _id: -1 })
    .limit(limit + 1); // one extra tells us whether there's more above

  const hasMore = page.length > limit;
  const messages = page.slice(0, limit).reverse().map(toPublicMessage);

  res.json({
    success: true,
    data: { messages, hasMore, nextCursor: hasMore ? (messages[0]?.id ?? null) : null },
  });
};

// Safe retries: if this clientId was already saved (e.g. the response was lost), return that message.
async function findRetry(senderId: string, clientId: string | undefined) {
  return clientId ? Message.findOne({ sender: senderId, clientId }) : null;
}

// POST /api/conversations/:id/messages { text, clientId? }
export const sendMessage: RequestHandler = async (req, res) => {
  const me = authUser(req)._id.toString();
  const conversation = await findMemberConversation(req.params.id, me);
  const { text, clientId, replyTo } = req.body as SendMessageInput;

  const existing = await findRetry(me, clientId);
  if (existing) {
    res.json({ success: true, data: { message: toPublicMessage(existing) } });
    return;
  }

  const message = await Message.create({
    conversation: conversation._id,
    sender: me,
    type: 'text',
    text,
    clientId,
    replyTo: await buildReplySnapshot(conversation._id, replyTo),
  });
  res.status(201).json({ success: true, data: { message: await publishNewMessage(conversation, message) } });
};

// POST /api/conversations/:id/media  (multipart/form-data)
//   file: the photo or recording · kind: "image" | "voice" · clientId? · text? (photo caption)
//   durationMs + waveform (JSON array) for voice notes
export const sendMediaMessage: RequestHandler = async (req, res) => {
  const me = authUser(req)._id.toString();
  const conversation = await findMemberConversation(req.params.id, me);

  const parsed = mediaMessageSchema.safeParse(req.body ?? {});
  if (!parsed.success) throw new AppError(400, 'Validation failed', z.flattenError(parsed.error).fieldErrors);
  const { kind, clientId, text, durationMs, waveform, replyTo } = parsed.data;
  if (!req.file) throw new AppError(400, 'No file uploaded');

  const existing = await findRetry(me, clientId);
  if (existing) {
    res.json({ success: true, data: { message: toPublicMessage(existing) } });
    return;
  }

  const replySnapshot = await buildReplySnapshot(conversation._id, replyTo); // validate before storing the file

  let media: StoredMedia;
  if (kind === 'image') {
    media = await storeImage(req.file.buffer);
  } else {
    if (!durationMs) throw new AppError(400, 'Validation failed', { durationMs: ['Voice notes need a duration'] });
    media = await storeVoice(req.file.buffer, Math.min(durationMs, MEDIA_LIMITS.voiceMaxMs), waveform ?? []);
  }

  let message: MessageDoc;
  try {
    message = await Message.create({
      conversation: conversation._id,
      sender: me,
      type: kind,
      text: kind === 'image' ? (text ?? '') : '',
      media,
      clientId,
      replyTo: replySnapshot,
    });
  } catch (err) {
    await deleteMedia(media.key); // don't leave an orphaned file behind
    throw err;
  }

  res.status(201).json({ success: true, data: { message: await publishNewMessage(conversation, message) } });
};

// POST /api/conversations/:id/read — I've seen everything up to now (clears my unread badge).
export const markRead: RequestHandler = async (req, res) => {
  const me = authUser(req)._id.toString();
  const conversation = await findMemberConversation(req.params.id, me);
  const lastReadAt = new Date();

  await Conversation.updateOne(
    { _id: conversation._id, 'members.user': me },
    { $set: { 'members.$.lastReadAt': lastReadAt, 'members.$.unreadCount': 0 } },
  );

  emitToUsers(memberIds(conversation), 'conversation:read', {
    conversationId: conversation._id.toString(),
    userId: me,
    lastReadAt: lastReadAt.toISOString(),
  });

  res.json({ success: true, data: { lastReadAt } });
};

// GET /api/conversations/:id/media — recent photos, for the "Shared media" grid in chat info.
export const listSharedMedia: RequestHandler = async (req, res) => {
  const me = authUser(req)._id.toString();
  const conversation = await findMemberConversation(req.params.id, me);
  const photos = await Message.find({ conversation: conversation._id, type: 'image', deletedAt: null })
    .sort({ _id: -1 })
    .limit(30);
  res.json({ success: true, data: { messages: photos.map(toPublicMessage) } });
};
