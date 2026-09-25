import { Schema, model } from 'mongoose';

// One row per (post, user) — the unique index makes double-likes impossible, even from two tabs at once.
const postLikeSchema = new Schema(
  {
    post: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
postLikeSchema.index({ post: 1, user: 1 }, { unique: true });
postLikeSchema.index({ user: 1 });

export const PostLike = model('PostLike', postLikeSchema);
