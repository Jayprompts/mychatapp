import type { RequestHandler } from 'express';
import { z } from 'zod';
import { Comment, type CommentDoc } from '../models/Comment.js';
import { CommentLike } from '../models/CommentLike.js';
import { Post, type PostDoc } from '../models/Post.js';
import type { UserDoc } from '../models/User.js';
import { authUser } from '../middleware/auth.js';
import { announceComments, buildComment, buildThreads, canDeleteComment, removeComment } from '../services/comments.js';
import { findPost } from '../services/posts.js';
import { mentionedUsers, notify, retract } from '../services/notifications.js';
import { AppError } from '../utils/AppError.js';
import { parseObjectId } from '../utils/objectId.js';
import { commentsQuerySchema, type CreateCommentInput } from '../validators/blog.schemas.js';

async function publishedPost(id: unknown, viewer: UserDoc) {
  const post = await findPost(id, viewer);
  if (post.status !== 'published') throw new AppError(400, 'Comments open once the post is published');
  return post;
}

// A comment plus its post (which must still be visible to this user).
async function findComment(id: unknown, viewer: UserDoc): Promise<{ comment: CommentDoc; post: PostDoc }> {
  const comment = await Comment.findById(parseObjectId(id, 'comment id'));
  if (!comment) throw new AppError(404, 'Comment not found');
  const post = await findPost(comment.post.toString(), viewer);
  return { comment, post };
}

const bumpCount = (post: PostDoc, by: 1 | -1) =>
  Post.updateOne({ _id: post._id }, { $inc: { commentCount: by, engagement: 2 * by } });

// Who hears about a new comment: the person replied to, the post's author, anyone @mentioned —
// each person once, with the most specific reason.
async function notifyComment(post: PostDoc, comment: CommentDoc, repliedTo: CommentDoc | null, me: UserDoc) {
  const told = new Set<string>([me._id.toString()]);
  const base = { actor: me, post: post._id, comment: comment._id, title: post.title, preview: comment.body };
  if (repliedTo && !told.has(repliedTo.author.toString())) {
    told.add(repliedTo.author.toString());
    await notify({ ...base, recipient: repliedTo.author, type: 'comment_reply' });
  }
  if (!told.has(post.author.toString())) {
    told.add(post.author.toString());
    await notify({ ...base, recipient: post.author, type: 'post_comment' });
  }
  for (const id of await mentionedUsers(comment.body)) {
    if (told.has(id)) continue;
    told.add(id);
    await notify({ ...base, recipient: id, type: 'mention' });
  }
}

// GET /api/posts/:id/comments?after=&limit= — threads, oldest first
export const list: RequestHandler = async (req, res) => {
  const me = authUser(req);
  const post = await findPost(req.params.id, me);
  const parsed = commentsQuerySchema.safeParse(req.query);
  if (!parsed.success) throw new AppError(400, 'Validation failed', z.flattenError(parsed.error).fieldErrors);
  const { after, limit } = parsed.data;

  const roots = await Comment.find({ post: post._id, parent: null, ...(after ? { _id: { $gt: after } } : {}) })
    .sort({ _id: 1 })
    .limit(limit + 1);
  const page = roots.slice(0, limit);
  res.json({
    success: true,
    data: { comments: await buildThreads(page, post, me), hasMore: roots.length > limit, total: post.commentCount },
  });
};

// POST /api/posts/:id/comments { body, parentId? }
export const create: RequestHandler = async (req, res) => {
  const me = authUser(req);
  const post = await publishedPost(req.params.id, me);
  const { body, parentId } = req.body as CreateCommentInput;

  let parent: CommentDoc | null = null;
  let replyTo = null;
  let repliedTo: CommentDoc | null = null;
  if (parentId) {
    const target = await Comment.findOne({ _id: parentId, post: post._id });
    if (!target || (target.deletedAt && !target.parent)) throw new AppError(404, "That comment isn't there any more");
    parent = target.parent ? await Comment.findById(target.parent) : target; // replies to replies join the thread
    if (!parent) throw new AppError(404, "That comment isn't there any more");
    if (!target.author.equals(me._id)) replyTo = target.author;
    repliedTo = target;
  }

  const comment = await Comment.create({ post: post._id, author: me._id, parent: parent?._id ?? null, replyTo, body });
  await bumpCount(post, 1);
  announceComments(post);
  void notifyComment(post, comment, repliedTo, me);
  res.status(201).json({ success: true, data: { comment: await buildComment(comment, post, me) } });
};

// PATCH /api/comments/:id { body } — your own comments
export const edit: RequestHandler = async (req, res) => {
  const me = authUser(req);
  const { comment, post } = await findComment(req.params.id, me);
  if (!comment.author.equals(me._id) || comment.deletedAt) throw new AppError(403, 'You can only edit your own comments');

  comment.body = (req.body as { body: string }).body;
  comment.editedAt = new Date();
  await comment.save();
  announceComments(post);
  res.json({ success: true, data: { comment: await buildComment(comment, post, me) } });
};

// DELETE /api/comments/:id — author, the post's author, or a moderator
export const remove: RequestHandler = async (req, res) => {
  const me = authUser(req);
  const { comment, post } = await findComment(req.params.id, me);
  if (comment.deletedAt) throw new AppError(404, 'Comment not found');
  if (!canDeleteComment(comment, post, me)) throw new AppError(403, "You can't delete this comment");

  await removeComment(comment, post);
  res.json({ success: true, data: { deleted: true } });
};

// POST / DELETE /api/comments/:id/like
export const like: RequestHandler = async (req, res) => {
  const me = authUser(req);
  const { comment } = await findComment(req.params.id, me);
  if (comment.deletedAt) throw new AppError(400, "Deleted comments can't be liked");
  let added = true;
  try {
    await CommentLike.create({ comment: comment._id, user: me._id });
  } catch (err) {
    if ((err as { code?: number }).code !== 11000) throw err;
    added = false;
  }
  const updated = added ? await Comment.findByIdAndUpdate(comment._id, { $inc: { likeCount: 1 } }, { returnDocument: 'after' }) : comment;
  if (added) {
    const { post } = await findComment(req.params.id, me);
    void notify({ recipient: comment.author, type: 'comment_like', actor: me, post: post._id, comment: comment._id, title: post.title, preview: comment.body, groupKey: `comment_like:${comment._id.toString()}` });
  }
  res.json({ success: true, data: { liked: true, likeCount: updated?.likeCount ?? comment.likeCount } });
};

export const unlike: RequestHandler = async (req, res) => {
  const me = authUser(req);
  const { comment } = await findComment(req.params.id, me);
  const { deletedCount } = await CommentLike.deleteOne({ comment: comment._id, user: me._id });
  if (deletedCount) void retract(comment.author, `comment_like:${comment._id.toString()}`, me._id);
  const updated = deletedCount ? await Comment.findByIdAndUpdate(comment._id, { $inc: { likeCount: -1 } }, { returnDocument: 'after' }) : comment;
  res.json({ success: true, data: { liked: false, likeCount: updated?.likeCount ?? comment.likeCount } });
};
