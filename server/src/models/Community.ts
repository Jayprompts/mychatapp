import crypto from 'node:crypto';
import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';

export const COMMUNITY_CATEGORIES = ['Design', 'Tech', 'Gaming', 'Sports', 'Music', 'Art', 'Education', 'Business', 'Lifestyle', 'Other'] as const;
export const COMMUNITY_THEMES = ['grove', 'ocean', 'sunset', 'forest', 'berry', 'night'] as const; // cover gradients
export const VISIBILITIES = ['public', 'private'] as const;

export const newInviteCode = () => crypto.randomBytes(6).toString('base64url'); // 8 URL-safe chars

// A discoverable space around a chat. Members, roles and messages live on its conversation
// (type 'community'); this holds what makes it findable and joinable.
const communitySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 3, maxlength: 50 },
    description: { type: String, trim: true, maxlength: 300, default: '' },
    category: { type: String, enum: COMMUNITY_CATEGORIES, required: true },
    visibility: { type: String, enum: VISIBILITIES, default: 'public' },
    icon: { type: String, default: '🌱', maxlength: 16 }, // emoji
    theme: { type: String, enum: COMMUNITY_THEMES, default: 'grove' },
    coverKey: { type: String, default: null }, // optional uploaded cover photo (uploads/covers/…)
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    conversation: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true, unique: true },
    memberCount: { type: Number, default: 1 },
    inviteCode: { type: String, required: true, unique: true, default: newInviteCode },
    joinRequests: {
      type: [
        new Schema(
          { user: { type: Schema.Types.ObjectId, ref: 'User', required: true }, requestedAt: { type: Date, default: Date.now } },
          { _id: false },
        ),
      ],
      default: [],
    },
    featured: { type: Boolean, default: false }, // set by admins (Phase 8)
  },
  { timestamps: true },
);

communitySchema.index({ memberCount: -1, _id: -1 }); // Discover: biggest first
communitySchema.index({ category: 1, memberCount: -1 });

export type CommunityDoc = HydratedDocument<InferSchemaType<typeof communitySchema>>;
export const Community = model('Community', communitySchema);
