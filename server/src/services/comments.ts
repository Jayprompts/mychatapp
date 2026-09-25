import { Comment, type CommentDoc } from '../models/Comment.js';
import { CommentLike } from '../models/CommentLike.js';
import { Post, type PostDoc } from '../models/Post.js';
import { USER_SUMMARY_FIELDS, User, toUserSummary, type UserDoc } from '../models/User.js';
import { emitToPost } from '../sockets/index.js';
import { isOnline } from './presence.js';
import { canModerate, isAuthor } from './posts.js';

// Who may remove a comment: its author, the post's author (their own comment section), or a moderator.
export const canDeleteComment = (c: CommentDoc, post: PostDoc, user: UserDoc) =>
  c.author.toString() === user._id.toString() || isAuthor(post, user._id.toString()) || canModerate(user);

type State = { liked: Set<string>; users: Map<string, UserDoc>; post: PostDoc; viewer: UserDoc };

function toCommentView(c: CommentDoc, s: State) {
  const author = s.users.get(c.author.toString());
  const replyTo = c.replyTo ? s.users.get(c.replyTo.toString()) : null;
  const deleted = !!c.deletedAt;
  return {
    id: c._id.toString(),
    postId: c.post.toString(),
    parentId: c.parent?.toString() ?? null,
    author: deleted || !author ? null : toUserSummary(author, isOnline(author._id.toString())),
    replyTo: replyTo ? { id: replyTo._id.toString(), displayName: replyTo.displayName, username: replyTo.username } : null,
    body: deleted ? '' : c.body,
    deleted,
    likeCount: c.likeCount,
    liked: s.liked.has(c._id.toString()),
    editedAt: c.editedAt,
    createdAt: c.createdAt,
    canEdit: !deleted && c.author.toString() === s.viewer._id.toString(),
    canDelete: !deleted && canDeleteComment(c, s.post, s.viewer),
  };
}
export type CommentView = ReturnType<typeof toCommentView>;

async function stateFor(comments: CommentDoc[], post: PostDoc, viewer: UserDoc): Promise<State> {
  const userIds = new Set<string>();
  for (const c of comments) {
    userIds.add(c.author.toString());
    if (c.replyTo) userIds.add(c.replyTo.toString());
  }
  const [likes, users] = await Promise.all([
    CommentLike.find({ user: viewer._id, comment: { $in: comments.map((c) => c._id) } }).select('comment'),
    User.find({ _id: { $in: [...userIds] } }).select(USER_SUMMARY_FIELDS),
  ]);
  return {
    liked: new Set(likes.map((l) => l.comment.toString())),
    users: new Map(users.map((u) => [u._id.toString(), u])),
    post,
    viewer,
  };
}

// Threads: each first-level comment with its replies (oldest first).
export async function buildThreads(roots: CommentDoc[], post: PostDoc, viewer: UserDoc) {
  const replies = roots.length
    ? await Comment.find({ post: post._id, parent: { $in: roots.map((r) => r._id) } }).sort({ _id: 1 }).limit(1000)
    : [];
  const state = await stateFor([...roots, ...replies], post, viewer);
  return roots.map((root) => ({
    ...toCommentView(root, state),
    replies: replies.filter((r) => r.parent!.equals(root._id)).map((r) => toCommentView(r, state)),
  }));
}

export async function buildComment(c: CommentDoc, post: PostDoc, viewer: UserDoc) {
  return toCommentView(c, await stateFor([c], post, viewer));
}

// Everyone looking at the post refetches its comments (and counts).
export const announceComments = (post: PostDoc) => emitToPost(post._id.toString(), 'post:comments', { postId: post._id.toString() });

// Removes a comment (no permission checks — callers decide who may). A comment with replies
// becomes "Comment deleted" so the thread still reads; the last reply under one takes it with it.
export async function removeComment(comment: CommentDoc, post: PostDoc) {
  const hasReplies = !comment.parent && (await Comment.exists({ parent: comment._id }));
  if (hasReplies) {
    await Comment.updateOne({ _id: comment._id }, { $set: { deletedAt: new Date(), body: '' } });
  } else {
    await Promise.all([Comment.deleteOne({ _id: comment._id }), CommentLike.deleteMany({ comment: comment._id })]);
    if (comment.parent) {
      const root = await Comment.findById(comment.parent);
      if (root?.deletedAt && !(await Comment.exists({ parent: root._id }))) {
        await Promise.all([Comment.deleteOne({ _id: root._id }), CommentLike.deleteMany({ comment: root._id })]);
      }
    }
  }
  await Post.updateOne({ _id: post._id }, { $inc: { commentCount: -1, engagement: -2 } });
  announceComments(post);
}
