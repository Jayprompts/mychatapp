import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';

// Blog comments, one level deep (per the design): a reply to a reply joins the same thread,
// remembering who it answers ("Replying to @ana").
const commentSchema = new Schema(
  {
    post: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    parent: { type: Schema.Types.ObjectId, ref: 'Comment', default: null }, // the thread's first comment
    replyTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    body: { type: String, maxlength: 2000, default: '' },
    likeCount: { type: Number, default: 0 },
    editedAt: { type: Date, default: null },
    // A deleted comment that still has replies stays as "Comment deleted" so the thread makes sense.
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

commentSchema.index({ post: 1, parent: 1, _id: 1 }); // threads in order, replies per thread

export type CommentDoc = HydratedDocument<InferSchemaType<typeof commentSchema>>;
export const Comment = model('Comment', commentSchema);
