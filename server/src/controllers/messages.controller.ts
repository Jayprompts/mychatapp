import type { RequestHandler } from 'express';
import { Conversation } from '../models/Conversation.js';
import { DELETED_PREVIEW, EDIT_WINDOW_MS, Message, previewFor, toPublicMessage } from '../models/Message.js';
import { authUser } from '../middleware/auth.js';
import { assertCanMessage } from '../services/blocks.js';
import { emitMessageUpdated, findMemberMessage } from '../services/conversations.js';
import { deleteMedia } from '../services/media.js';
import { AppError } from '../utils/AppError.js';
import type { EditMessageInput, ReactionInput } from '../validators/chat.schemas.js';

// Actions on an existing message: react, edit, unsend.
// Every change is pushed live as 'message:updated' to all members.

// PUT /api/conversations/:id/messages/:messageId/reaction { emoji } — one reaction per person (replaces yours)
export const react: RequestHandler = async (req, res) => {
  const me = authUser(req)._id;
  const { conversation, message } = await findMemberMessage(req.params.id, req.params.messageId, me.toString());
  if (message.deletedAt || message.type === 'system') throw new AppError(400, "You can't react to that message");
  await assertCanMessage(conversation, me.toString());
  const { emoji } = req.body as ReactionInput;

  await Message.updateOne({ _id: message._id }, { $pull: { reactions: { user: me } } });
  // Guard: if two taps race, the second push finds a reaction already there and does nothing.
  await Message.updateOne({ _id: message._id, 'reactions.user': { $ne: me } }, { $push: { reactions: { emoji, user: me } } });

  const updated = (await Message.findById(message._id))!;
  emitMessageUpdated(conversation, updated);
  res.json({ success: true, data: { message: toPublicMessage(updated) } });
};

// DELETE /api/conversations/:id/messages/:messageId/reaction — remove your reaction
export const unreact: RequestHandler = async (req, res) => {
  const me = authUser(req)._id;
  const { conversation, message } = await findMemberMessage(req.params.id, req.params.messageId, me.toString());

  await Message.updateOne({ _id: message._id }, { $pull: { reactions: { user: me } } });
  const updated = (await Message.findById(message._id))!;
  emitMessageUpdated(conversation, updated);
  res.json({ success: true, data: { message: toPublicMessage(updated) } });
};

// PATCH /api/conversations/:id/messages/:messageId { text } — your own text message, within 15 minutes
export const editMessage: RequestHandler = async (req, res) => {
  const me = authUser(req)._id;
  const { conversation, message } = await findMemberMessage(req.params.id, req.params.messageId, me.toString());
  const { text } = req.body as EditMessageInput;

  if (!message.sender.equals(me)) throw new AppError(403, 'You can only edit your own messages');
  if (message.deletedAt) throw new AppError(400, 'This message was deleted');
  if (message.type !== 'text') throw new AppError(400, 'Only text messages can be edited');
  if (Date.now() - message.createdAt.getTime() > EDIT_WINDOW_MS) {
    throw new AppError(403, 'Messages can only be edited within 15 minutes of sending');
  }

  if (text !== message.text) {
    message.text = text;
    message.editedAt = new Date();
    await message.save();

    const preview = previewFor(message.type, text);
    await Promise.all([
      // Replies quoting this message show the new text…
      Message.updateMany({ 'replyTo.messageId': message._id }, { $set: { 'replyTo.preview': preview } }),
      // …and so does the chat list, if it's the latest message.
      Conversation.updateOne({ _id: conversation._id, 'lastMessage.messageId': message._id }, { $set: { 'lastMessage.preview': preview } }),
    ]);
    emitMessageUpdated(conversation, message);
  }

  res.json({ success: true, data: { message: toPublicMessage(message) } });
};

// DELETE /api/conversations/:id/messages/:messageId — unsend your own message (for everyone)
export const deleteMessage: RequestHandler = async (req, res) => {
  const me = authUser(req)._id;
  const { conversation, message } = await findMemberMessage(req.params.id, req.params.messageId, me.toString());

  if (!message.sender.equals(me)) throw new AppError(403, 'You can only delete your own messages');
  if (message.type === 'system') throw new AppError(400, "That message can't be deleted");
  if (message.deletedAt) {
    res.json({ success: true, data: { message: toPublicMessage(message) } }); // already gone — fine
    return;
  }

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
  res.json({ success: true, data: { message: toPublicMessage(message) } });
};
