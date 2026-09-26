import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';

export const NOTIFICATION_TYPES = [
  'post_like', // someone liked your post              (grouped: "Bob and 3 others")
  'post_comment', // someone commented on your post
  'comment_reply', // someone replied to your comment
  'comment_like', // someone liked your comment         (grouped)
  'mention', // @you in a comment or a group/community chat
  'community_join', // someone joined a community you manage (grouped)
  'community_request', // someone asked to join (private)    (grouped)
  'request_approved', // your request to join was approved
  'group_added', // someone added you to a group / community chat
  'moderation', // from the Grove team: your content was removed / a warning (always sent; moderator not shown)
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

// Which setting (Settings ▸ Notifications) each kind belongs to.
export const NOTIFICATION_CATEGORY: Record<NotificationType, 'messages' | 'social' | 'communities' | 'always'> = {
  post_like: 'social',
  post_comment: 'social',
  comment_reply: 'social',
  comment_like: 'social',
  mention: 'messages',
  community_join: 'communities',
  community_request: 'communities',
  request_approved: 'communities',
  group_added: 'messages',
  moderation: 'always',
};

const notificationSchema = new Schema(
  {
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    actors: { type: [Schema.Types.ObjectId], default: [] }, // newest first
    // Unread notifications with the same key merge ("Bob and 3 others liked your post").
    groupKey: { type: String, default: null },
    post: { type: Schema.Types.ObjectId, ref: 'Post', default: null },
    comment: { type: Schema.Types.ObjectId, ref: 'Comment', default: null },
    community: { type: Schema.Types.ObjectId, ref: 'Community', default: null },
    conversation: { type: Schema.Types.ObjectId, ref: 'Conversation', default: null },
    title: { type: String, maxlength: 140, default: '' }, // post title / community or group name, at the time
    preview: { type: String, maxlength: 140, default: '' }, // comment or message excerpt
    readAt: { type: Date, default: null },
  },
  { timestamps: true },
);

notificationSchema.index({ recipient: 1, updatedAt: -1 });
notificationSchema.index({ recipient: 1, readAt: 1 });
notificationSchema.index({ recipient: 1, groupKey: 1, readAt: 1 });
notificationSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 }); // old ones tidy themselves away

export type NotificationDoc = HydratedDocument<InferSchemaType<typeof notificationSchema>>;
export const Notification = model('Notification', notificationSchema);
