import { z } from 'zod';
import { POST_COVERS, POST_STATUSES, POST_TAGS } from '../models/Post.js';
import { objectIdSchema } from '../utils/objectId.js';

// Drafts may be half-written; the rules for publishing are checked in the controller.
const postFields = {
  title: z.string().trim().max(140, 'Title is too long (max 140 characters)'),
  body: z.string().max(20000, 'Post is too long (max 20,000 characters)'),
  excerpt: z.string().trim().max(240, 'Summary is too long (max 240 characters)'),
  tag: z.enum(POST_TAGS),
  coverTheme: z.enum(POST_COVERS),
  status: z.enum(POST_STATUSES),
};

export const createPostSchema = z.object({
  ...postFields,
  title: postFields.title.default(''),
  body: postFields.body.default(''),
  excerpt: postFields.excerpt.optional(),
  tag: postFields.tag.default('Other'),
  coverTheme: postFields.coverTheme.default('grove'),
  status: postFields.status.default('draft'),
});

export const updatePostSchema = z
  .object({
    ...postFields,
    removeCover: z.literal(true),
    imageOrder: z.array(objectIdSchema).max(20), // gallery re-ordered in the editor
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, 'Nothing to update');

export const feedQuerySchema = z.object({
  sort: z.enum(['latest', 'liked', 'trending']).default('latest'),
  tag: z.enum(POST_TAGS).optional(),
  author: objectIdSchema.optional(),
  page: z.coerce.number().int().min(1).max(200).default(1),
});

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(200).default(1),
  status: z.enum(POST_STATUSES).optional(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;

const commentBody = z.string().trim().min(1, 'Write something first').max(2000, 'Comment is too long (max 2000 characters)');

export const createCommentSchema = z.object({
  body: commentBody,
  parentId: objectIdSchema.optional(), // reply to this comment (or to a reply — it joins the same thread)
});
export const editCommentSchema = z.object({ body: commentBody });

export const commentsQuerySchema = z.object({
  after: objectIdSchema.optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
