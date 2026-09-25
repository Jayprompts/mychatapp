import type { RequestHandler } from 'express';
import { Comment } from '../models/Comment.js';
import { Report } from '../models/Report.js';
import { User } from '../models/User.js';
import { authUser } from '../middleware/auth.js';
import { findPost } from '../services/posts.js';
import { AppError } from '../utils/AppError.js';
import type { CreateReportInput } from '../validators/report.schemas.js';

// POST /api/reports { targetType, targetId, reason, details? }
export const create: RequestHandler = async (req, res) => {
  const me = authUser(req);
  const { targetType, targetId, reason, details } = req.body as CreateReportInput;

  // The reporter must be able to see what they report; nobody reports themselves.
  let post = null;
  let targetAuthor;
  if (targetType === 'user') {
    const user = await User.findOne({ _id: targetId, status: { $ne: 'deleted' } }).select('_id');
    if (!user) throw new AppError(404, 'User not found');
    targetAuthor = user._id;
  } else if (targetType === 'post') {
    post = await findPost(targetId, me);
    targetAuthor = post.author;
  } else {
    const comment = await Comment.findById(targetId);
    if (!comment || comment.deletedAt) throw new AppError(404, 'Comment not found');
    post = await findPost(comment.post.toString(), me);
    targetAuthor = comment.author;
  }
  if (targetAuthor.equals(me._id)) throw new AppError(400, targetType === 'user' ? "You can't report yourself" : "You can't report your own content");

  try {
    await Report.create({ reporter: me._id, targetType, target: targetId, post: post?._id ?? null, targetAuthor, reason, details: details ?? '' });
  } catch (err) {
    if ((err as { code?: number }).code !== 11000) throw err;
    res.json({ success: true, data: { reported: true, alreadyReported: true } }); // same answer — no harm in asking twice
    return;
  }
  res.status(201).json({ success: true, data: { reported: true, alreadyReported: false } });
};
