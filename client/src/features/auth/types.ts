// Mirrors the server's toPublicUser() shape.
export type Role = 'super_admin' | 'content_mod' | 'community_mgr' | 'user';
export type UserStatus = 'active' | 'suspended' | 'banned' | 'deleted';

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
  website: string;
  location: string;
  showOnlineStatus: boolean;
  notificationPrefs: { messages: boolean; social: boolean; communities: boolean };
  passwordChangedAt: string | null;
  authProvider: 'local' | 'google' | 'github';
  lastSeenAt: string | null;
  createdAt: string;
};
