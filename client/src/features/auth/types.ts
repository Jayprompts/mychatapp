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
  authProvider: 'local' | 'google' | 'github'; // how the account was created
  linkedProviders: OAuthProvider[]; // Google/GitHub accounts that can sign in to it
  lastSeenAt: string | null;
  createdAt: string;
};

export type OAuthProvider = 'google' | 'github';
export type PendingOAuth = { provider: OAuthProvider; email: string; name: string; picture: string | null; suggestion: string; next: string };
