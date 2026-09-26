import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';

export const REPORT_TARGETS = ['post', 'comment', 'user', 'message'] as const;
export const REPORT_REASONS = ['Spam', 'Harassment', 'Misinformation', 'Hate speech', 'Violence', 'Other'] as const;
export const REPORT_STATUSES = ['open', 'resolved', 'dismissed'] as const;

// A user flagging content for the moderators (reviewed in the admin panel, Phase 8).
const reportSchema = new Schema(
  {
    reporter: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    targetType: { type: String, enum: REPORT_TARGETS, required: true },
    target: { type: Schema.Types.ObjectId, required: true },
    post: { type: Schema.Types.ObjectId, ref: 'Post', default: null }, // context: the post (or the comment's post)
    conversation: { type: Schema.Types.ObjectId, ref: 'Conversation', default: null }, // context: a reported message's chat
    snapshot: { type: String, maxlength: 500, default: '' }, // what it said when reported (it may be edited or removed later)
    targetAuthor: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    reason: { type: String, enum: REPORT_REASONS, required: true },
    details: { type: String, trim: true, maxlength: 500, default: '' },
    status: { type: String, enum: REPORT_STATUSES, default: 'open' },
    resolution: { type: String, enum: ['dismissed', 'removed', 'warned', 'banned', null], default: null },
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    resolvedAt: { type: Date, default: null },
    note: { type: String, trim: true, maxlength: 300, default: '' }, // the moderator's note
  },
  { timestamps: true },
);

reportSchema.index({ reporter: 1, targetType: 1, target: 1 }, { unique: true }); // one report per person per thing
reportSchema.index({ status: 1, createdAt: -1 }); // the moderators' queue
reportSchema.index({ targetType: 1, target: 1, status: 1 });

export type ReportDoc = HydratedDocument<InferSchemaType<typeof reportSchema>>;
export const Report = model('Report', reportSchema);
