import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';

// Site-wide roles (RBAC). Community-level roles (owner/admin/member) live on the Community model.
export const ROLES = ['super_admin', 'content_mod', 'community_mgr', 'user'] as const;
export type Role = (typeof ROLES)[number];

export const USER_STATUSES = ['active', 'suspended', 'banned'] as const;
export const AUTH_PROVIDERS = ['local', 'google', 'github'] as const;

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 30,
      match: /^[a-z0-9_.]+$/,
    },
    displayName: { type: String, required: true, trim: true, maxlength: 50 },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, select: false }, // optional: OAuth users have none
    authProvider: { type: String, enum: AUTH_PROVIDERS, default: 'local' },
    role: { type: String, enum: ROLES, default: 'user', index: true },
    status: { type: String, enum: USER_STATUSES, default: 'active' },
    emailVerified: { type: Boolean, default: false },
    avatarUrl: { type: String, default: null },
    bio: { type: String, maxlength: 160, default: '' },
    lastSeenAt: { type: Date, default: null },
    // Bumping this invalidates every token issued before (logout-all, ban, role change)
    tokenVersion: { type: Number, default: 0, select: false },
  },
  { timestamps: true },
);

export type UserFields = InferSchemaType<typeof userSchema>;
export type UserDoc = HydratedDocument<UserFields>;

export const User = model('User', userSchema);

// The ONLY shape of a user the API ever sends out — never leaks hashes or internals.
export function toPublicUser(user: UserDoc) {
  return {
    id: user._id.toString(),
    username: user.username,
    displayName: user.displayName,
    email: user.email,
    role: user.role,
    status: user.status,
    emailVerified: user.emailVerified,
    avatarUrl: user.avatarUrl ?? null,
    bio: user.bio ?? '',
    authProvider: user.authProvider,
    lastSeenAt: user.lastSeenAt ?? null,
    createdAt: user.createdAt,
  };
}

export type PublicUser = ReturnType<typeof toPublicUser>;
