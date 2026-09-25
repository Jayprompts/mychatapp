import { Schema, model } from 'mongoose';

// "Saved posts": one row per (user, post), newest first.
const bookmarkSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    post: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
bookmarkSchema.index({ user: 1, post: 1 }, { unique: true });
bookmarkSchema.index({ user: 1, createdAt: -1 });
bookmarkSchema.index({ post: 1 });

export const Bookmark = model('Bookmark', bookmarkSchema);
