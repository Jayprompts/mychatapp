import type { Request, RequestHandler } from 'express';
import type { SortOrder } from 'mongoose';
import { z } from 'zod';
import { Bookmark } from '../models/Bookmark.js';
import { MAX_POST_IMAGES, Post, type PostDoc } from '../models/Post.js';
import { PostLike } from '../models/PostLike.js';
import type { UserDoc } from '../models/User.js';
import { authUser } from '../middleware/auth.js';
import { deleteMedia, mediaPath, storeCover, storeImage } from '../services/media.js';
import {
  autoExcerpt,
  buildPostCards,
  buildPostDetail,
  canModerate,
  destroyPost,
  findPost,
  isAuthor,
  plainText,
  readMinutesFor,
} from '../services/posts.js';
import { notify, retract } from '../services/notifications.js';
import { AppError } from '../utils/AppError.js';
import {
  feedQuerySchema,
  listQuerySchema,
  type CreatePostInput,
  type UpdatePostInput,
} from '../validators/blog.schemas.js';

const PAGE_SIZE = 12;
const TRENDING_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

function parseQuery<T extends z.ZodType>(schema: T, req: Request): z.infer<T> {
  const parsed = schema.safeParse(req.query);
  if (!parsed.success) throw new AppError(400, 'Validation failed', z.flattenError(parsed.error).fieldErrors);
  return parsed.data;
}

// Author (or a content moderator, per the RBAC plan) — everyone else gets a 403.
function requireEditor(post: PostDoc, user: UserDoc) {
  if (!isAuthor(post, user._id.toString()) && !canModerate(user)) throw new AppError(403, "You can't change someone else's post");
}

// Publishing needs a real post; drafts can be anything.
function assertPublishable(post: PostDoc) {
  if (post.title.trim().length < 3) throw new AppError(400, 'Give your post a title (at least 3 characters) before publishing');
  if (plainText(post.body).length < 20) throw new AppError(400, 'Write a little more before publishing (at least 20 characters)');
}

const page = <T>(items: T[]) => ({ items: items.slice(0, PAGE_SIZE), hasMore: items.length > PAGE_SIZE });

// GET /api/posts?sort=latest|liked|trending&tag=&author=&page=
export const feed: RequestHandler = async (req, res) => {
  const me = authUser(req)._id.toString();
  const { sort, tag, author, page: n } = parseQuery(feedQuerySchema, req);

  const filter: Record<string, unknown> = {
    status: 'published',
    ...(tag ? { tag } : {}),
    ...(author ? { author } : {}),
    ...(sort === 'trending' ? { publishedAt: { $gte: new Date(Date.now() - TRENDING_WINDOW_MS) } } : {}),
  };
  const order: Record<string, SortOrder> =
    sort === 'liked' ? { likeCount: -1, publishedAt: -1 } : sort === 'trending' ? { engagement: -1, publishedAt: -1 } : { publishedAt: -1, _id: -1 };

  const found = await Post.find(filter).sort(order).skip((n - 1) * PAGE_SIZE).limit(PAGE_SIZE + 1);
  const { items, hasMore } = page(found);
  res.json({ success: true, data: { posts: await buildPostCards(items, me), hasMore } });
};

// GET /api/posts/saved?page= — my bookmarks, newest first
export const saved: RequestHandler = async (req, res) => {
  const me = authUser(req)._id.toString();
  const { page: n } = parseQuery(listQuerySchema, req);
  const marks = await Bookmark.find({ user: me }).sort({ createdAt: -1 }).skip((n - 1) * PAGE_SIZE).limit(PAGE_SIZE + 1);
  const { items, hasMore } = page(marks);

  const posts = await Post.find({ _id: { $in: items.map((b) => b.post) } });
  const byId = new Map(posts.map((p) => [p._id.toString(), p]));
  const visible = items
    .map((b) => byId.get(b.post.toString()))
    .filter((p): p is PostDoc => !!p && (p.status === 'published' || isAuthor(p, me))); // unpublished by its author → hidden
  res.json({ success: true, data: { posts: await buildPostCards(visible, me), hasMore } });
};

// GET /api/posts/mine?status=&page= — my drafts and published posts
export const mine: RequestHandler = async (req, res) => {
  const me = authUser(req)._id.toString();
  const { page: n, status } = parseQuery(listQuerySchema, req);
  const found = await Post.find({ author: me, ...(status ? { status } : {}) })
    .sort({ updatedAt: -1 })
    .skip((n - 1) * PAGE_SIZE)
    .limit(PAGE_SIZE + 1);
  const { items, hasMore } = page(found);
  res.json({ success: true, data: { posts: await buildPostCards(items, me), hasMore } });
};

// POST /api/posts
export const create: RequestHandler = async (req, res) => {
  const me = authUser(req);
  const input = req.body as CreatePostInput;

  const post = new Post({
    ...input,
    author: me._id,
    excerpt: input.excerpt || autoExcerpt(input.body),
    readMinutes: readMinutesFor(input.body),
  });
  if (post.status === 'published') {
    assertPublishable(post);
    post.publishedAt = new Date();
  }
  await post.save();
  res.status(201).json({ success: true, data: { post: await buildPostDetail(post, me) } });
};

// GET /api/posts/:id
export const get: RequestHandler = async (req, res) => {
  const me = authUser(req);
  const post = await findPost(req.params.id, me);
  res.json({ success: true, data: { post: await buildPostDetail(post, me) } });
};

// PATCH /api/posts/:id — edit, publish, or move back to drafts
export const update: RequestHandler = async (req, res) => {
  const me = authUser(req);
  const post = await findPost(req.params.id, me);
  requireEditor(post, me);
  const { removeCover, imageOrder, excerpt, ...changes } = req.body as UpdatePostInput;

  // Keep an automatic summary in step with the body, but never overwrite one the author wrote.
  const hadAutoExcerpt = post.excerpt === autoExcerpt(post.body);
  post.set(changes);
  if (changes.body !== undefined) post.readMinutes = readMinutesFor(post.body);
  if (excerpt !== undefined) post.excerpt = excerpt || autoExcerpt(post.body);
  else if (changes.body !== undefined && hadAutoExcerpt) post.excerpt = autoExcerpt(post.body);

  if (imageOrder) {
    const current = post.images.map((i) => i._id.toString());
    if (imageOrder.length !== current.length || !current.every((id) => imageOrder.includes(id))) {
      throw new AppError(400, 'Image order must list every image once');
    }
    post.images.sort((a, b) => imageOrder.indexOf(a._id.toString()) - imageOrder.indexOf(b._id.toString()));
  }

  const oldCover = removeCover ? post.coverKey : null;
  if (removeCover) post.coverKey = null;

  if (post.status === 'published') {
    assertPublishable(post);
    post.publishedAt ??= new Date(); // first publish; edits keep the original date
  }
  await post.save();
  if (oldCover) await deleteMedia(oldCover);
  res.json({ success: true, data: { post: await buildPostDetail(post, me) } });
};

// DELETE /api/posts/:id — the author, or a moderator
export const remove: RequestHandler = async (req, res) => {
  const me = authUser(req);
  const post = await findPost(req.params.id, me);
  requireEditor(post, me);
  await destroyPost(post);
  res.json({ success: true, data: { deleted: true } });
};

// POST /api/posts/:id/cover (multipart "file")
export const uploadCover: RequestHandler = async (req, res) => {
  const me = authUser(req);
  const post = await findPost(req.params.id, me);
  requireEditor(post, me);
  if (!req.file) throw new AppError(400, 'No file uploaded');

  const key = await storeCover(req.file.buffer, { width: 1600, height: 640 });
  const old = post.coverKey;
  post.coverKey = key;
  await post.save();
  if (old) await deleteMedia(old);
  res.json({ success: true, data: { post: await buildPostDetail(post, me) } });
};

// POST /api/posts/:id/images (multipart "file") — adds one photo to the gallery
export const addImage: RequestHandler = async (req, res) => {
  const me = authUser(req);
  const post = await findPost(req.params.id, me);
  requireEditor(post, me);
  if (!req.file) throw new AppError(400, 'No file uploaded');
  if (post.images.length >= MAX_POST_IMAGES) throw new AppError(400, `A post can have up to ${MAX_POST_IMAGES} photos`);

  const stored = await storeImage(req.file.buffer);
  // Atomic "only if there's still room" — two uploads racing can't push it past the limit.
  const updated = await Post.findOneAndUpdate(
    { _id: post._id, [`images.${MAX_POST_IMAGES - 1}`]: { $exists: false } },
    { $push: { images: { key: stored.key, width: stored.width, height: stored.height } } },
    { returnDocument: 'after' },
  );
  if (!updated) {
    await deleteMedia(stored.key);
    throw new AppError(400, `A post can have up to ${MAX_POST_IMAGES} photos`);
  }
  res.json({ success: true, data: { post: await buildPostDetail(updated, me) } });
};

// DELETE /api/posts/:id/images/:imageId
export const removeImage: RequestHandler = async (req, res) => {
  const me = authUser(req);
  const post = await findPost(req.params.id, me);
  requireEditor(post, me);
  const image = post.images.find((i) => i._id.toString() === req.params.imageId);
  if (!image) throw new AppError(404, 'Image not found');

  post.images.pull(image._id);
  await post.save();
  await deleteMedia(image.key);
  res.json({ success: true, data: { post: await buildPostDetail(post, me) } });
};

// GET /api/posts/:id/cover · /api/posts/:id/images/:imageId — same visibility as the post itself
function sendImage(res: Parameters<RequestHandler>[1], next: Parameters<RequestHandler>[2], key: string) {
  res.setHeader('Cache-Control', 'private, max-age=31536000, immutable'); // a new photo always gets a new URL
  res.type('image/webp');
  res.sendFile(mediaPath(key), (err) => err && !res.headersSent && next(new AppError(404, 'Not found')));
}

export const getCover: RequestHandler = async (req, res, next) => {
  const post = await findPost(req.params.id, authUser(req));
  if (!post.coverKey) throw new AppError(404, 'Not found');
  sendImage(res, next, post.coverKey);
};

export const getImage: RequestHandler = async (req, res, next) => {
  const post = await findPost(req.params.id, authUser(req));
  const image = post.images.find((i) => i._id.toString() === req.params.imageId);
  if (!image) throw new AppError(404, 'Not found');
  sendImage(res, next, image.key);
};

// POST / DELETE /api/posts/:id/like
async function publishedPost(req: Request) {
  const post = await findPost(req.params.id, authUser(req));
  if (post.status !== 'published') throw new AppError(400, "Drafts can't be liked or saved");
  return post;
}

const isDuplicate = (err: unknown) => typeof err === 'object' && err !== null && (err as { code?: number }).code === 11000;

export const like: RequestHandler = async (req, res) => {
  const me = authUser(req)._id;
  const post = await publishedPost(req);
  let added = true;
  try {
    await PostLike.create({ post: post._id, user: me });
  } catch (err) {
    if (!isDuplicate(err)) throw err;
    added = false; // already liked (double tap / second tab) — nothing to do
  }
  const updated = added
    ? await Post.findByIdAndUpdate(post._id, { $inc: { likeCount: 1, engagement: 1 } }, { returnDocument: 'after' })
    : post;
  if (added) {
    void notify({ recipient: post.author, type: 'post_like', actor: authUser(req), post: post._id, title: post.title, groupKey: `post_like:${post._id.toString()}` });
  }
  res.json({ success: true, data: { liked: true, likeCount: updated?.likeCount ?? post.likeCount } });
};

export const unlike: RequestHandler = async (req, res) => {
  const me = authUser(req)._id;
  const post = await publishedPost(req);
  const { deletedCount } = await PostLike.deleteOne({ post: post._id, user: me });
  const updated = deletedCount
    ? await Post.findByIdAndUpdate(post._id, { $inc: { likeCount: -1, engagement: -1 } }, { returnDocument: 'after' })
    : post;
  if (deletedCount) void retract(post.author, `post_like:${post._id.toString()}`, me);
  res.json({ success: true, data: { liked: false, likeCount: updated?.likeCount ?? post.likeCount } });
};

// POST / DELETE /api/posts/:id/bookmark
export const bookmark: RequestHandler = async (req, res) => {
  const me = authUser(req)._id;
  const post = await publishedPost(req);
  await Bookmark.updateOne({ user: me, post: post._id }, { $setOnInsert: { user: me, post: post._id } }, { upsert: true });
  res.json({ success: true, data: { bookmarked: true } });
};

export const unbookmark: RequestHandler = async (req, res) => {
  const me = authUser(req)._id;
  const post = await findPost(req.params.id, authUser(req)); // unsaving works even if it went back to drafts
  await Bookmark.deleteOne({ user: me, post: post._id });
  res.json({ success: true, data: { bookmarked: false } });
};
