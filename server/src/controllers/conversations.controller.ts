import type { RequestHandler } from 'express';
import { z } from 'zod';
import { Conversation, directKeyFor, type ConversationDoc } from '../models/Conversation.js';
import { Message, toPublicMessage } from '../models/Message.js';
import { User } from '../models/User.js';
import { authUser } from '../middleware/auth.js';
import { buildConversationView, buildConversationViews } from '../services/conversationView.js';
import { emitToUsers } from '../sockets/index.js';
import { AppError } from '../utils/AppError.js';
import { parseObjectId } from '../utils/objectId.js';
import { messagesQuerySchema, type OpenDirectInput, type SendMessageInput } from '../validators/chat.schemas.js';

const memberIds = (c: ConversationDoc) => c.members.map((m) => m.user.toString());

// Loads a conversation only if the user is a member. Non-members get 404 (not 403),
// so the API never confirms that someone else's conversation exists.
async function findMemberConversation(conversationId: unknown, userId: string): Promise<ConversationDoc> {
  const id = parseObjectId(conversationId, 'conversation id');
  const conversation = await Conversation.findOne({ _id: id, 'members.user': userId });
  if (!conversation) throw new AppError(404, 'Conversation not found');
  return conversation;
}

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

// POST /api/conversations/:id/messages { text, clientId? }
export const sendMessage: RequestHandler = async (req, res) => {
  const me = authUser(req)._id.toString();
  const conversation = await findMemberConversation(req.params.id, me);
  const { text, clientId } = req.body as SendMessageInput;

  // Safe retries: if this clientId was already saved (e.g. the response was lost), return that message.
  if (clientId) {
    const existing = await Message.findOne({ sender: me, clientId });
    if (existing) {
      res.json({ success: true, data: { message: toPublicMessage(existing) } });
      return;
    }
  }

  const message = await Message.create({ conversation: conversation._id, sender: me, type: 'text', text, clientId });

  // One atomic update: new preview, sender has read everything, everyone else gets +1 unread.
  await Conversation.updateOne(
    { _id: conversation._id },
    {
      $set: {
        lastMessage: {
          messageId: message._id,
          sender: message.sender,
          type: message.type,
          preview: message.text.slice(0, 120),
          createdAt: message.createdAt,
        },
        lastMessageAt: message.createdAt,
        'members.$[me].lastReadAt': message.createdAt,
        'members.$[me].unreadCount': 0,
      },
      $inc: { 'members.$[other].unreadCount': 1 },
    },
    { arrayFilters: [{ 'me.user': message.sender }, { 'other.user': { $ne: message.sender } }] },
  );

  const payload = toPublicMessage(message);
  const everyone = memberIds(conversation);
  emitToUsers(everyone, 'message:new', { message: payload }); // includes my other tabs/devices
  emitToUsers(everyone, 'conversation:read', {
    conversationId: payload.conversationId,
    userId: me,
    lastReadAt: message.createdAt.toISOString(),
  });

  res.status(201).json({ success: true, data: { message: payload } });
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
