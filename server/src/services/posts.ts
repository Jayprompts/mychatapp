import { Bookmark } from '../models/Bookmark.js';
import { Comment } from '../models/Comment.js';
import { CommentLike } from '../models/CommentLike.js';
import { Post, type PostDoc } from '../models/Post.js';
import { PostLike } from '../models/PostLike.js';
import { USER_SUMMARY_FIELDS, User, toUserSummary, type UserDoc } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { parseObjectId } from '../utils/objectId.js';
import { deleteMedia } from './media.js';
import { removeNotificationsFor } from './notifications.js';
import { isOnline } from './presence.js';

// Site roles that may edit/remove anyone's post (RBAC, per the plan).
export const canModerate = (user: UserDoc) => user.role === 'super_admin' || user.role === 'content_mod';
export const isAuthor = (post: PostDoc, userId: string) => post.author.toString() === userId;

// Drafts are invisible to everyone but their author (and moderators) — a 404, not a 403, so ids don't leak.
export async function findPost(id: unknown, viewer: UserDoc): Promise<PostDoc> {
  const post = await Post.findById(parseObjectId(id, 'post id'));
  if (!post) throw new AppError(404, 'Post not found');
  if (post.status !== 'published' && !isAuthor(post, viewer._id.toString()) && !canModerate(viewer)) {
    throw new AppError(404, 'Post not found');
  }
  return post;
}

// ── Markdown-lite helpers ────────────────────────────
export function plainText(markdown: string): string {
  return markdown
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*(?:[-*]|\d+\.)\s+/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

// Summaries start at the first real sentence — headings are skipped.
export function autoExcerpt(markdown: string): string {
  const text = plainText(markdown.replace(/^#{1,6}\s+.*$/gm, ''));
  if (text.length <= 200) return text;
  return text.slice(0, 200).replace(/\s+\S*$/, '') + '…';
}

export const readMinutesFor = (markdown: string) => Math.max(1, Math.round(plainText(markdown).split(' ').filter(Boolean).length / 220));

// ── What the API sends ───────────────────────────────
const version = (p: PostDoc) => p.updatedAt.getTime();
export const coverUrlFor = (p: PostDoc) => (p.coverKey ? `/api/posts/${p._id.toString()}/cover?v=${version(p)}` : null);

type ViewerState = { liked: Set<string>; bookmarked: Set<string>; authors: Map<string, UserDoc> };

export function toPostCard(p: PostDoc, s: ViewerState) {
  const id = p._id.toString();
  const author = s.authors.get(p.author.toString());
  return {
    id,
    title: p.title,
    excerpt: p.excerpt,
    tag: p.tag,
    coverTheme: p.coverTheme,
    coverUrl: coverUrlFor(p),
    status: p.status,
    featured: p.featured,
    author: author ? toUserSummary(author, isOnline(author._id.toString())) : null, // null if the account was deleted
    likeCount: p.likeCount,
    commentCount: p.commentCount,
    readMinutes: p.readMinutes,
    imageCount: p.images.length,
    liked: s.liked.has(id),
    bookmarked: s.bookmarked.has(id),
    publishedAt: p.publishedAt,
    updatedAt: p.updatedAt,
  };
}
export type PostCard = ReturnType<typeof toPostCard>;

// Everything a list of cards needs, in 3 queries whatever the page size.
async function viewerState(posts: PostDoc[], viewerId: string): Promise<ViewerState> {
  const ids = posts.map((p) => p._id);
  const [likes, marks, authors] = await Promise.all([
    PostLike.find({ user: viewerId, post: { $in: ids } }).select('post'),
    Bookmark.find({ user: viewerId, post: { $in: ids } }).select('post'),
    User.find({ _id: { $in: [...new Set(posts.map((p) => p.author.toString()))] } }).select(USER_SUMMARY_FIELDS),
  ]);
  return {
    liked: new Set(likes.map((l) => l.post.toString())),
    bookmarked: new Set(marks.map((b) => b.post.toString())),
    authors: new Map(authors.map((a) => [a._id.toString(), a])),
  };
}

export async function buildPostCards(posts: PostDoc[], viewerId: string) {
  const state = await viewerState(posts, viewerId);
  return posts.map((p) => toPostCard(p, state));
}

export async function buildPostDetail(p: PostDoc, viewer: UserDoc) {
  const viewerId = viewer._id.toString();
  const [card] = await buildPostCards([p], viewerId);
  const mine = isAuthor(p, viewerId);
  return {
    ...card,
    body: p.body,
    images: p.images.map((img) => ({
      id: img._id.toString(),
      url: `/api/posts/${p._id.toString()}/images/${img._id.toString()}`,
      width: img.width,
      height: img.height,
    })),
    canEdit: mine,
    canDelete: mine || canModerate(viewer),
    createdAt: p.createdAt,
  };
}

// Post + its likes, bookmarks, comments and files. (Reports stay, for the moderators' records.)
export async function destroyPost(p: PostDoc) {
  const keys = [p.coverKey, ...p.images.map((i) => i.key)].filter((k): k is string => !!k);
  const commentIds = await Comment.find({ post: p._id }).distinct('_id');
  await Promise.all([
    PostLike.deleteMany({ post: p._id }),
    Bookmark.deleteMany({ post: p._id }),
    CommentLike.deleteMany({ comment: { $in: commentIds } }),
    Comment.deleteMany({ post: p._id }),
    Post.deleteOne({ _id: p._id }),
  ]);
  await Promise.all(keys.map(deleteMedia));
  await removeNotificationsFor({ post: p._id });
}
