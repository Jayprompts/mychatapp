import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';

export const POST_TAGS = ['Tech', 'Design', 'Product', 'Community', 'Lifestyle', 'News', 'Tutorial', 'Other'] as const;
export const POST_COVERS = ['grove', 'ocean', 'sunset', 'forest', 'berry', 'night'] as const; // gradient when there's no photo
export const POST_STATUSES = ['draft', 'published'] as const;
export const MAX_POST_IMAGES = 8;

// A blog post. The body is plain text with a small Markdown subset (## headings, **bold**, *italic*,
// [links](https://…), - lists, 1. lists, > quotes) — the client renders it without ever using HTML.
const postSchema = new Schema(
  {
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, trim: true, maxlength: 140, default: '' },
    body: { type: String, maxlength: 20000, default: '' },
    excerpt: { type: String, trim: true, maxlength: 240, default: '' }, // written, or taken from the body
    tag: { type: String, enum: POST_TAGS, default: 'Other' },
    coverTheme: { type: String, enum: POST_COVERS, default: 'grove' },
    coverKey: { type: String, default: null }, // uploaded cover photo (uploads/covers/…)
    images: {
      type: [
        new Schema({
          key: { type: String, required: true },
          width: { type: Number, required: true },
          height: { type: Number, required: true },
        }),
      ],
      default: [],
    },
    status: { type: String, enum: POST_STATUSES, default: 'draft' },
    publishedAt: { type: Date, default: null },
    readMinutes: { type: Number, default: 1 },
    likeCount: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },
    engagement: { type: Number, default: 0 }, // likes + 2 × comments — drives "Trending"
    featured: { type: Boolean, default: false }, // pinned by admins (Phase 8)
  },
  { timestamps: true },
);

postSchema.index({ status: 1, publishedAt: -1 }); // Latest
postSchema.index({ status: 1, likeCount: -1, publishedAt: -1 }); // Most liked
postSchema.index({ status: 1, tag: 1, publishedAt: -1 });
postSchema.index({ author: 1, updatedAt: -1 }); // My posts / drafts

export type PostDoc = HydratedDocument<InferSchemaType<typeof postSchema>>;
export const Post = model('Post', postSchema);
