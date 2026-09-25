import { Schema, model } from 'mongoose';

const commentLikeSchema = new Schema(
  {
    comment: { type: Schema.Types.ObjectId, ref: 'Comment', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
commentLikeSchema.index({ comment: 1, user: 1 }, { unique: true });

export const CommentLike = model('CommentLike', commentLikeSchema);
