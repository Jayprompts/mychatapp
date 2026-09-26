import type { RequestHandler } from 'express';
import type { Types } from 'mongoose';
import { Comment } from '../models/Comment.js';
import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';
import { Report } from '../models/Report.js';
import { User } from '../models/User.js';
import { authUser } from '../middleware/auth.js';
import { findPost } from '../services/posts.js';
import { AppError } from '../utils/AppError.js';
import type { CreateReportInput } from '../validators/report.schemas.js';

const clip = (s: string) => (s.length > 500 ? s.slice(0, 499) + '…' : s);

// POST /api/reports { targetType, targetId, reason, details? }
// You can only report what you can see, never yourself; the report keeps a snapshot of what it said.
export const create: RequestHandler = async (req, res) => {
  const me = authUser(req);
  const { targetType, targetId, reason, details } = req.body as CreateReportInput;

  let targetAuthor: Types.ObjectId;
  let post: Types.ObjectId | null = null;
  let conversation: Types.ObjectId | null = null;
  let snapshot = '';

  if (targetType === 'user') {
    const user = await User.findOne({ _id: targetId, status: { $ne: 'deleted' } }).select('_id displayName username');
    if (!user) throw new AppError(404, 'User not found');
    targetAuthor = user._id;
    snapshot = `${user.displayName} (@${user.username})`;
  } else if (targetType === 'post') {
    const p = await findPost(targetId, me);
    targetAuthor = p.author;
    post = p._id;
    snapshot = p.title;
  } else if (targetType === 'comment') {
    const comment = await Comment.findById(targetId);
    if (!comment || comment.deletedAt) throw new AppError(404, 'Comment not found');
    post = (await findPost(comment.post.toString(), me))._id;
    targetAuthor = comment.author;
    snapshot = comment.body;
  } else {
    // A chat message: only members of that chat can report it.
    const message = await Message.findById(targetId);
    if (!message || message.deletedAt || message.type === 'system') throw new AppError(404, 'Message not found');
    const member = await Conversation.exists({ _id: message.conversation, 'members.user': me._id });
    if (!member) throw new AppError(404, 'Message not found');
    targetAuthor = message.sender;
    conversation = message.conversation;
    snapshot = message.text || (message.type === 'image' ? '📷 Photo' : message.type === 'voice' ? '🎤 Voice message' : '');
  }
  if (targetAuthor.equals(me._id)) throw new AppError(400, targetType === 'user' ? "You can't report yourself" : "You can't report your own content");

  try {
    await Report.create({ reporter: me._id, targetType, target: targetId, post, conversation, targetAuthor, reason, details: details ?? '', snapshot: clip(snapshot) });
  } catch (err) {
    if ((err as { code?: number }).code !== 11000) throw err;
    res.json({ success: true, data: { reported: true, alreadyReported: true } }); // same answer — no harm in asking twice
    return;
  }
  res.status(201).json({ success: true, data: { reported: true, alreadyReported: false } });
};
