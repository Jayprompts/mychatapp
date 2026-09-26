import { Conversation, type ConversationDoc } from '../models/Conversation.js';
import { Types } from 'mongoose';
import { DELETED_PREVIEW, Message, previewFor, toPublicMessage, type MessageDoc, type SystemEventKind } from '../models/Message.js';
import { deleteMedia } from './media.js';
import type { UserDoc } from '../models/User.js';
import { emitToUsers } from '../sockets/index.js';
import { AppError } from '../utils/AppError.js';
import { parseObjectId } from '../utils/objectId.js';

// Shared by the chat + group controllers: access checks, publishing messages, system events.

export const memberIds = (c: ConversationDoc) => c.members.map((m) => m.user.toString());

export function roleOf(c: ConversationDoc, userId: string) {
  return c.members.find((m) => m.user.toString() === userId)?.role;
}

// Loads a conversation only if the user is a member. Non-members get 404 (not 403),
// so the API never confirms that someone else's conversation exists.
export async function findMemberConversation(conversationId: unknown, userId: string): Promise<ConversationDoc> {
  const id = parseObjectId(conversationId, 'conversation id');
  const conversation = await Conversation.findOne({ _id: id, 'members.user': userId });
  if (!conversation) throw new AppError(404, 'Conversation not found');
  return conversation;
}

// After ANY new message: update the chat list preview, unread counts and "sender has read everything"
// in one atomic write, then push it live to every member. System lines don't count as unread.
export async function publishNewMessage(conversation: ConversationDoc, message: MessageDoc, { countUnread = true } = {}) {
  await Conversation.updateOne(
    { _id: conversation._id },
    {
      $set: {
        lastMessage: {
          messageId: message._id,
          sender: message.sender,
          type: message.type,
          preview: previewFor(message.type, message.text),
          createdAt: message.createdAt,
          system: message.type === 'system' ? toPublicMessage(message).system : null,
        },
        lastMessageAt: message.createdAt,
        'members.$[me].lastReadAt': message.createdAt,
        'members.$[me].unreadCount': 0,
      },
      ...(countUnread ? { $inc: { 'members.$[other].unreadCount': 1 } } : {}),
    },
    {
      arrayFilters: countUnread
        ? [{ 'me.user': message.sender }, { 'other.user': { $ne: message.sender } }]
        : [{ 'me.user': message.sender }],
    },
  );

  const payload = toPublicMessage(message);
  const everyone = memberIds(conversation);
  emitToUsers(everyone, 'message:new', { message: payload }); // includes my other tabs/devices
  emitToUsers(everyone, 'conversation:read', {
    conversationId: payload.conversationId,
    userId: message.sender.toString(),
    lastReadAt: message.createdAt.toISOString(),
  });
  return payload;
}

type Person = { id: string; name: string };
const person = (u: UserDoc): Person => ({ id: u._id.toString(), name: u.displayName });
const names = (people: Person[]) =>
  people.length <= 2 ? people.map((p) => p.name).join(' and ') : `${people[0].name}, ${people[1].name} and ${people.length - 2} others`;

// "Jay added Ana and Ben" — stored as data (so the client can say "You") plus a ready-made sentence.
export async function postSystemEvent(
  conversation: ConversationDoc,
  actor: UserDoc,
  event: { kind: SystemEventKind; targets?: Person[]; name?: string; role?: string },
) {
  const a = actor.displayName;
  const t = names(event.targets ?? []);
  const scope = conversation.type === 'community' ? 'community' : 'group';
  const text = {
    created: `${a} created the ${scope} "${event.name}"`,
    added: `${a} added ${t}`,
    removed: `${a} removed ${t}`,
    left: `${a} left the ${scope}`,
    renamed: `${a} renamed the ${scope} to "${event.name}"`,
    role: `${a} made ${t} ${event.role === 'admin' ? 'an admin' : 'a member'}`,
    joined: `${a} joined the ${scope}`,
  }[event.kind];

  const message = await Message.create({
    conversation: conversation._id,
    sender: actor._id,
    type: 'system',
    text,
    system: { kind: event.kind, actor: person(actor), targets: event.targets, name: event.name, role: event.role, scope },
  });
  return publishNewMessage(conversation, message, { countUnread: false });
}

export { person };

// Tell members to refresh a conversation's details (name, members, roles…).
export function emitConversationUpdated(conversation: ConversationDoc, extraUserIds: string[] = []) {
  emitToUsers([...memberIds(conversation), ...extraUserIds], 'conversation:updated', {
    conversationId: conversation._id.toString(),
  });
}

// A message inside a conversation the user belongs to (404 otherwise).
export async function findMemberMessage(conversationId: unknown, messageId: unknown, userId: string) {
  const conversation = await findMemberConversation(conversationId, userId);
  const id = parseObjectId(messageId, 'message id');
  const message = await Message.findOne({ _id: id, conversation: conversation._id });
  if (!message) throw new AppError(404, 'Message not found');
  return { conversation, message };
}

// Snapshot of the message being replied to (must be in the same conversation and not deleted).
export async function buildReplySnapshot(conversationId: Types.ObjectId, replyToId: string | undefined) {
  if (!replyToId) return null;
  const original = await Message.findOne({ _id: replyToId, conversation: conversationId, deletedAt: null, type: { $ne: 'system' } });
  if (!original) throw new AppError(400, "You can't reply to that message");
  return {
    messageId: original._id,
    sender: original.sender,
    type: original.type,
    preview: previewFor(original.type, original.text),
  };
}

// Push an edited / unsent / reacted-to message to everyone in the conversation.
export function emitMessageUpdated(conversation: ConversationDoc, message: MessageDoc) {
  emitToUsers(memberIds(conversation), 'message:updated', { message: toPublicMessage(message) });
}

// Unsend: the text and file go, a "message deleted" placeholder stays, quotes of it and the chat-list
// preview update, and everyone sees it live. Used by "Unsend" and by moderators removing a message.
export async function unsendMessage(conversation: ConversationDoc, message: MessageDoc) {
  if (message.deletedAt) return;
  const fileKey = message.media?.key;
  message.deletedAt = new Date();
  message.text = '';
  message.media = null;
  message.set('reactions', []);
  await message.save();

  await Promise.all([
    fileKey ? deleteMedia(fileKey) : null, // the photo / voice note is removed from the server
    Message.updateMany({ 'replyTo.messageId': message._id }, { $set: { 'replyTo.deleted': true, 'replyTo.preview': '' } }),
    Conversation.updateOne(
      { _id: conversation._id, 'lastMessage.messageId': message._id },
      { $set: { 'lastMessage.preview': DELETED_PREVIEW } },
    ),
  ]);
  emitMessageUpdated(conversation, message);
}
