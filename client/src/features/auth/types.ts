// Mirrors the server's toPublicUser() shape.
export type Role = 'super_admin' | 'content_mod' | 'community_mgr' | 'user';
export type UserStatus = 'active' | 'suspended' | 'banned';

export type User = {
  id: string;
  username: string;
  displayName: string;
  email: string;
  role: Role;
  status: UserStatus;
  emailVerified: boolean;
  avatarUrl: string | null;
  bio: string;
  authProvider: 'local' | 'google' | 'github';
  lastSeenAt: string | null;
  createdAt: string;
};
