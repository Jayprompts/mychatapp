import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';

export const AUDIT_ACTIONS = [
  'user.suspend',
  'user.ban',
  'user.activate',
  'user.delete',
  'user.role',
  'user.warn',
  'post.feature',
  'post.unfeature',
  'post.unpublish',
  'post.delete',
  'comment.delete',
  'message.delete',
  'community.feature',
  'community.unfeature',
  'community.delete',
  'community.member_role',
  'community.member_remove',
  'report.dismiss',
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

// Every admin action, kept for accountability: who did what to what, and when.
const auditSchema = new Schema(
  {
    actor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    actorName: { type: String, default: '' }, // snapshot — readable even if the admin is later deleted
    action: { type: String, enum: AUDIT_ACTIONS, required: true },
    targetType: { type: String, enum: ['user', 'post', 'comment', 'message', 'community', 'report'], required: true },
    targetId: { type: Schema.Types.ObjectId, required: true },
    targetLabel: { type: String, default: '' }, // "@john" / post title / community name, at the time
    details: { type: Schema.Types.Mixed, default: null }, // e.g. { from: 'user', to: 'content_mod' } or { reason }
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

auditSchema.index({ createdAt: -1 });
auditSchema.index({ actor: 1, createdAt: -1 });
auditSchema.index({ action: 1, createdAt: -1 });

export type AuditDoc = HydratedDocument<InferSchemaType<typeof auditSchema>>;
export const AuditLog = model('AuditLog', auditSchema);
